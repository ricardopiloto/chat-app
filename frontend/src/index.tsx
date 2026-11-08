import { render } from "solid-js/web";
import { Match, Switch, Suspense, lazy, createSignal, onCleanup, onMount } from "solid-js";
import { Route, Router, useLocation } from "@solidjs/router";
import { AppQueryProvider } from "./api";
import { AppShell } from "./shell/AppShell";
import { Auth } from "./pages/Auth";
import { Recover } from "./pages/Recover";
import { Foundation } from "./pages/Foundation";
import { Invite } from "./pages/Invite";
import { CallPopoutWindow } from "./voice/CallPopoutWindow";
import { Unlock } from "./pages/Unlock";
import { entryScreen } from "./auth/entryScreen";
import { nativeEntry, setNativeEntry } from "./auth/nativeEntry";
import { readInstanceStatus, resetInstanceStatus } from "./auth/instanceStatus";
const WebPublicHome = lazy(() => import("./pages/WebPublicHome").then((m) => ({ default: m.WebPublicHome })));
const ElectronHome = lazy(() => import("./pages/ElectronHome").then((m) => ({ default: m.ElectronHome })));
const TitleBar = lazy(() => import("./shell/TitleBar").then((m) => ({ default: m.TitleBar })));
import { currentInstance, isNative, loadInstance, subscribeInstance } from "./api/instance";
import { SessionProvider, useSession } from "./session/session";
import { applyTheme, themeMode, watchSystemTheme } from "./shell/theme";
import { t } from "./i18n";
import { captureInviteFragment } from "./crypto/inviteLink";

captureInviteFragment();
import "./tokens.css";
import "./styles.css";
import "./components/ui.css";
import "./entry.css";
import "./voice.css";
import "./mgmt.css";
import "./chat.css";

applyTheme(themeMode());

// The screen follows the session: no account → sign in, account without an unlocked identity →
// unlock, both → the application. `/__foundation` is the component gallery and needs no session.
function popoutChannelId(pathname: string, hash: string): string | null {
  const path = pathname.match(/^\/call-popout\/([^/]+)/);
  if (path?.[1]) return decodeURIComponent(path[1]);
  const hashed = hash.match(/^#\/call-popout\/([^/]+)/);
  return hashed?.[1] ? decodeURIComponent(hashed[1]) : null;
}

function Gate() {
  const session = useSession();
  const where = useLocation();
  const native = isNative();
  const [baseUrl, setBaseUrl] = createSignal<string | null>(native ? null : "web");
  const [initialSetup, setInitialSetup] = createSignal(false);
  const [instanceLoaded, setInstanceLoaded] = createSignal(!native);
  let lastPhase = session.phase();
  onMount(() => {
    onCleanup(watchSystemTheme(themeMode));
    if (native) {
      void loadInstance().then((saved) => { setBaseUrl(saved.baseUrl); setInstanceLoaded(true); });
      onCleanup(subscribeInstance(() => { setBaseUrl(currentInstance().baseUrl); resetInstanceStatus(); setNativeEntry("home"); }));
    }
    if (!native && where.pathname === "/") void readInstanceStatus().then((value) => setInitialSetup(value?.initial_setup === true));
  });
  const destination = () => {
    const phase = session.phase();
    if ((lastPhase === "locked" || lastPhase === "ready") && phase === "anonymous") setInitialSetup(false);
    if (native && (lastPhase === "locked" || lastPhase === "ready") && phase === "anonymous") setNativeEntry("home");
    lastPhase = phase;
    return entryScreen({ native, baseUrl: native && !instanceLoaded() ? null : baseUrl(), phase, pathname: where.pathname, search: where.search, hash: where.hash, initialSetup: initialSetup(), nativeEntry: nativeEntry() });
  };
  const loading = <main class="grid min-h-[calc(100dvh-var(--mesa-title-bar))] place-items-center bg-background text-on-surface-variant">{t("auth.loading")}</main>;
  const screen = <Switch>
    <Match when={destination() === "foundation"}><Foundation /></Match>
    <Match when={destination() === "home-desktop"}><Suspense fallback={loading}><ElectronHome baseUrl={baseUrl()} onSaved={() => void session.restore()} /></Suspense></Match>
    <Match when={destination() === "home-web"}><Suspense fallback={loading}><WebPublicHome /></Suspense></Match>
    <Match when={destination() === "loading"}>{loading}</Match>
    <Match when={destination() === "invite"}><Invite /></Match>
    <Match when={destination() === "recover"}><Recover /></Match>
    <Match when={destination() === "auth"}><Auth /></Match>
    <Match when={destination() === "call-popout"}>{(popoutChannelId(where.pathname, where.hash)) && <CallPopoutWindow channelId={popoutChannelId(where.pathname, where.hash)!} />}</Match>
    <Match when={destination() === "unlock"}><Unlock /></Match>
    <Match when={destination() === "app"}><AppShell /></Match>
  </Switch>;
  return native && destination() !== "call-popout" ? <Suspense fallback={screen}><TitleBar destination={destination()}>{screen}</TitleBar></Suspense> : screen;
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
