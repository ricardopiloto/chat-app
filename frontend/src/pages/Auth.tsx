import { Show, createSignal } from "solid-js";
import { useLocation } from "@solidjs/router";
import { ApiError } from "../api";
import { AuthField, AuthFrame, bindValue } from "../auth/AuthFrame";
import { Button, Icon, Segmented } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";

type Mode = "login" | "register";

const MIN_PASSWORD = 8;

/** An invitation can arrive as /invite/<code> or ?invite=<code>. */
function inviteFromLocation(path: string, search: string): string {
  const fromPath = /^\/invite\/([^/]+)/.exec(path)?.[1];
  return fromPath ? decodeURIComponent(fromPath) : (new URLSearchParams(search).get("invite") ?? "");
}

function failureText(error: unknown, mode: Mode): string {
  if (!(error instanceof ApiError)) return t("auth.genericError");
  if (error.status === 401) return t("auth.invalidCredentials");
  if (error.status === 403 && mode === "register") return t("auth.inviteError");
  if (error.status === 409) return t("auth.handleTaken");
  if (error.status === 429) return t("auth.tooMany");
  return t("auth.genericError");
}

export function Auth() {
  const session = useSession();
  const where = useLocation();
  const presetInvite = inviteFromLocation(where.pathname, where.search);

  const [mode, setMode] = createSignal<Mode>(presetInvite && !where.search.includes("signin") ? "register" : "login");
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [invite, setInvite] = createSignal(presetInvite);
  const [revealed, setRevealed] = createSignal(false);
  const [vaultHelp, setVaultHelp] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");

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
      if (mode() === "register") await session.register({ ...credentials, inviteCode: invite().trim() });
      else await session.login(credentials);
    } catch (error) {
      setProblem(failureText(error, mode()));
    } finally {
      setBusy(false);
    }
  }

  const registering = () => mode() === "register";

  return (
    <AuthFrame
      headline={t("auth.headline")}
      text={t("auth.pitch")}
      features={[
        { icon: "shield_lock", title: t("auth.featureE2ee"), text: t("auth.featureE2eeText") },
        { icon: "videocam", title: t("auth.featureStudio"), text: t("auth.featureStudioText") },
        { icon: "dns", title: t("auth.featureSelfHosted"), text: t("auth.featureSelfHostedText") },
      ]}
    >
      <form class="flex flex-col gap-5" onSubmit={submit} noValidate>
        <Segmented
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
        />

        <AuthField label={t("auth.handle")} aside={<span class="font-code text-label-code-sm text-on-surface-variant">{t("auth.handleExample")}</span>} lead="@" hint={t("auth.handleHint")}>
          <input name="handle" autocomplete="username" autocapitalize="none" spellcheck={false} required placeholder={t("auth.handlePlaceholder")} {...bindValue(handle, setHandle)} />
        </AuthField>

        <AuthField
          label={t("auth.password")}
          aside={
            <Show when={!registering()}>
              <button type="button" class="inline-flex min-h-6 items-center text-body-sm text-primary hover:underline" aria-expanded={vaultHelp()} onClick={() => setVaultHelp(!vaultHelp())}>
                {t("auth.forgotVault")}
              </button>
            </Show>
          }
          lead={<Icon name="key" class="text-[18px]" />}
          trail={
            <button type="button" class="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:text-on-surface" title={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-label={revealed() ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={revealed()} onClick={() => setRevealed(!revealed())}>
              <Icon name={revealed() ? "visibility_off" : "visibility"} class="text-[20px]" />
            </button>
          }
          hint={t("auth.passwordHint")}
        >
          <input name="password" type={revealed() ? "text" : "password"} autocomplete={registering() ? "new-password" : "current-password"} required {...bindValue(password, setPassword)} />
        </AuthField>

        <Show when={vaultHelp() && !registering()}>
          <p class="rounded-md bg-surface-container p-3 text-body-sm text-on-surface-variant">{t("auth.forgotVaultHelp")}</p>
        </Show>

        <Show when={registering()}>
          <AuthField label={t("auth.inviteCode")} lead={<Icon name="confirmation_number" class="text-[18px]" />} hint={t("auth.inviteHint")}>
            <input name="invite" autocomplete="off" spellcheck={false} placeholder={t("auth.invitePlaceholder")} {...bindValue(invite, setInvite)} />
          </AuthField>
        </Show>

        <Show when={problem()}>
          <p class="notice error" role="alert">
            {problem()}
          </p>
        </Show>

        <Button variant="primary" type="submit" disabled={busy()} class="!py-3.5 text-body-lg">
          <Icon name={registering() ? "person_add" : "login"} />
          {busy() ? t("auth.waiting") : registering() ? t("auth.createButton") : t("auth.loginButton")}
        </Button>

        <div class="flex items-center gap-4 font-code text-label-code-sm text-on-surface-variant" aria-hidden="true">
          <span class="h-px flex-1 bg-outline-variant" />
          {t("auth.or")}
          <span class="h-px flex-1 bg-outline-variant" />
        </div>

        <Button
          class="!py-3.5"
          onClick={() => {
            setMode(registering() ? "login" : "register");
            setProblem("");
          }}
        >
          {registering() ? t("auth.haveAccount") : t("auth.newAccount")}
        </Button>

        <p class="flex items-center justify-between gap-3 font-code text-label-code-sm text-on-surface-variant">
          <span class="flex items-center gap-1.5">
            <Icon name="verified_user" class="text-[14px] text-secondary" />
            {t("auth.protocol")}
          </span>
          <span>{t("auth.cipher")}</span>
        </p>
      </form>
    </AuthFrame>
  );
}
