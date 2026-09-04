import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Navigate, Route, Router } from "@solidjs/router";
import { api, type Account } from "./api/client";
import { connectWs, type WsEnvelope } from "./api/ws";
import { unlockIdentity, wrapIdentity, type Identity } from "./crypto/identity";
import { handleHandoffEvent, loadAllServerKeys } from "./crypto/keyHandoff";
import Auth from "./pages/Auth";
import Servers from "./pages/Servers";
import ChannelRoute from "./pages/ChannelRoute";
import Invite from "./pages/Invite";

export default function App() {
  const [me, setMe] = createSignal<Account | null>(null);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [ready, setReady] = createSignal(false);
  const listeners = new Set<(msg: WsEnvelope) => void>();

  function onWs(handler: (msg: WsEnvelope) => void) {
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }

  async function authed(account: Account, password: string, existing?: Identity) {
    const id =
      existing ?? (await unlockIdentity(password, account.id, account.identity_vault));
    setIdentity(id);
    setMe(account);
    if (!account.identity_vault) {
      const vault = await wrapIdentity(id, password);
      await api("/api/auth/identity-vault", {
        method: "PUT",
        body: JSON.stringify(vault),
      }).catch(() => undefined);
      setMe({ ...account, identity_vault: vault });
    }
  }

  createEffect(() => {
    void api<Account>("/api/auth/me")
      .then((account) => setMe(account))
      .catch(() => setMe(null))
      .finally(() => setReady(true));
  });

  createEffect(() => {
    const account = me();
    const id = identity();
    if (!account || !id) return;
    void loadAllServerKeys(id);
    const ws = connectWs((msg) => {
      void handleHandoffEvent(msg, id, account.id);
      listeners.forEach((h) => h(msg));
    });
    onCleanup(() => ws.close());
  });

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setMe(null);
    setIdentity(null);
  }

  return (
    <Show when={ready()} fallback={<p class="main">A carregar…</p>}>
      <Router>
        <Route
          path="/auth"
          component={() => (
            <Show
              when={me() && identity()}
              fallback={<Auth session={me()} onAuthed={authed} onClearSession={logout} />}
            >
              <Navigate href="/" />
            </Show>
          )}
        />
        <Route
          path="/invite/:code"
          component={() => (
            <Invite me={me()} onAuthed={authed} />
          )}
        />
        <Route
          path="/"
          component={() => (
            <Show when={me() && identity()} fallback={<Navigate href="/auth" />}>
              <header class="row" style={{ padding: "0.75rem 1rem" }}>
                <strong>{me()!.handle}</strong>
                <button type="button" class="secondary" onClick={() => void logout()}>
                  Sair
                </button>
              </header>
              <Servers me={me()!} identity={identity()!} />
            </Show>
          )}
        />
        <Route
          path="/channels/:id"
          component={() => (
            <Show when={me() && identity()} fallback={<Navigate href="/auth" />}>
              <ChannelRoute onWs={onWs} me={me()!} identity={identity()!} />
            </Show>
          )}
        />
      </Router>
    </Show>
  );
}
