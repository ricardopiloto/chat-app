use crate::db;
use crate::AppState;
use serde::Serialize;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Clone, Default)]
pub struct WsHub {
    inner: Arc<Mutex<HashMap<Uuid, Vec<mpsc::UnboundedSender<String>>>>>,
}

impl WsHub {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn subscribe(&self, account_id: Uuid) -> mpsc::UnboundedReceiver<String> {
        let (tx, rx) = mpsc::unbounded_channel();
        let mut map = self.inner.lock().expect("ws hub");
        map.entry(account_id).or_default().push(tx);
        rx
    }

    pub fn unsubscribe(&self, account_id: Uuid, remaining_ok: bool) {
        let mut map = self.inner.lock().expect("ws hub");
        if let Some(list) = map.get_mut(&account_id) {
            list.retain(|tx| remaining_ok && !tx.is_closed());
            if list.is_empty() {
                map.remove(&account_id);
            }
        }
    }

    pub fn send_to_account(&self, account_id: Uuid, payload: &str) {
        let mut map = self.inner.lock().expect("ws hub");
        if let Some(list) = map.get_mut(&account_id) {
            list.retain(|tx| tx.send(payload.to_string()).is_ok());
        }
    }

    pub async fn send_to_server_members<T: Serialize>(
        &self,
        pool: &SqlitePool,
        server_id: Uuid,
        event: &str,
        payload: &T,
    ) {
        let envelope = serde_json::json!({
            "event": event,
            "server_id": server_id,
            "payload": payload,
        });
        let body = envelope.to_string();
        let members = match db::membership::list_by_server(pool, server_id).await {
            Ok(m) => m,
            Err(err) => {
                tracing::error!(%err, "ws broadcast membership lookup failed");
                return;
            }
        };
        for member in members {
            self.send_to_account(member.account_id, &body);
        }
    }

    pub fn send_to_accounts<T: Serialize>(&self, account_ids: &[Uuid], event: &str, server_id: Uuid, payload: &T) {
        let envelope = serde_json::json!({
            "event": event,
            "server_id": server_id,
            "payload": payload,
        });
        let body = envelope.to_string();
        for id in account_ids {
            self.send_to_account(*id, &body);
        }
    }
}

pub async fn replay_pending_handoffs(state: &AppState, account_id: Uuid) {
    let Ok(server_ids) = db::membership::list_server_ids_for_account(&state.pool, account_id).await
    else {
        return;
    };
    for server_id in server_ids {
        let Ok(Some(me)) = db::membership::find(&state.pool, account_id, server_id).await else {
            continue;
        };
        if me.key_handoff_status != crate::domain::membership::KeyHandoffStatus::Synced {
            continue;
        }
        let Ok(pending) = db::membership::list_pending(&state.pool, server_id).await else {
            continue;
        };
        for member in pending {
            if let Ok(Some(account)) = db::account::find_by_id(&state.pool, member.account_id).await
            {
                use base64::Engine;
                let pubkey = base64::engine::general_purpose::STANDARD.encode(&account.identity_pubkey);
                state.ws.send_to_accounts(
                    &[account_id],
                    "key_handoff.requested",
                    server_id,
                    &serde_json::json!({
                        "account_id": member.account_id,
                        "identity_pubkey": pubkey,
                    }),
                );
            }
        }
    }
}
