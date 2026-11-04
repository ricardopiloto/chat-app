import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { ApiError, auth } from "../api";
import { Button, Icon } from "../components/ui";
import { t } from "../i18n";
import { AuthField, bindValue } from "./AuthFrame";

export function RecoverEmailRequest(props: { siteKey: string | null }) {
  const [email, setEmail] = createSignal("");
  const [website, setWebsite] = createSignal("");
  const [captchaToken, setCaptchaToken] = createSignal("");
  const [sent, setSent] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
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
    if (props.siteKey && !captchaToken()) { setProblem(t("recoverEmail.captchaRequired")); return; }
    setBusy(true);
    try {
      await auth.requestRecoveryEmail({ email: email().trim(), website: website(), captcha_token: captchaToken() || undefined });
      setSent(true);
    } catch (error) {
      setProblem(error instanceof ApiError && error.status === 429 ? t("recover.tooMany") : t("recover.genericError"));
    } finally { setBusy(false); }
  }

  return (
    <section class="flex min-w-0 flex-col gap-4">
      <h2 class="font-display text-headline-sm">{t("recoverEmail.title")}</h2>
      <p class="text-body-sm text-on-surface-variant">{t("recoverEmail.intro")}</p>
      <Show when={sent()} fallback={
        <form class="flex min-w-0 flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <AuthField label={t("recoverEmail.email")} lead={<Icon name="mail" class="text-[18px]" />}>
            <input type="email" name="email" autocomplete="email" required class="min-w-0 flex-1 bg-transparent py-3 outline-none" {...bindValue(email, setEmail)} />
          </AuthField>
          <input name="website" tabindex="-1" aria-hidden="true" autocomplete="off" class="absolute -left-[10000px] h-px w-px opacity-0" {...bindValue(website, setWebsite)} />
          <Show when={props.siteKey}><div ref={captchaElement} class="min-w-0 overflow-hidden" /></Show>
          <Show when={problem()}><p class="notice error break-words" role="alert">{problem()}</p></Show>
          <Button type="submit" variant="secondary" disabled={busy()}>{busy() ? t("auth.waiting") : t("recoverEmail.send")}</Button>
        </form>
      }>
        <p class="notice min-w-0 break-words" role="status">{t("recoverEmail.sent")}</p>
      </Show>
    </section>
  );
}
