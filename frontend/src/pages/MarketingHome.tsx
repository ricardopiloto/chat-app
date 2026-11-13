import { For, createEffect, onCleanup } from "solid-js";
import { detectPlatform } from "../shell/detectPlatform";
import { HOST_GUIDE, DOWNLOAD_URL } from "../shell/links";
import { Button, Badge, Logo } from "../components/ui";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { ThemeSwitch } from "../shell/ThemeSwitch";
import { t } from "../i18n";
import mascot from "../assets/parley-mascot.webp";
import appPreview from "../assets/app-preview.webp";
import "../marketing.css";

const featureKeys = ["chat", "calls", "cameras", "screen", "popout"] as const;
const navKeys = ["features", "inside", "privacy", "start", "download"] as const;
const repo = "https://github.com/ricardopiloto/chat-app";

export function MarketingHome() {
  const platform = typeof navigator === "undefined" ? null : detectPlatform(navigator);
  const previousTitle = document.title;
  createEffect(() => { document.title = t("marketing.title"); });
  onCleanup(() => { document.title = previousTitle; });
  return <div class="marketing-home min-h-dvh bg-background text-on-surface">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface-container focus:p-3">{t("marketing.skip")}</a>
    <header class="border-b border-outline-variant"><nav aria-label={t("marketing.navigation")} class="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-4">
      <a href="#main" class="flex items-center gap-2"><Logo size={36}/><span class="font-display text-headline-sm">{t("marketing.brand")}</span></a>
      <div class="flex flex-wrap items-center gap-3 text-body-sm"><For each={navKeys}>{(key) => <a href={`#${key}`}>{t(`marketing.nav${key.charAt(0).toUpperCase()}${key.slice(1)}`)}</a>}</For><LanguageSwitch/><ThemeSwitch/><a href="/login"><Button class="entry-control">{t("marketing.login")}</Button></a></div>
    </nav></header>
    <main id="main" tabindex="-1" class="mx-auto max-w-[1200px] px-4">
      <section aria-label={t("marketing.heroTitle")} class="grid items-center gap-8 py-16 desktop:grid-cols-2"><div><div class="flex flex-wrap gap-2"><For each={["chipHost", "chipE2ee", "chipAds", "chipLicense"]}>{(key) => <Badge tone="primary">{t(`marketing.${key}`)}</Badge>}</For></div><h1 class="mt-6 font-display text-display-lg">{t("marketing.heroTitle")}</h1><p class="mt-5 text-body-lg text-on-surface-variant">{t("marketing.heroBody")}</p><div class="mt-6 flex flex-wrap gap-3"><a href="#download"><Button variant="primary" class="entry-control">{t("marketing.downloadApp")}</Button></a><a href="/login"><Button class="entry-control">{t("marketing.enterOfficial")}</Button></a></div></div><img src={appPreview} alt={t("marketing.heroImageAlt")} width="1280" height="800" loading="eager" class="h-auto w-full rounded-xl border border-outline-variant" /></section>
      <section id="features" aria-label={t("marketing.featuresTitle")} class="py-16"><h2 class="font-display text-headline-lg">{t("marketing.featuresTitle")}</h2><p class="mt-3 text-on-surface-variant">{t("marketing.featuresIntro")}</p><div class="marketing-cards mt-8"><For each={featureKeys}>{(key) => <article class="rounded-xl border border-outline-variant bg-surface-container-low p-6"><h3 class="font-display text-headline-sm">{t(`marketing.${key}Title`)}</h3><p class="mt-3 text-on-surface-variant">{t(`marketing.${key}Body`)}</p></article>}</For></div></section>
      <section id="inside" aria-label={t("marketing.insideTitle")} class="py-16"><h2 class="font-display text-headline-lg">{t("marketing.insideTitle")}</h2><p class="mt-3 text-on-surface-variant">{t("marketing.insideIntro")}</p><div class="marketing-shots mt-8"><For each={["chat", "call", "entry"]}>{(key) => <img src={appPreview} alt={t(`marketing.${key}ImageAlt`)} width="1280" height="800" loading="lazy" class="h-auto w-full rounded-xl border border-outline-variant" />}</For></div></section>
      <section id="privacy" aria-label={t("marketing.privacyTitle")} class="rounded-xl bg-surface-container-low p-8"><h2 class="font-display text-headline-lg">{t("marketing.privacyTitle")}</h2><p class="mt-4">{t("marketing.privacyBody")}</p><p class="mt-3 text-on-surface-variant">{t("marketing.privacyCaveat")}</p></section>
      <section id="start" aria-label={t("marketing.startTitle")} class="py-16"><h2 class="font-display text-headline-lg">{t("marketing.startTitle")}</h2><div class="marketing-cards mt-8"><article class="rounded-xl bg-surface-container-low p-6"><h3 class="font-display text-headline-sm">{t("marketing.officialTitle")}</h3><p class="my-4">{t("marketing.officialBody")}</p><a href="/login"><Button variant="primary">{t("marketing.enterOfficial")}</Button></a></article><article class="rounded-xl bg-surface-container-low p-6"><h3 class="font-display text-headline-sm">{t("marketing.hostTitle")}</h3><p class="my-4">{t("marketing.hostBody")}</p><a href={HOST_GUIDE} target="_blank" rel="noopener noreferrer"><Button>{t("marketing.hostAction")}</Button></a></article></div></section>
      <section id="download" aria-label={t("marketing.downloadTitle")} class="py-16"><h2 class="font-display text-headline-lg">{t("marketing.downloadTitle")}</h2><p class="mt-3">{t("marketing.downloadIntro")}</p><div class="marketing-cards mt-8"><For each={["windows", "macos", "linux"] as const}>{(key) => <article class={`rounded-xl border bg-surface-container-low p-6 ${platform === key ? "border-primary" : "border-outline-variant"}`}><h3 class="font-display text-headline-sm">{t(`marketing.${key}`)}</h3>{platform === key && <Badge tone="primary">{t("marketing.detected")}</Badge>}<a class="mt-5 inline-block" href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"><Button>{t("marketing.releaseAction")}</Button></a></article>}</For></div><p class="mt-4 text-body-sm text-on-surface-variant">{t("marketing.downloadWarning")}</p></section>
      <section aria-label={t("marketing.openTitle")} class="grid items-center gap-8 py-16 tablet:grid-cols-[1fr_3fr]"><img src={mascot} alt="" width="160" height="160" loading="lazy" class="h-40 w-40 object-contain"/><div><h2 class="font-display text-headline-lg">{t("marketing.openTitle")}</h2><p class="mt-3">{t("marketing.openBody")}</p><div class="mt-5 flex flex-wrap gap-4"><a href={repo} target="_blank" rel="noopener noreferrer">{t("marketing.sourceAction")}</a><a href={`${repo}/tree/main/docs`} target="_blank" rel="noopener noreferrer">{t("marketing.docsAction")}</a><a href={`${repo}/issues`} target="_blank" rel="noopener noreferrer">{t("marketing.issueAction")}</a></div></div></section>
    </main><footer class="border-t border-outline-variant p-8 text-center"><p>{t("marketing.footer")}</p><div class="mt-3 flex flex-wrap justify-center gap-5"><a href="/terms">{t("legal.terms")}</a><a href="/privacy">{t("legal.privacy")}</a></div></footer>
  </div>;
}
