import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { ApiError, auth } from "../api";
import { readInstanceStatus } from "../auth/instanceStatus";
import { nativeEntry, setNativeEntry } from "../auth/nativeEntry";
import { useNavigate } from "@solidjs/router";
import { clearInstance, currentInstance, isNative } from "../api/instance";
import { AuthField, AuthFrame, bindValue } from "../auth/AuthFrame";
import { InstanceSetupIntro } from "../auth/InstanceSetupIntro";
import { RecoverySetup, type RecoveryChoice } from "../auth/RecoverySetup";
import { EmailRequest } from "../auth/EmailRequest";
import { emailErrorKey, takeEmailTokenFragment } from "../auth/emailToken";
import { inviteForVariant, modeForSetupVariant, resolveSetupVariant, type AuthMode, type SetupVariant } from "../auth/setupVariant";
import { Button, Icon, Segmented } from "../components/ui";
import { generateIdentity, type Identity } from "../crypto/identity";
import { createRecovery, type RecoveryMaterial } from "../crypto/recovery";
import { t } from "../i18n";
import { useSession } from "../session/session";

const MIN_PASSWORD = 8;

/** An invitation can arrive as /invite/<code> or ?invite=<code>. */
function inviteFromLocation(path: string, search: string): string {
  const fromPath = /^\/invite\/([^/]+)/.exec(path)?.[1];
  return fromPath ? decodeURIComponent(fromPath) : (new URLSearchParams(search).get("invite") ?? "");
}

function failureText(error: unknown, mode: AuthMode): string {
  if (!(error instanceof ApiError)) return t("auth.genericError");
  if (error.code?.startsWith("email_") || error.code === "registration_closed") return t(emailErrorKey(error.code));
  if (error.status === 401) return t("auth.invalidCredentials");
  if (error.status === 403 && mode === "register") return t("auth.inviteError");
  if (error.status === 409) return t("auth.handleTaken");
  if (error.status === 429) return t("auth.tooMany");
  return t("auth.genericError");
}

export function Auth() {
  const session = useSession();
  const where = useLocation();
  const navigate = useNavigate();
  const presetInvite = inviteFromLocation(where.pathname, where.search);

  const [mode, setMode] = createSignal<AuthMode>(presetInvite && !where.search.includes("signin") || isNative() && nativeEntry() === "register" ? "register" : "login");
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [invite, setInvite] = createSignal(presetInvite);
  const [revealed, setRevealed] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [recoveryChoice, setRecoveryChoice] = createSignal<RecoveryChoice>("later");
  const [recoveryDraft, setRecoveryDraft] = createSignal<{ handle: string; identity: Identity; material: RecoveryMaterial }>();
  const [recoverySaved, setRecoverySaved] = createSignal(false);
  const [variant, setVariant] = createSignal<SetupVariant>("normal");
  const [registrationConfig, setRegistrationConfig] = createSignal<{ mode: "fechado" | "aberto"; turnstile_site_key: string | null }>();
  const [emailToken, setEmailToken] = createSignal<string>();
  const [verifiedEmail, setVerifiedEmail] = createSignal<string>();
  const [emailProblem, setEmailProblem] = createSignal("");
  const [verifyingEmail, setVerifyingEmail] = createSignal(false);
  const [useInviteForm, setUseInviteForm] = createSignal(!!presetInvite);

  onMount(() => {
    if (isNative() && !currentInstance().baseUrl) return;
    let cancelled = false;
    void auth.registrationConfig().then((config) => { if (!cancelled) setRegistrationConfig(config); }, () => {});
    const fragment = takeEmailTokenFragment(window.location, window.history);
    if (fragment.present) {
      const token = fragment.token;
      setMode("register");
      if (token) {
        setVerifyingEmail(true);
        void auth.verifyEmail(token).then(
          ({ email }) => { if (!cancelled) { setEmailToken(token); setVerifiedEmail(email); } },
          () => { if (!cancelled) setEmailProblem(t("emailRegistration.emailTokenInvalid")); },
        ).finally(() => { if (!cancelled) setVerifyingEmail(false); });
      } else setEmailProblem(t("emailRegistration.emailTokenInvalid"));
    }
    void readInstanceStatus().then(
      (status) => {
        if (cancelled) return;
        const next = resolveSetupVariant(status);
        setVariant(next);
        if (next === "setup") {
          setMode((current) => modeForSetupVariant(next, current));
          setRecoveryChoice("now");
        }
      },

    );
    onCleanup(() => { cancelled = true; });
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy()) return;
    setProblem("");
    if (mode() === "register" && password().length < MIN_PASSWORD) {
      setProblem(t("auth.passwordShort"));
      return;
    }
    setBusy(true);
    try {
      const credentials = { handle: handle().trim().replace(/^@/, ""), password: password() };
      if (mode() === "register") {
        if (recoveryChoice() === "now") {
          const current = recoveryDraft();
          if (!current || current.handle !== credentials.handle) {
            const fresh = generateIdentity();
            const material = await createRecovery(fresh, credentials.handle);
            setRecoveryDraft({ handle: credentials.handle, identity: fresh, material });
            setRecoverySaved(false);
            return;
          }
          if (!recoverySaved()) {
            setProblem(t("recover.savedRequired"));
            return;
          }
          await session.register({ ...credentials, inviteCode: inviteForVariant(variant(), invite()), identity: current.identity, recovery: current.material, emailToken: emailToken() });
        } else {
          await session.register({ ...credentials, inviteCode: inviteForVariant(variant(), invite()), emailToken: emailToken() });
        }
      } else { await session.login(credentials); if (!isNative() && where.pathname === "/login") navigate("/", { replace: true }); }
    } catch (error) {
      if (error instanceof ApiError && error.code === "email_token_invalid") {
        setEmailToken(undefined);
        setVerifiedEmail(undefined);
        setUseInviteForm(false);
        setEmailProblem(t("emailRegistration.emailTokenInvalid"));
      }
      if (error instanceof ApiError && error.status === 403 && mode() === "register") {
        setVariant(resolveSetupVariant(undefined, undefined, error.status));
        setRecoveryChoice("later");
      }
      setProblem(failureText(error, mode()));
    } finally {
      setBusy(false);
    }
  }

  const registering = () => mode() === "register";
  const showEmailRequest = () => registering() && variant() !== "setup" && registrationConfig()?.mode === "aberto" && !verifiedEmail() && !useInviteForm() && !presetInvite;

  return (
    <AuthFrame
      single
      cardHeader={<>
        <Show when={isNative() || variant() !== "setup"}>
          <Button variant="secondary" class="entry-control" onClick={() => isNative() ? setNativeEntry("home") : navigate("/")}>
            <Icon name="arrow_back" />{t("entry.backHome")}
          </Button>
        </Show>
        <Show when={isNative()}>
          <Button variant="secondary" class="entry-control" onClick={() => void clearInstance()}>{t("instance.switch")}</Button>
        </Show>
      </>}
      headline={t("auth.headline")}
      text={t("auth.pitch")}
      features={[
        { icon: "shield_lock", title: t("auth.featureE2ee"), text: t("auth.featureE2eeText") },
        { icon: "videocam", title: t("auth.featureStudio"), text: t("auth.featureStudioText") },
        { icon: "dns", title: t("auth.featureSelfHosted"), text: t("auth.featureSelfHostedText") },
      ]}
    >
      <div class="flex flex-col gap-5">
      <Show when={variant() !== "setup"}><Segmented
        fill
        label={t("auth.mode")}
        value={mode()}
        options={[
          { value: "login", label: t("auth.login") },
          { value: "register", label: t("auth.register") },
        ]}
        onChange={(next) => {
          setMode(next);
          setProblem("");
        }}
      /></Show>
      <Show when={!verifyingEmail()} fallback={<p class="text-body-md">{t("emailRegistration.verifying")}</p>}>
      <Show when={!showEmailRequest()} fallback={<EmailRequest siteKey={registrationConfig()?.turnstile_site_key ?? null} error={emailProblem()} onLogin={() => setMode("login")} onUseInvite={() => setUseInviteForm(true)} />}>
      <form class="flex flex-col gap-5" onSubmit={submit} noValidate>
        <Show when={variant() === "setup"}><InstanceSetupIntro /></Show>
        <AuthField label={t("auth.handle")} aside={<span class="font-code text-label-code-sm text-on-surface-variant">{t("auth.handleExample")}</span>} lead="@" hint={t("auth.handleHint")}>
          <input name="handle" autocomplete="username" autocapitalize="none" spellcheck={false} required placeholder={t("auth.handlePlaceholder")} {...bindValue(handle, setHandle)} />
        </AuthField>

        <AuthField
          label={t("auth.password")}
          aside={
            <Show when={!registering()}>
              <A href="/recover" class="inline-flex min-h-6 items-center text-body-sm text-primary hover:underline">
                {t("auth.forgotPassword")}
              </A>
            </Show>
          }
          lead={<Icon name="key" class="text-[18px]" />}
          trail={
            <button type="button" class="grid h-10 w-12 place-items-center rounded-full text-on-surface-variant hover:text-on-surface" title={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-label={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={revealed()} onClick={() => setRevealed(!revealed())}>
              <Icon name={revealed() ? "visibility_off" : "visibility"} class="text-[20px]" />
            </button>
          }
          hint={t("auth.passwordHint")}
        >
          <input name="password" type={revealed() ? "text" : "password"} autocomplete={registering() ? "new-password" : "current-password"} required {...bindValue(password, setPassword)} />
        </AuthField>

        <Show when={registering()}>
          <Show when={verifiedEmail()}><p class="notice min-w-0 break-words" role="status">{t("emailRegistration.verified")}: <strong>{verifiedEmail()}</strong></p></Show>
          <Show when={variant() !== "setup"}><AuthField label={t("auth.inviteCode")} lead={<Icon name="confirmation_number" class="text-[18px]" />} hint={t(verifiedEmail() && registrationConfig()?.mode === "aberto" ? "auth.inviteOptionalHint" : "auth.inviteHint")}>
            <input name="invite" autocomplete="off" spellcheck={false} placeholder={t("auth.invitePlaceholder")} {...bindValue(invite, setInvite)} />
          </AuthField></Show>
          <Show when={variant() === "setup"}><p class="text-body-sm font-semibold text-on-surface">{t("setup.recoveryRecommended")}</p></Show>
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
        </Show>

        <Show when={problem()}>
          <p class="notice error" role="alert">
            {problem()}
          </p>
        </Show>

        <Button variant="primary" type="submit" disabled={busy()} class="entry-control !py-3.5 text-body-lg">
          <Icon name={registering() ? "person_add" : "login"} />
          {busy() ? t("auth.waiting") : registering() ? t("auth.createButton") : t("auth.loginButton")}
        </Button>

        <Show when={variant() !== "setup"}><div class="flex items-center gap-4 font-code text-label-code-sm text-on-surface-variant" aria-hidden="true">
          <span class="h-px flex-1 bg-outline-variant" />
          {t("auth.or")}
          <span class="h-px flex-1 bg-outline-variant" />
        </div>

        <Button
          class="entry-control !py-3.5"
          onClick={() => {
            setMode(registering() ? "login" : "register");
            setProblem("");
          }}
        >
          {registering() ? t("auth.haveAccount") : t("auth.newAccount")}
        </Button></Show>


        <Show when={registering()}><p class="flex items-center justify-between gap-3 font-code text-label-code-sm text-on-surface-variant">
          <span class="flex items-center gap-1.5">
            <Icon name="verified_user" class="text-[14px] text-secondary" />
            {t("auth.protocol")}
          </span>
          <span>{t("auth.cipher")}</span>
        </p></Show>
      </form>
      </Show>
      </Show>
      </div>
    </AuthFrame>
  );
}
