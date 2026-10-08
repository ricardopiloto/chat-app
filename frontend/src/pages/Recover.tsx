import { Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { ApiError } from "../api";
import { AuthField, AuthFrame, bindValue } from "../auth/AuthFrame";
import { Button, Icon, Segmented } from "../components/ui";
import { t } from "../i18n";
import { useSession } from "../session/session";

type Path = "code" | "key";

const MIN_PASSWORD = 8;

function failureText(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) return t("recover.tooMany");
  return t("recover.genericError");
}

/** Public "I forgot my password" screen. The operator code mints a new identity. */
export function Recover() {
  const session = useSession();
  const [path, setPath] = createSignal<Path>("code");
  const [handle, setHandle] = createSignal("");
  const [code, setCode] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirm, setConfirm] = createSignal("");
  const [accepted, setAccepted] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy()) return;
    setProblem("");
    if (password().length < MIN_PASSWORD) {
      setProblem(t("auth.passwordShort"));
      return;
    }
    if (password() !== confirm()) {
      setProblem(t("recover.mismatch"));
      return;
    }
    if (path() === "code" && !accepted()) {
      setProblem(t("recover.confirmRequired"));
      return;
    }
    setBusy(true);
    try {
      const name = handle().trim().replace(/^@/, "");
      if (path() === "key") await session.recoverWithKey(name, code().trim(), password());
      else await session.recoverWithCode(name, code().trim(), password());
    } catch (error) {
      setProblem(failureText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame headline={t("recover.headline")} text={t("recover.pitch")} features={[]}>
      <form class="flex flex-col gap-5" onSubmit={submit} noValidate>
        <Segmented
          fill
          label={t("recover.path")}
          value={path()}
          options={[
            { value: "code", label: t("recover.withCode") },
            { value: "key", label: t("recover.withKey") },
          ]}
          onChange={(next) => {
            setPath(next);
            setProblem("");
          }}
        />
        <p class="text-body-sm text-on-surface-variant">{path() === "code" ? t("recover.codeIntro") : t("recover.keyIntro")}</p>
        <AuthField label={t("auth.handle")} lead="@" hint={t("auth.handleHint")}>
          <input name="handle" autocomplete="username" autocapitalize="none" spellcheck={false} required {...bindValue(handle, setHandle)} />
        </AuthField>
        <AuthField label={path() === "code" ? t("recover.code") : t("recover.key")} hint={path() === "code" ? t("recover.codeHint") : t("recover.keyHint")}>
          <input name="code" autocomplete="one-time-code" spellcheck={false} required {...bindValue(code, setCode)} />
        </AuthField>
        <AuthField label={t("recover.newPassword")} hint={t("auth.passwordHint")}>
          <input name="password" type="password" autocomplete="new-password" required {...bindValue(password, setPassword)} />
        </AuthField>
        <AuthField label={t("recover.confirmPassword")}>
          <input name="confirm" type="password" autocomplete="new-password" required {...bindValue(confirm, setConfirm)} />
        </AuthField>
        <Show when={path() === "code"}>
          <label class="flex items-start gap-3 text-body-sm text-on-surface-variant">
            <input type="checkbox" class="mt-1" checked={accepted()} onChange={(event) => setAccepted(event.currentTarget.checked)} />
            <span>{t("recover.identityWarning")}</span>
          </label>
        </Show>
        <Show when={problem()}>
          <p class="notice error" role="alert">{problem()}</p>
        </Show>
        <Button variant="primary" type="submit" disabled={busy()} class="!py-3.5">
          <Icon name="lock_reset" />
          {busy() ? t("auth.waiting") : t("recover.submit")}
        </Button>
        <A href="/" class="text-center text-body-sm text-primary hover:underline">{t("recover.back")}</A>
      </form>
    </AuthFrame>
  );
}
