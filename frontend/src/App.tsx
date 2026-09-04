import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Navigate, Route, Router } from "@solidjs/router";
import { api, type Account } from "./api/client";
import { connectWs, type WsEnvelope } from "./api/ws";
import {
  b64,
  generateIdentity,
  persistIdentity,
  unlockIdentity,
  wrapIdentity,
  type Identity,
} from "./crypto/identity";
import { handleHandoffEvent, loadAllServerKeys } from "./crypto/keyHandoff";
import AppShell from "./shell/AppShell";
import { bootTheme } from "./theme/theme";
import Auth from "./pages/Auth";
import Servers from "./pages/Servers";
import ChannelRoute from "./pages/ChannelRoute";
import Invite from "./pages/Invite";

export default function App() {
  const [me, setMe] = createSignal<Account | null>(null);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [ready, setReady] = createSignal(false);
  const listeners = new Set<(msg: WsEnvelope) => void>();
  let ignoreBootMe = false;

  function onWs(handler: (msg: WsEnvelope) => void) {
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }

  async function persistVault(account: Account, password: string, id: Identity) {
    if (account.identity_vault) return;
    const vault = await wrapIdentity(id, password);
    try {
      await api("/api/auth/identity-vault", {
        method: "PUT",
        body: JSON.stringify(vault),
      });
      setMe({ ...account, identity_vault: vault });
    } catch (err) {
      console.error("falha ao guardar cofre de identidade no servidor", err);
    }
  }

  async function authed(account: Account, password: string, existing?: Identity) {
    ignoreBootMe = true;
    const id =
      existing ?? (await unlockIdentity(password, account.id, account.identity_vault));
    setIdentity(id);
    setMe(account);
    await persistVault(account, password, id);
  }

  async function recoverIdentity(account: Account, password: string) {
    ignoreBootMe = true;
    const identity = generateIdentity();
    const vault = await persistIdentity(account.id, identity, password);
    const updated = await api<Account>("/api/auth/identity", {
      method: "PUT",
      body: JSON.stringify({
        identity_pubkey: b64(identity.publicKey),
        identity_vault: vault,
      }),
    });
    setIdentity(identity);
    setMe({ ...updated, identity_vault: vault });
  }

  createEffect(() => {
    bootTheme(document.querySelector(".app") as HTMLElement | null);
    void api<Account | undefined>("/api/auth/me")
      .then((account) => {
        if (!ignoreBootMe) setMe(account ?? null);
      })
      .catch(() => {
        if (!ignoreBootMe) setMe(null);
      })
      .finally(() => setReady(true));
  });

  createEffect(() => {
    const account = me();
    const id = identity();
    if (!account || !id) return;
    void loadAllServerKeys(id, account.id);
    const ws = connectWs((msg) => {
      void handleHandoffEvent(msg, id, account.id);
      listeners.forEach((h) => h(msg));
    });
    onCleanup(() => ws.close());
  });

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
    setIdentity(null);
  }

  return (
    <Show when={ready()} fallback={<p class="auth-screen muted">A carregar…</p>}>
      <Router>
        <Route
          path="/auth"
          component={() => (
            <Show
              when={me() && identity()}
              fallback={
                <Auth
                  session={me()}
                  onAuthed={authed}
                  onRecoverIdentity={recoverIdentity}
                  onClearSession={logout}
                />
              }
            >
              <Navigate href="/" />
            </Show>
          )}
        />
        <Route path="/invite/:code" component={() => <Invite me={me()} onAuthed={authed} />} />
        <Route
          path="/"
          component={() => (
            <Show when={me() && identity()} fallback={<Navigate href="/auth" />}>
              <AppShell me={me()!} identity={identity()!} onLogout={() => void logout()} onWs={onWs}>
                <Servers me={me()!} identity={identity()!} />
              </AppShell>
            </Show>
          )}
        />
        <Route
          path="/channels/:id"
          component={() => (
            <Show when={me() && identity()} fallback={<Navigate href="/auth" />}>
              <AppShell me={me()!} identity={identity()!} onLogout={() => void logout()} onWs={onWs}>
                <ChannelRoute onWs={onWs} me={me()!} identity={identity()!} />
              </AppShell>
            </Show>
          )}
        />
      </Router>
    </Show>
  );
}
