//! Synthetic handoff load for password-recovery tasks 5.1–5.3.
//! Run: `cargo test --test scale -- --nocapture`
#[path = "common/mod.rs"]
mod common;

use std::time::Instant;

use axum::http::StatusCode;
use base64::Engine;
use chrono::Utc;
use common::{must_cookie, TestApp};
use serde_json::json;
use sqlx::Row;
use uuid::Uuid;

const SEALED_LEN: usize = 80;

fn p95(samples: &mut [f64]) -> f64 {
    samples.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let index = ((samples.len() as f64) * 0.95).ceil() as usize - 1;
    samples[index]
}

fn blob(byte: u8) -> Vec<u8> {
    vec![byte; SEALED_LEN]
}

async fn mint_session(app: &TestApp, account_id: Uuid) -> String {
    let token = Uuid::new_v4().simple().to_string();
    let hash = chat_backend::api::auth::session::hash_token(&token);
    sqlx::query(
        "INSERT INTO session (id, account_id, token_hash, expires_at, revoked_at, created_at) VALUES (?, ?, ?, '2099-01-01T00:00:00Z', NULL, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(account_id.to_string())
    .bind(hash)
    .bind(Utc::now().to_rfc3339())
    .execute(&app.pool)
    .await
    .unwrap();
    format!("Session={token}")
}

async fn explain_delete(conn: &mut sqlx::SqliteConnection, account_id: &str) -> String {
    let rows = sqlx::query("EXPLAIN QUERY PLAN DELETE FROM key_envelope WHERE account_id = ?")
        .bind(account_id)
        .fetch_all(&mut *conn)
        .await
        .unwrap();
    rows.iter()
        .map(|row| row.try_get::<String, _>("detail").unwrap_or_default())
        .collect::<Vec<_>>()
        .join(" | ")
}

async fn time_delete_rollback(conn: &mut sqlx::SqliteConnection, account_id: &str) -> f64 {
    sqlx::query("BEGIN").execute(&mut *conn).await.unwrap();
    let started = Instant::now();
    sqlx::query("DELETE FROM key_envelope WHERE account_id = ?")
        .bind(account_id)
        .execute(&mut *conn)
        .await
        .unwrap();
    let elapsed = started.elapsed().as_secs_f64() * 1000.0;
    sqlx::query("ROLLBACK").execute(&mut *conn).await.unwrap();
    elapsed
}

#[tokio::test]
async fn handoff_scale_300_and_1000() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("scale_alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice["id"].as_str().unwrap().to_string();
    let members: Vec<String> = (0..1000).map(|_| Uuid::new_v4().to_string()).collect();
    let servers: Vec<String> = (0..20).map(|_| Uuid::new_v4().to_string()).collect();
    let big = Uuid::new_v4().to_string();
    let herd_server = Uuid::new_v4().to_string();
    let herd_target = Uuid::new_v4().to_string();
    let replay_server = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let pubkey = vec![7u8; 32];

    let mut tx = app.pool.begin().await.unwrap();
    for id in members.iter().chain(std::iter::once(&herd_target)) {
        sqlx::query(
            "INSERT INTO account (id, handle, password_hash, identity_pubkey, created_at) VALUES (?, ?, 'x', ?, ?)",
        )
        .bind(id)
        .bind(format!("m{id}"))
        .bind(&pubkey)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    for (index, server_id) in servers.iter().enumerate() {
        sqlx::query(
            "INSERT INTO server (id, name, owner_account_id, created_at) VALUES (?, ?, ?, ?)",
        )
        .bind(server_id)
        .bind(format!("s{index}"))
        .bind(&alice_id)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
        )
        .bind(&alice_id)
        .bind(server_id)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(server_id)
        .bind(&alice_id)
        .bind(blob(1))
        .bind(&alice_id)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
        for member in &members[..299] {
            sqlx::query(
                "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
            )
            .bind(member)
            .bind(server_id)
            .bind(&now)
            .execute(&mut *tx)
            .await
            .unwrap();
            sqlx::query(
                "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(server_id)
            .bind(member)
            .bind(blob(2))
            .bind(member)
            .bind(&now)
            .execute(&mut *tx)
            .await
            .unwrap();
        }
    }
    sqlx::query(
        "INSERT INTO server (id, name, owner_account_id, created_at) VALUES (?, 'big', ?, ?)",
    )
    .bind(&big)
    .bind(&alice_id)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    for member in &members {
        sqlx::query(
            "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
        )
        .bind(member)
        .bind(&big)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(&big)
        .bind(member)
        .bind(blob(3))
        .bind(member)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    sqlx::query(
        "INSERT INTO server (id, name, owner_account_id, created_at) VALUES (?, 'herd', ?, ?)",
    )
    .bind(&herd_server)
    .bind(&alice_id)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'pending')",
    )
    .bind(&herd_target)
    .bind(&herd_server)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    for member in &members[..300] {
        sqlx::query(
            "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
        )
        .bind(member)
        .bind(&herd_server)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    let replay_owner = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO account (id, handle, password_hash, identity_pubkey, created_at) VALUES (?, ?, 'x', ?, ?)",
    )
    .bind(&replay_owner)
    .bind(format!("replay{replay_owner}"))
    .bind(&pubkey)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO server (id, name, owner_account_id, created_at) VALUES (?, 'replay', ?, ?)",
    )
    .bind(&replay_server)
    .bind(&replay_owner)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
    )
    .bind(&replay_owner)
    .bind(&replay_server)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .unwrap();
    for member in &members[300..549] {
        sqlx::query(
            "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
        )
        .bind(member)
        .bind(&replay_server)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    for member in &members[549..599] {
        sqlx::query(
            "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'pending')",
        )
        .bind(member)
        .bind(&replay_server)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    tx.commit().await.unwrap();

    let (memberships,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM membership WHERE server_id = ?")
            .bind(&servers[0])
            .fetch_one(&app.pool)
            .await
            .unwrap();
    let (big_envelopes,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM key_envelope WHERE server_id = ?")
            .bind(&big)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    let (subject_servers,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM membership WHERE account_id = ?")
            .bind(&alice_id)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(memberships, 300, "server of 300");
    assert_eq!(big_envelopes, 1000, "1000 envelopes");
    assert_eq!(subject_servers, 20, "subject in 20 servers");
    let (seal_len,): (i64,) = sqlx::query_as("SELECT length(sealed_key) FROM key_envelope LIMIT 1")
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(seal_len, SEALED_LEN as i64);

    let mut conn = app.pool.acquire().await.unwrap();
    sqlx::query("DROP INDEX idx_key_envelope_account")
        .execute(&mut *conn)
        .await
        .unwrap();
    let explain_without = explain_delete(&mut conn, &alice_id).await;
    let mut delete_without = Vec::new();
    for _ in 0..5 {
        delete_without.push(time_delete_rollback(&mut conn, &alice_id).await);
    }
    sqlx::query("CREATE INDEX idx_key_envelope_account ON key_envelope(account_id)")
        .execute(&mut *conn)
        .await
        .unwrap();
    let explain_with = explain_delete(&mut conn, &alice_id).await;
    let mut delete_with = Vec::new();
    for _ in 0..5 {
        delete_with.push(time_delete_rollback(&mut conn, &alice_id).await);
    }
    drop(conn);

    let mut sockets = Vec::new();
    for member in &members[..299] {
        sockets.push(
            app.state
                .ws
                .subscribe(Uuid::parse_str(member).unwrap(), Uuid::new_v4()),
        );
    }
    let mut replacement = Vec::new();
    let mut event_count = 0usize;
    for sample in 0..5 {
        for server_id in &servers {
            sqlx::query("UPDATE membership SET key_handoff_status = 'synced' WHERE account_id = ? AND server_id = ?")
                .bind(&alice_id)
                .bind(server_id)
                .execute(&app.pool)
                .await
                .unwrap();
            sqlx::query(
                "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(server_id, account_id) DO UPDATE SET sealed_key = excluded.sealed_key",
            )
            .bind(server_id)
            .bind(&alice_id)
            .bind(blob(1))
            .bind(&alice_id)
            .bind(&now)
            .execute(&app.pool)
            .await
            .unwrap();
        }
        let byte = 10 + sample as u8;
        let body = json!({
            "identity_pubkey": base64::engine::general_purpose::STANDARD.encode(vec![byte; 32]),
            "identity_vault": {"v": 1, "publicKey": vec![byte; 32], "salt": [1], "iv": [2], "wrapped": [3]},
        });
        let started = Instant::now();
        let (status, response, _) = app
            .request("PUT", "/api/auth/identity", Some(body), Some(&cookie))
            .await;
        replacement.push(started.elapsed().as_secs_f64() * 1000.0);
        assert_eq!(status, StatusCode::OK, "{response}");
        if sample == 0 {
            for socket in &mut sockets {
                while socket.messages.try_recv().is_ok() {
                    event_count += 1;
                }
            }
        }
    }
    assert_eq!(
        event_count,
        299 * 20,
        "one requested event per synced member on each of the 20 servers"
    );

    let big_cookie_owner = mint_session(&app, Uuid::parse_str(&alice_id).unwrap()).await;
    sqlx::query(
        "INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, ?, 'synced')",
    )
    .bind(&alice_id)
    .bind(&big)
    .bind(&now)
    .execute(&app.pool)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&big)
    .bind(&alice_id)
    .bind(blob(9))
    .bind(&alice_id)
    .bind(&now)
    .execute(&app.pool)
    .await
    .unwrap();
    let mut guard = Vec::new();
    for _ in 0..20 {
        let started = Instant::now();
        let (status, _, _) = app
            .request(
                "POST",
                &format!("/api/servers/{big}/key-envelopes"),
                Some(json!({ "account_id": alice_id, "sealed_key": base64::engine::general_purpose::STANDARD.encode(blob(4)) })),
                Some(&big_cookie_owner),
            )
            .await;
        guard.push(started.elapsed().as_secs_f64() * 1000.0);
        assert_eq!(status, StatusCode::CONFLICT);
    }

    let mut herd_cookies = Vec::with_capacity(300);
    for member in &members[..300] {
        herd_cookies.push(mint_session(&app, Uuid::parse_str(member).unwrap()).await);
    }
    let herd_path = format!("/api/servers/{herd_server}/key-envelopes");
    let app_ref = &app;
    let posts: Vec<_> = herd_cookies
        .iter()
        .enumerate()
        .map(|(index, session)| {
            let path = herd_path.clone();
            let session = session.clone();
            let body = json!({
                "account_id": herd_target,
                "sealed_key": base64::engine::general_purpose::STANDARD.encode(blob(index as u8)),
            });
            async move {
                app_ref
                    .request("POST", &path, Some(body), Some(&session))
                    .await
            }
        })
        .collect();
    let started = Instant::now();
    let results = futures_util::future::join_all(posts).await;
    let herd_ms = started.elapsed().as_secs_f64() * 1000.0 / results.len() as f64;
    let created = results
        .iter()
        .filter(|(status, _, _)| *status == StatusCode::CREATED)
        .count();
    let refused = results.len() - created;
    let (stored,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM key_envelope WHERE server_id = ? AND account_id = ?")
            .bind(&herd_server)
            .bind(&herd_target)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(created, 1, "one handoff writer");
    assert_eq!(stored, 1);

    let replay_id = Uuid::parse_str(&replay_owner).unwrap();
    let mut replay_socket = app.state.ws.subscribe(replay_id, Uuid::new_v4());
    let mut replay = Vec::new();
    for _ in 0..5 {
        let started = Instant::now();
        chat_backend::ws::replay_pending_handoffs(&app.state, replay_id).await;
        replay.push(started.elapsed().as_secs_f64() * 1000.0);
    }
    let mut replay_events = 0usize;
    while replay_socket.messages.try_recv().is_ok() {
        replay_events += 1;
    }
    assert_eq!(
        replay_events,
        50 * 5,
        "one event per pending member per replay"
    );
    assert!(
        !explain_without.contains("idx_key_envelope_account"),
        "{explain_without}"
    );
    assert!(
        explain_with.contains("idx_key_envelope_account"),
        "{explain_with}"
    );

    let (version,): (String,) = sqlx::query_as("SELECT sqlite_version()")
        .fetch_one(&app.pool)
        .await
        .unwrap();
    println!("SCALE sqlite={version}");
    println!(
        "SCALE delete_without_index_p95_ms={:.3} plan={explain_without}",
        p95(&mut delete_without)
    );
    println!(
        "SCALE delete_with_index_p95_ms={:.3} plan={explain_with}",
        p95(&mut delete_with)
    );
    println!(
        "SCALE identity_replacement_p95_ms={:.3} events_one_server={event_count}",
        p95(&mut replacement)
    );
    println!(
        "SCALE own_envelope_guard_p95_ms={:.3} envelopes=1001",
        p95(&mut guard)
    );
    println!("SCALE herd_mean_ms={herd_ms:.3} created={created} refused={refused}");
    println!(
        "SCALE replay_p95_ms={:.3} events={replay_events}",
        p95(&mut replay)
    );
}
