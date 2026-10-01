import { render } from "solid-js/web";
import { Show, createEffect, createSignal } from "solid-js";
import { Route, Router } from "@solidjs/router";
import { AppQueryProvider } from "./api/query";
import { api, type Account } from "./api/client";
import {
  b64,
  generateIdentity,
  persistIdentity,
  unlockIdentity,
  wrapIdentity,
  type Identity,
} from "./crypto/identity";
import { Auth } from "./pages/Auth";
import { AppShell } from "./shell/AppShell";
import { t } from "./i18n";
import "./styles.css";
import "./components/ui.css";

function Application() {
  const [account, setAccount] = createSignal<Account | null>(null);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [ready, setReady] = createSignal(false);
  createEffect(() => {
    void api<Account>("/api/auth/me")
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setReady(true));
  });
  async function authenticate(
    me: Account,
    password: string,
    existing?: Identity,
  ) {
    const id =
      existing ?? (await unlockIdentity(password, me.id, me.identity_vault));
    if (!me.identity_vault) {
      const vault = await wrapIdentity(id, password);
      await api("/api/auth/identity-vault", {
        method: "PUT",
        body: JSON.stringify(vault),
      });
      me = { ...me, identity_vault: vault };
    }
    setAccount(me);
    setIdentity(id);
  }
  async function recover(me: Account, password: string) {
    const id = generateIdentity();
    const vault = await wrapIdentity(id, password);
    const updated = await api<Account>("/api/auth/identity", {
      method: "PUT",
      body: JSON.stringify({
        identity_pubkey: b64(id.publicKey),
        identity_vault: vault,
      }),
    });
    await persistIdentity(me.id, id, password);
    setAccount({ ...updated, identity_vault: vault });
    setIdentity(id);
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setAccount(null);
    setIdentity(null);
  }
  const gate = () => (
    <Show
      when={ready()}
      fallback={<main class="auth-page">{t("auth.loading")}</main>}
    >
      <Show
        when={account() && identity()}
        fallback={
          <Auth
            session={account()}
            onAuthed={authenticate}
            onRecover={recover}
            onSwitch={logout}
          />
        }
      >
        <AppShell
          account={account()!}
          identity={identity()!}
          onLogout={logout}
        />
      </Show>
    </Show>
  );
  return (
    <Router root={gate}>
      <Route
        path={[
          "/",
          "/auth",
          "/invite/:code",
          "/servers/:serverId",
          "/servers/:serverId/channels/:channelId",
          "*",
        ]}
        component={() => null}
      />
    </Router>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
render(
  () => (
    <AppQueryProvider>
      <Application />
    </AppQueryProvider>
  ),
  root,
);
