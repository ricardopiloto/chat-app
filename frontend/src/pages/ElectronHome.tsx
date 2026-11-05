import { createSignal, Show } from "solid-js";
import { Button, Logo } from "../components/ui";
import { ThemeSwitch } from "../shell/ThemeSwitch";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { setNativeEntry } from "../auth/nativeEntry";
import { InstanceConnect } from "../auth/InstanceConnect";
import { t } from "../i18n";
import mascot from "../assets/parley-mascot.webp"; // From docs/v2/parley_logo/mascote/parley-mascote-acenando-transparente.png (transparent background).

export function ElectronHome(props: { baseUrl: string | null; onSaved: () => void }) {
  const [dialog, setDialog] = createSignal(!props.baseUrl);
  const [requested, setRequested] = createSignal<"login" | "register">("login");
  function enter(mode: "login" | "register") {
    setRequested(mode);
    if (!props.baseUrl) setDialog(true);
    else setNativeEntry(mode);
  }
  return <div class="flex min-h-dvh flex-col bg-background text-on-surface">
    <header class="flex items-center justify-between gap-2 p-4"><div class="flex items-center gap-2"><Logo size={32}/><span class="font-display text-headline-sm">{t("shell.brand")}</span></div><div class="flex gap-2"><LanguageSwitch/><ThemeSwitch/></div></header>
    <main class="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center gap-5 px-4 py-8">
      <img src={mascot} alt={t("entry.mascotAlt")} class="mx-auto h-48 w-48 object-contain"/>
      <h1 class="text-center font-display text-display-lg">{t("entry.desktopTitle")}</h1>
      <p class="text-center text-body-md text-on-surface-variant">{t("entry.desktopIntro")}</p>
      <section class="rounded-xl border border-outline-variant bg-surface-container-low p-5"><p class="text-label-code-sm uppercase text-on-surface-variant">{t("entry.selectedInstance")}</p><p class="mt-2 break-all text-body-md">{props.baseUrl || t("entry.noInstance")}</p><Button class="entry-control mt-3" onClick={() => setDialog(true)}>{props.baseUrl ? t("entry.change") : t("entry.choose")}</Button></section>
      <Button variant="primary" class="entry-control" onClick={() => enter("login")}>{t("auth.login")}</Button>
      <Button class="entry-control" onClick={() => enter("register")}>{t("entry.createAccount")}</Button>
      <p class="text-center text-body-sm text-on-surface-variant">{t("entry.instanceNote")}</p>
      <a class="ui-button secondary entry-control" href="https://github.com/ricardopiloto/chat-app" target="_blank" rel="noopener noreferrer">{t("entry.learnParley")}</a>
    </main><footer class="p-4 text-center text-body-sm text-on-surface-variant">{t("entry.encryption")}</footer>
    <Show when={dialog()}><InstanceConnect dialog onClose={() => setDialog(false)} onSaved={() => { setDialog(false); props.onSaved(); setNativeEntry(requested()); }} /></Show>
  </div>;
}
