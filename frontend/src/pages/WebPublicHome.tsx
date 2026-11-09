import { onCleanup, onMount } from "solid-js";
import { Button, Badge, Logo } from "../components/ui";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { ThemeSwitch } from "../shell/ThemeSwitch";
import { t } from "../i18n";
import mascot from "../assets/parley-mascot.webp"; // From docs/v2/parley_logo/mascote/parley-mascote-acenando-transparente.png (transparent background).
import appPreview from "../assets/app-preview.webp"; // Placeholder from propostas/parley-home/preview.png; replace with the real app screenshot.

const HOST_GUIDE = "https://github.com/ricardopiloto/chat-app/blob/main/docs/deploy-producao.md";
const DOWNLOAD_URL = "https://github.com/ricardopiloto/chat-app/releases/latest";
function anchor(id: string) { document.getElementById(id)?.focus(); }
export function WebPublicHome() {
  onMount(() => {
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex"; document.head.append(meta);
    onCleanup(() => meta.remove());
  });
  return <div class="public-home min-h-dvh bg-background text-on-surface">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface-container focus:p-3">{t("public.skip")}</a>
    <header class="border-b border-outline-variant"><nav aria-label={t("public.navigation")} class="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-4"><a href="#main" class="flex items-center gap-2" onClick={() => anchor("main")}><Logo size={36}/><span class="font-display text-headline-sm">{t("shell.brand")}</span></a><div class="flex flex-wrap items-center gap-3 text-body-sm"><a href="#space" onClick={() => anchor("space")}>{t("public.space")}</a><a href="#privacy" onClick={() => anchor("privacy")}>{t("public.privacy")}</a><a href="#start" onClick={() => anchor("start")}>{t("public.start")}</a><LanguageSwitch/><ThemeSwitch/><a href="/login"><Button class="entry-control">{t("auth.login")}</Button></a></div></nav></header>
    <main id="main" tabindex="-1" class="mx-auto max-w-[1200px] px-4">
      <section class="grid min-h-[520px] items-center gap-8 py-16 desktop:grid-cols-2"><div><Badge tone="primary">{t("public.eyebrow")}</Badge><h1 class="mt-5 font-display text-display-lg">{t("public.heroTitle")}</h1><p class="mt-5 text-body-lg text-on-surface-variant">{t("public.heroIntro")}</p><div class="mt-6 flex flex-wrap gap-3"><a href={HOST_GUIDE} target="_blank" rel="noopener noreferrer"><Button variant="primary" class="entry-control">{t("public.host")}</Button></a><a href="#start" onClick={() => anchor("start")}><Button class="entry-control">{t("public.learn")}</Button></a><a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"><Button class="entry-control">{t("public.download")}</Button></a></div><p class="mt-5 text-body-sm text-on-surface-variant">{t("public.heroNote")}</p></div><div class="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"><img src={appPreview} alt={t("public.appPreviewAlt")} width="1280" height="800" loading="eager" class="block h-auto w-full" /></div></section>
      <div class="grid gap-3 border-y border-outline-variant py-5 text-center text-body-md tablet:grid-cols-3"><span>{t("public.principle1")}</span><span>{t("public.principle2")}</span><span>{t("public.principle3")}</span></div>
      <section id="space" tabindex="-1" class="py-16"><h2 class="font-display text-headline-lg">{t("public.spaceTitle")}</h2><p class="mt-3 text-on-surface-variant">{t("public.spaceIntro")}</p><div class="mt-8 grid gap-4 tablet:grid-cols-3">{([1,2,3] as const).map((n) => <article class="rounded-xl border border-outline-variant bg-surface-container-low p-6"><p class="text-primary">0{n}</p><h3 class="mt-3 font-display text-headline-sm">{t(`public.feature${n}Title`)}</h3><p class="mt-3 text-body-sm text-on-surface-variant">{t(`public.feature${n}Body`)}</p></article>)}</div></section>
      <section id="privacy" tabindex="-1" class="rounded-xl bg-surface-container-low p-8"><h2 class="font-display text-headline-lg">{t("public.privacyTitle")}</h2><p class="mt-4 text-body-md">{t("public.privacyBody")}</p></section>
      <section id="start" tabindex="-1" class="grid items-center gap-8 py-16 tablet:grid-cols-[1fr_2fr]"><div><h2 class="font-display text-headline-lg">{t("public.startTitle")}</h2><p class="mt-3 text-on-surface-variant">{t("public.startIntro")}</p><a href={HOST_GUIDE} target="_blank" rel="noopener noreferrer" class="mt-5 inline-block"><Button variant="primary" class="entry-control">{t("public.hostAgain")}</Button></a><img src={mascot} alt={t("entry.mascotAlt")} class="mt-6 h-40 w-40 object-contain"/></div><ol class="space-y-4">{([1,2,3] as const).map((n) => <li class="rounded-lg bg-surface-container-low p-5"><strong>{t(`public.step${n}Title`)}</strong><p>{t(`public.step${n}Body`)}</p></li>)}</ol></section>
      <section class="pb-16"><h2 class="font-display text-headline-lg">{t("public.faqTitle")}</h2>{([1,2,3,4] as const).map((n) => <details class="border-b border-outline-variant py-4"><summary class="cursor-pointer font-semibold">{t(`public.faq${n}Question`)}</summary><p class="mt-3 text-on-surface-variant">{t(`public.faq${n}Answer`)}</p></details>)}</section>
    </main><footer class="border-t border-outline-variant p-8 text-center"><p>{t("public.footer")}</p><a href="/login" class="ui-button secondary entry-control mt-3">{t("public.footerLogin")}</a></footer>
  </div>;
}
