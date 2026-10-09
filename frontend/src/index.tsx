import { render } from "solid-js/web";
import { Match, Switch, createSignal, onCleanup, onMount } from "solid-js";
import { Route, Router, useLocation } from "@solidjs/router";
import { AppQueryProvider } from "./api";
import { AppShell } from "./shell/AppShell";
import { Auth } from "./pages/Auth";
import { Recover } from "./pages/Recover";
import { Foundation } from "./pages/Foundation";
import { Invite } from "./pages/Invite";
import { Unlock } from "./pages/Unlock";
import { InstanceConnect } from "./auth/InstanceConnect";
import { currentInstance, isNative, loadInstance, subscribeInstance } from "./api/instance";
import { SessionProvider, useSession } from "./session/session";
import { applyTheme, themeMode, watchSystemTheme } from "./shell/theme";
import { t } from "./i18n";
import { captureInviteFragment } from "./crypto/inviteLink";

captureInviteFragment();
import "./tokens.css";
import "./styles.css";
import "./components/ui.css";
import "./voice.css";
import "./mgmt.css";
import "./chat.css";

applyTheme(themeMode());

// The screen follows the session: no account → sign in, account without an unlocked identity →
// unlock, both → the application. `/__foundation` is the component gallery and needs no session.
function Gate() {
  const session = useSession();
  const where = useLocation();
  const [pickInstance, setPickInstance] = createSignal<boolean | null>(isNative() ? null : false);
  onMount(() => {
    onCleanup(watchSystemTheme(themeMode));
    if (!isNative()) return;
    void loadInstance().then((saved) => setPickInstance(!saved.baseUrl));
    onCleanup(subscribeInstance(() => setPickInstance(!currentInstance().baseUrl)));
  });
  return (
    <Switch>
      <Match when={where.pathname === "/__foundation"}>
        <Foundation />
      </Match>
      <Match when={pickInstance() === true}>
        <InstanceConnect onSaved={() => void session.restore()} />
      </Match>
      <Match when={pickInstance() === null || session.phase() === "loading"}>
        <main class="grid min-h-dvh place-items-center bg-background text-on-surface-variant">{t("auth.loading")}</main>
      </Match>
      <Match when={where.pathname.startsWith("/invite/") && !where.search.includes("signin") && ["anonymous", "ready"].includes(session.phase())}>
        <Invite />
      </Match>
      <Match when={session.phase() === "anonymous" && where.pathname === "/recover"}>
        <Recover />
      </Match>
      <Match when={session.phase() === "anonymous"}>
        <Auth />
      </Match>
      <Match when={session.phase() === "locked"}>
        <Unlock />
      </Match>
      <Match when={session.phase() === "ready"}>
        <AppShell />
      </Match>
    </Switch>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
render(
  () => (
    <AppQueryProvider>
      <SessionProvider>
        <Router root={Gate}>
          <Route path="*" component={() => null} />
        </Router>
      </SessionProvider>
    </AppQueryProvider>
  ),
  root,
);
