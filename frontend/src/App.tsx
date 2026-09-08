import { Show, Suspense, createEffect, createSignal, lazy, onCleanup, type JSX } from "solid-js";
import { Navigate, Route, Router, useParams, useSearchParams } from "@solidjs/router";
import { api, type Account } from "./api/client";
import { connectLiveWs, type LiveDeliveryStatus, type WsEnvelope } from "./api/ws";
import {
  b64,
  generateIdentity,
  persistIdentity,
  unlockIdentity,
  wrapIdentity,
  type Identity,
} from "./crypto/identity";
import { handleHandoffEvent, loadAllServerKeys } from "./crypto/keyHandoff";
import { markUnseen, removeChannel } from "./preferences/notifications";
import AppShell from "./shell/AppShell";
import { bootTheme, startThemeListeners } from "./theme/theme";
import Auth from "./pages/Auth";
import Servers from "./pages/Servers";
import EmptyServerPane from "./pages/EmptyServerPane";
import Invite from "./pages/Invite";
import { VoiceSessionProvider } from "./voice/VoiceSession";

const ChannelRoute = lazy(() => import("./pages/ChannelRoute"));
const RolePermissionsPage = lazy(() => import("./pages/RolePermissionsPage"));
const MembersManagePage = lazy(() => import("./pages/MembersManagePage"));
const SettingsHomePage = lazy(() => import("./pages/SettingsHomePage"));
const RolesManagePage = lazy(() => import("./pages/RolesManagePage"));
const ServerImagePage = lazy(() => import("./pages/ServerImagePage"));
const ServerDeletePage = lazy(() => import("./pages/ServerDeletePage"));

function RouteFallback() {
  return <p class="main muted">A carregar…</p>;
}

function RedirectToSettingsMembers() {
  const params = useParams<{ serverId: string }>();
  return <Navigate href={`/servers/${params.serverId}/settings/members`} />;
}

function RedirectToSettingsRolePermissions() {
  const params = useParams<{ serverId: string; roleId: string }>();
  const [search] = useSearchParams();
  const q = search.returnTo
    ? `?returnTo=${encodeURIComponent(String(search.returnTo))}`
    : "";
  return (
    <Navigate
      href={`/servers/${params.serverId}/settings/roles/${params.roleId}/permissions${q}`}
    />
  );
}

function AuthedShell(props: {
  me: Account;
  identity: Identity;
  onLogout: () => void;
  onAccountPatch: (account: Account) => void;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
  children: JSX.Element;
}) {
  return (
    <AppShell
      me={props.me}
      identity={props.identity}
      onLogout={props.onLogout}
      onAccountPatch={props.onAccountPatch}
      onWs={props.onWs}
    >
      {props.children}
    </AppShell>
  );
}

export default function App() {
  const [me, setMe] = createSignal<Account | null>(null);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [ready, setReady] = createSignal(false);
  const [deliveryStatus, setDeliveryStatus] =
    createSignal<LiveDeliveryStatus>("disconnected");
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
    startThemeListeners();
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
    const live = connectLiveWs(
      (msg) => {
        void handleHandoffEvent(msg, id, account.id);
        if (msg.event === "message.new") {
          const channelId = String(msg.payload.channel_id ?? "");
          const messageId = String(msg.payload.id ?? msg.payload.message_id ?? "");
          const createdAt = String(msg.payload.created_at ?? "");
          const focused = window.location.pathname.startsWith(`/channels/${channelId}`);
          if (channelId && messageId && !focused) markUnseen(channelId, messageId, createdAt || undefined);
        }
        if (msg.event === "channel.deleted") {
          removeChannel(String(msg.payload.id ?? msg.payload.channel_id ?? ""));
        }
        listeners.forEach((h) => h(msg));
      },
      (status) => setDeliveryStatus(status),
    );
    onCleanup(() => live.close());
  });

  createEffect(() => {
    if (!me() || !identity()) setDeliveryStatus("disconnected");
  });

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
    setIdentity(null);
  }

  return (
    <Show when={ready()} fallback={<p class="auth-screen muted">A carregar…</p>}>
      <Show
        when={me() && identity()}
        fallback={
          <Router>
            <Route
              path="/auth"
              component={() => (
                <Auth
                  session={me()}
                  onAuthed={authed}
                  onRecoverIdentity={recoverIdentity}
                  onClearSession={logout}
                />
              )}
            />
            <Route path="/invite/:code" component={() => <Invite me={me()} onAuthed={authed} />} />
            <Route path="*" component={() => <Navigate href="/auth" />} />
          </Router>
        }
      >
        <VoiceSessionProvider onWs={onWs}>
          <Router>
            <Route path="/auth" component={() => <Navigate href="/" />} />
            <Route path="/invite/:code" component={() => <Invite me={me()} onAuthed={authed} />} />
            <Route
              path="/"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Servers me={me()!} identity={identity()!} />
                </AuthedShell>
              )}
            />
            <Route
              path="/channels/:id"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <ChannelRoute
                      onWs={onWs}
                      me={me()!}
                      identity={identity()!}
                      deliveryStatus={deliveryStatus()}
                    />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <EmptyServerPane />
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <SettingsHomePage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings/members"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <MembersManagePage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings/roles"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <RolesManagePage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings/roles/:roleId/permissions"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <RolePermissionsPage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings/image"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <ServerImagePage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/settings/delete"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <Suspense fallback={<RouteFallback />}>
                    <ServerDeletePage />
                  </Suspense>
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/members"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <RedirectToSettingsMembers />
                </AuthedShell>
              )}
            />
            <Route
              path="/servers/:serverId/roles/:roleId/permissions"
              component={() => (
                <AuthedShell
                  me={me()!}
                  identity={identity()!}
                  onLogout={() => void logout()}
                  onAccountPatch={setMe}
                  onWs={onWs}
                >
                  <RedirectToSettingsRolePermissions />
                </AuthedShell>
              )}
            />
          </Router>
        </VoiceSessionProvider>
      </Show>
    </Show>
  );
}
