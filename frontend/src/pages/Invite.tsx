import { Match, Show, Switch, createEffect, createResource, createSignal, onCleanup, onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { ThemeSwitch } from "../shell/ThemeSwitch";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { useSession } from "../session/session";
import { t } from "../i18n";
import { Badge, Button, Icon, Logo } from "../components/ui";
import { ApiError, auth, invites } from "../api";
import { RecoverySetup, type RecoveryChoice } from "../auth/RecoverySetup";
import { generateIdentity, type Identity } from "../crypto/identity";
import { createRecovery, type RecoveryMaterial } from "../crypto/recovery";
import { claimInviteKey } from "../crypto/claimInvite";
import { readInviteFragment, takeInviteFragment } from "../crypto/inviteLink";

const MIN_PASSWORD = 8;
const HANDLE_PATTERN = /^[a-z0-9_]{3,32}$/;

function codeFromPath(path: string): string {
  const raw = /^\/invite\/([^/]+)/.exec(path)?.[1] ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// 0–4: length, mixed case, digits, symbols.
function passwordStrength(value: string): number {
  if (value.length < MIN_PASSWORD) return value ? 1 : 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  return Math.min(4, Math.max(1, kinds + (value.length >= 12 ? 1 : 0) - 1));
}

function failureText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return t("mgmt.onboarding.handleTaken");
    if (error.status === 410) return t("mgmt.onboarding.invalid");
    if (error.status === 429) return t("auth.tooMany");
  }
  return t("mgmt.onboarding.failed");
}

// The page behind /invite/<code>. It previews the invitation without a session, then either takes
// a handle and password and creates the account while accepting (visitor), or accepts straight away
// with the account that is already signed in.
export function Invite() {
  const session = useSession();
  const navigate = useNavigate();
  const where = useLocation();
  const code = () => codeFromPath(where.pathname);

  const [preview] = createResource(code, async (value) => {
    try {
      return { ok: true as const, data: await invites.preview(value) };
    } catch (error) {
      return { ok: false as const, status: error instanceof ApiError ? error.status : 0 };
    }
  });

  const [handle, setHandle] = createSignal("");
  const [displayName, setDisplayName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [revealed, setRevealed] = createSignal(false);
  const [vault, setVault] = createSignal(true);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [recoveryChoice, setRecoveryChoice] = createSignal<RecoveryChoice>("later");
  const [recoveryDraft, setRecoveryDraft] = createSignal<{ handle: string; identity: Identity; material: RecoveryMaterial }>();
  const [recoverySaved, setRecoverySaved] = createSignal(false);
  const [seedSecret, setSeedSecret] = createSignal<Uint8Array | null>(null);
  onMount(() => setSeedSecret(readInviteFragment()));

  const info = () => {
    const result = preview();
    return result?.ok ? result.data : undefined;
  };
  const signedIn = () => session.phase() === "ready";
  const cleanHandle = () => handle().trim().replace(/^@/, "").toLowerCase();
  const handleValid = () => HANDLE_PATTERN.test(cleanHandle());
  const strength = () => passwordStrength(password());

  // Availability is asked of the server once typing pauses, and only for a well-formed handle.
  const [settled, setSettled] = createSignal("");
  createEffect(() => {
    const candidate = handleValid() ? cleanHandle() : "";
    const pause = window.setTimeout(() => setSettled(candidate), 350);
    onCleanup(() => window.clearTimeout(pause));
  });
  const [free] = createResource(
    () => (settled() && info() ? { invite: code(), name: settled() } : undefined),
    async ({ invite, name }) => {
      try {
        return (await invites.handleAvailable(invite, name)).available;
      } catch {
        return undefined;
      }
    },
  );
  type HandleState = "idle" | "checking" | "free" | "taken" | "unknown";
  const handleState = (): HandleState => {
    if (!handleValid()) return "idle";
    if (settled() !== cleanHandle() || free.loading) return "checking";
    return free() === undefined ? "unknown" : free() ? "free" : "taken";
  };
  const canSubmit = () =>
    !busy() && (signedIn() || (handleValid() && handleState() !== "taken" && password().length >= MIN_PASSWORD && vault()));

  async function accept(event: SubmitEvent) {
    event.preventDefault();
    if (!canSubmit()) return;
    setBusy(true);
    setProblem("");
    try {
      let membership;
      const held = seedSecret();
      if (signedIn()) {
        membership = await invites.accept(code());
        const idn = session.identity();
        if (idn) {
          await claimInviteKey({
            serverId: membership.server_id,
            accountId: membership.account_id,
            identity: idn,
            keySeed: membership.key_seed,
            secret: held,
          });
        }
      } else if (recoveryChoice() === "now") {
        const name = cleanHandle();
        const current = recoveryDraft();
        if (!current || current.handle !== name) {
          const fresh = generateIdentity();
          const material = await createRecovery(fresh, name);
          setRecoveryDraft({ handle: name, identity: fresh, material });
          setRecoverySaved(false);
          setBusy(false);
          return;
        }
        if (!recoverySaved()) {
          setProblem(t("recover.savedRequired"));
          setBusy(false);
          return;
        }
        membership = await session.joinWithInvite({
          handle: name,
          password: password(),
          inviteCode: code(),
          identity: current.identity,
          recovery: current.material,
          seedSecret: held,
        });
      } else {
        membership = await session.joinWithInvite({ handle: cleanHandle(), password: password(), inviteCode: code(), seedSecret: held });
      }
      setSeedSecret(null);
      takeInviteFragment();
      const name = displayName().trim();
      if (name) await auth.setDisplayName(name).then((account) => session.updateAccount(account)).catch(() => undefined);
      navigate(`/servers/${membership.server_id}`, { replace: true });
    } catch (error) {
      setProblem(failureText(error));
      setBusy(false);
    }
  }

  const leave = () => navigate("/", { replace: true });

  return (
    <div class="mg-invite-page">
      <header class="mg-invite-top">
        <button type="button" class="mg-invite-back" onClick={leave}><Icon name="arrow_back" />{t("mgmt.onboarding.back")}</button>
        <span class="mg-invite-brand"><Logo size={32} />{t("shell.brand")}</span>
        <span class="mg-invite-tools"><LanguageSwitch /><ThemeSwitch /></span>
      </header>

      <main class="mg-invite-card">
        <section class="mg-invite-side">
          <div class="mg-invite-id">
            <Logo size={44} />
            <div>
              <strong>{t("shell.brand")}</strong>
              <small><i />{t("mgmt.onboarding.enclave")}</small>
            </div>
          </div>
          <p class="mg-muted">{t("mgmt.onboarding.pitch")}</p>

          <Switch>
            <Match when={preview.loading}><p class="mg-muted">{t("mgmt.onboarding.loading")}</p></Match>
            <Match when={preview()?.ok === false}>
              <article class="mg-invite-server invalid" role="alert">
                <span class="mg-invite-icon"><Icon name="link_off" /></span>
                <div>
                  <strong>{t("mgmt.onboarding.invalidTitle")}</strong>
                  <p>{t("mgmt.onboarding.invalid")}</p>
                </div>
              </article>
            </Match>
            <Match when={info()}>
              <article class="mg-invite-server">
                <span class="mg-invite-icon"><Icon name="shield" /></span>
                <div>
                  <strong>{info()?.server_name}</strong>
                  <small><Icon name="verified_user" />{t("mgmt.onboarding.active")}</small>
                </div>
                <Show when={info()?.include_history}>
                  <Badge tone="secure" mono icon="menu_book">{t("mgmt.onboarding.history")}</Badge>
                </Show>
              </article>
              <p class="mg-invite-keys"><Icon name="key" />{t("mgmt.onboarding.keys")}</p>
            </Match>
          </Switch>
          <p class="mg-note"><Icon name="dns" />{t("mgmt.onboarding.hosted", { host: location.host })}</p>
        </section>

        <section class="mg-invite-form">
          <Show when={info()} fallback={
            <div class="mg-invite-empty">
              <Show when={!preview.loading}>
                <h1>{t("mgmt.onboarding.invalidTitle")}</h1>
                <p class="mg-muted">{t("mgmt.onboarding.invalidHelp")}</p>
                <Button variant="primary" onClick={leave}>{t("mgmt.onboarding.back")}</Button>
              </Show>
            </div>
          }>
            <Badge tone="primary" mono icon="local_fire_department">{t("mgmt.onboarding.reserved")}</Badge>
            <h1>{t("mgmt.onboarding.title")}</h1>
            <p class="mg-muted">{signedIn() ? t("mgmt.onboarding.signedIn", { name: session.account()?.handle ?? "" }) : t("mgmt.onboarding.lead")}</p>

            <form class="mg-form" onSubmit={accept} noValidate>
              <Show when={!signedIn()}>
                <div class="mg-invite-pair">
                  <label class="mg-block">
                    <span class="mg-label">{t("mgmt.onboarding.handle")}
                      <Show when={handleState() !== "idle"}>
                        <em classList={{ "mg-valid": handleState() === "free" || handleState() === "unknown", "mg-error": handleState() === "taken" }}>
                          <Show when={handleState() !== "checking"}><Icon name={handleState() === "taken" ? "cancel" : "check_circle"} /></Show>
                          {t(`mgmt.onboarding.handle_${handleState()}`)}
                        </em>
                      </Show>
                    </span>
                    <span class="mg-input-row" classList={{ invalid: handle() !== "" && (!handleValid() || handleState() === "taken") }}>
                      <span class="mg-input-icon">@</span>
                      <input name="handle" autocomplete="username" autocapitalize="none" spellcheck={false} placeholder={t("mgmt.onboarding.handlePlaceholder")} value={handle()} onInput={(e) => setHandle(e.currentTarget.value)} data-autofocus />
                    </span>
                    <small>{t("mgmt.onboarding.handleHint")}</small>
                  </label>
                  <label class="mg-block">
                    <span class="mg-label">{t("mgmt.onboarding.displayName")}<em>{t("mgmt.onboarding.visible")}</em></span>
                    <span class="mg-input-row">
                      <input name="display-name" maxLength={48} placeholder={t("mgmt.onboarding.displayPlaceholder")} value={displayName()} onInput={(e) => setDisplayName(e.currentTarget.value)} />
                    </span>
                  </label>
                </div>

                <label class="mg-block">
                  <span class="mg-label">{t("mgmt.onboarding.password")}
                    <em classList={{ "mg-valid": strength() >= 3 }}>{t(`mgmt.onboarding.strength${strength()}`)}</em>
                  </span>
                  <span class="mg-input-row">
                    <span class="mg-input-icon"><Icon name="lock" /></span>
                    <input name="password" type={revealed() ? "text" : "password"} autocomplete="new-password" value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
                    <button type="button" class="mg-icon-button" aria-pressed={revealed()} title={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-label={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} onClick={() => setRevealed(!revealed())}>
                      <Icon name={revealed() ? "visibility_off" : "visibility"} />
                    </button>
                  </span>
                  <span class="mg-meter" aria-hidden="true">
                    {[1, 2, 3, 4].map((level) => <i classList={{ on: strength() >= level }} />)}
                  </span>
                  <small>{t("mgmt.onboarding.passwordHint", { min: MIN_PASSWORD })}</small>
                </label>

                <RecoverySetup
                  choice={recoveryChoice()}
                  onChoice={(next) => {
                    setRecoveryChoice(next);
                    if (next === "later") {
                      setRecoveryDraft(undefined);
                      setRecoverySaved(false);
                    }
                  }}
                  code={recoveryDraft()?.material.code}
                  saved={recoverySaved()}
                  onSaved={setRecoverySaved}
                />

                <label class="choice mg-vault">
                  <input type="checkbox" checked={vault()} onChange={(e) => setVault(e.currentTarget.checked)} />
                  <span>
                    <strong>{t("mgmt.onboarding.vault")}</strong>
                    <small>{t("mgmt.onboarding.vaultText")}</small>
                  </span>
                </label>
              </Show>

              <Show when={problem()}><p class="mg-error" role="alert">{problem()}</p></Show>
              <Button variant="primary" type="submit" disabled={!canSubmit()} class="mg-invite-submit">
                <Icon name="meeting_room" />{busy() ? t("auth.waiting") : t("mgmt.onboarding.accept")}<Icon name="arrow_forward" />
              </Button>
            </form>

            <Show when={!signedIn()}>
              <p class="mg-invite-or"><span>{t("mgmt.onboarding.haveIdentity")}</span></p>
              <a class="mg-invite-login" href={`${where.pathname}?signin=1`}>{t("mgmt.onboarding.signIn")}<Icon name="open_in_new" /></a>
            </Show>
          </Show>
        </section>
      </main>
    </div>
  );
}
