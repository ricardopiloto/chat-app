import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { ApiError, auth } from "../api";
import { Button, Icon } from "../components/ui";
import { t } from "../i18n";
import { AuthField, bindValue } from "./AuthFrame";
import { emailErrorKey } from "./emailToken";

type Turnstile = { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }

export function EmailRequest(props: { siteKey: string | null; error?: string; onLogin: () => void; onUseInvite: () => void }) {
  const [email, setEmail] = createSignal("");
  const [terms, setTerms] = createSignal(false);
  const [website, setWebsite] = createSignal("");
  const [captchaToken, setCaptchaToken] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [sent, setSent] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  let captchaElement: HTMLDivElement | undefined;

  onMount(() => {
    if (!props.siteKey || !captchaElement) return;
    let widget: string | undefined;
    let cancelled = false;
    const render = () => {
      if (cancelled || !captchaElement || !props.siteKey || !window.turnstile) return;
      widget = window.turnstile.render(captchaElement, { sitekey: props.siteKey, callback: setCaptchaToken, "expired-callback": () => setCaptchaToken("") });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-mesa-turnstile]');
    if (existing) { if (window.turnstile) render(); else existing.addEventListener("load", render, { once: true }); }
    else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.mesaTurnstile = "";
      script.addEventListener("load", render, { once: true });
      document.head.append(script);
    }
    onCleanup(() => { cancelled = true; if (widget) window.turnstile?.remove(widget); });
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy()) return;
    setProblem("");
    if (!terms()) { setProblem(t("emailRegistration.termsRequired")); return; }
    if (props.siteKey && !captchaToken()) { setProblem(t("emailRegistration.captchaFailed")); return; }
    setBusy(true);
    try {
      await auth.requestEmail({ email: email().trim(), terms_accepted: terms(), website: website(), captcha_token: captchaToken() || undefined });
      setSent(true);
    } catch (error) {
      setProblem(error instanceof ApiError ? t(emailErrorKey(error.code ?? (error.status === 429 ? "too_many" : undefined))) : t("auth.genericError"));
    } finally { setBusy(false); }
  }

  return (
    <div class="flex min-w-0 flex-col gap-5">
      <h2 class="font-display text-headline-md">{t("emailRegistration.title")}</h2>
      <Show when={sent()} fallback={
        <form class="flex min-w-0 flex-col gap-5" onSubmit={(event) => void submit(event)}>
          <p class="text-body-md text-on-surface-variant">{t("emailRegistration.intro")}</p>
          <AuthField label={t("emailRegistration.email")} lead={<Icon name="mail" class="text-[18px]" />}>
            <input type="email" name="email" autocomplete="email" required class="min-w-0 flex-1 bg-transparent py-3 outline-none" {...bindValue(email, setEmail)} />
          </AuthField>
          <input name="website" tabindex="-1" aria-hidden="true" autocomplete="off" class="absolute -left-[10000px] h-px w-px opacity-0" {...bindValue(website, setWebsite)} />
          <label class="flex min-w-0 items-start gap-3 text-body-sm">
            <input type="checkbox" class="mt-1" checked={terms()} onChange={(event) => setTerms(event.currentTarget.checked)} />
            <span class="min-w-0 break-words">{t("emailRegistration.terms")}</span>
          </label>
          <Show when={props.siteKey}><div ref={captchaElement} class="min-w-0 overflow-hidden" /></Show>
          <Show when={problem() || props.error}><p class="notice error break-words" role="alert">{problem() || props.error}</p></Show>
          <Button type="submit" variant="primary" disabled={busy()}>{busy() ? t("auth.waiting") : t("emailRegistration.send")}</Button>
        </form>
      }>
        <p class="notice break-words" role="status">{t("emailRegistration.sent")}</p>
      </Show>
      <button type="button" class="text-body-sm text-primary underline" onClick={props.onUseInvite}>{t("emailRegistration.useInvite")}</button>
      <button type="button" class="text-body-sm text-primary underline" onClick={props.onLogin}>{t("auth.haveAccount")}</button>
    </div>
  );
}
