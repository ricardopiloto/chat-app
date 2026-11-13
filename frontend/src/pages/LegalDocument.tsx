import { For, createEffect, onCleanup } from "solid-js";
import { getLocale, t } from "../i18n";
import { legalDocument } from "../legal/documents";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { ThemeSwitch } from "../shell/ThemeSwitch";

export function LegalDocument(props: { kind: "terms" | "privacy" }) {
  const previousTitle = document.title;
  createEffect(() => { document.title = t(props.kind === "terms" ? "legal.terms" : "legal.privacy"); });
  onCleanup(() => { document.title = previousTitle; });
  const blocks = () => legalDocument(props.kind, getLocale()).trim().split(/\n\s*\n/);
  return <div class="min-h-dvh bg-background text-on-surface">
    <header class="border-b border-outline-variant px-4 py-4">
      <nav class="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-4" aria-label={t("legal.navigation")}>
        <a href="/" class="font-display text-headline-sm">Parley</a>
        <div class="flex items-center gap-3"><LanguageSwitch /><ThemeSwitch /></div>
      </nav>
    </header>
    <main class="mx-auto max-w-[760px] px-4 py-10">
      <For each={blocks()}>{(block) => {
        if (block.startsWith("# ")) return <h1 class="mb-8 font-display text-headline-lg">{block.slice(2)}</h1>;
        if (block.startsWith("## ")) return <h2 class="mb-3 mt-8 font-display text-headline-md">{block.slice(3)}</h2>;
        return <p class="my-4 whitespace-pre-line text-body-md leading-relaxed">{block}</p>;
      }}</For>
    </main>
    <footer class="mx-auto flex max-w-[760px] flex-wrap gap-5 border-t border-outline-variant px-4 py-8">
      <a href="/terms">{t("legal.terms")}</a><a href="/privacy">{t("legal.privacy")}</a><a href="/">{t("legal.home")}</a>
    </footer>
  </div>;
}
