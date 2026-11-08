import { createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { Copy, Minus, Square } from "lucide-solid";
import { Icon } from "../components/ui/Icon";
import { t } from "../i18n";

export function TitleBar(props: { children: JSX.Element; destination: string }) {
  const platform = window.mesaPlatform;
  const [maximized, setMaximized] = createSignal(false);

  onMount(() => {
    document.documentElement.style.setProperty("--mesa-title-bar", "2rem");
    onCleanup(() => document.documentElement.style.setProperty("--mesa-title-bar", "0px"));
    if (platform !== "linux") return;
    const unsubscribe = window.mesaNative?.onWindowMaximizedChange(setMaximized);
    if (unsubscribe) onCleanup(unsubscribe);
  });

  const control = "grid h-8 w-11 place-items-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface";
  return <>
    <header class="fixed inset-x-0 top-0 z-50 flex h-8 items-center bg-surface-container-lowest text-on-surface" style={{ "-webkit-app-region": "drag" }}>
      {platform === "darwin" && <div class="w-20 shrink-0" />}
      <div class="flex min-w-0 flex-1 items-center gap-2 px-3 text-label-sm">
        <span class="font-display text-primary">{t("shell.brand")}</span>
      </div>
      {props.destination === "app" && <button type="button" class="flex h-6 min-w-0 w-[min(320px,40vw)] items-center gap-2 rounded border border-outline-variant bg-surface-container-low px-2 text-left text-[11px] text-on-surface-variant transition-colors hover:border-outline" style={{ "-webkit-app-region": "no-drag" }} aria-label={t("shell.searchEntry")} onClick={() => document.dispatchEvent(new Event("mesa:search"))}>
        <Icon name="search" class="text-[13px]" />
        <span class="min-w-0 flex-1 truncate">{t("shell.searchPlaceholder")}</span>
        <kbd class="shrink-0 font-code text-[10px]">Ctrl+K</kbd>
      </button>}
      <div class="flex-1" />
      {platform === "linux" && <div class="flex h-full shrink-0" style={{ "-webkit-app-region": "no-drag" }}>
        <button type="button" class={control} aria-label={t("shell.titleBar.minimize")} onClick={() => void window.mesaNative?.minimize()}><Minus size={14} /></button>
        <button type="button" class={control} aria-label={t(maximized() ? "shell.titleBar.restore" : "shell.titleBar.maximize")} onClick={() => void window.mesaNative?.toggleMaximize()}>{maximized() ? <Copy size={13} /> : <Square size={13} />}</button>
        <button type="button" class={`${control} hover:bg-error hover:text-on-error`} aria-label={t("shell.titleBar.close")} onClick={() => void window.mesaNative?.close()}><Icon name="close" class="text-[15px]" /></button>
      </div>}
      {platform === "win32" && <div class="w-[138px] shrink-0" />}
    </header>
    <div class="pt-8">{props.children}</div>
  </>;
}
