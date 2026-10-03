import { Show, type JSX } from "solid-js";
import { Badge, Icon, Logo } from "../components/ui";
import { LanguageSwitch } from "../shell/LanguageSwitch";
import { ThemeSwitch } from "../shell/ThemeSwitch";
import { t } from "../i18n";

export type Feature = { icon: string; title: string; text: string };

// Page frame shared by the sign-in and unlock screens: a slim top bar, a brand panel on the left
// and the task on the right. On narrow screens the brand panel collapses to its header.
export function AuthFrame(props: { headline: string; text: string; features: Feature[]; children: JSX.Element }) {
  return (
    <div class="flex min-h-dvh flex-col bg-background text-on-surface">
      <header class="flex items-center justify-between gap-3 px-4 py-3 tablet:px-8">
        <div class="flex items-center gap-3">
          <Logo size={32} />
          <span class="font-display text-headline-sm">{t("shell.brand")}</span>
          <span class="hidden tablet:contents">
            <Badge tone="neutral" mono>
              v{__APP_VERSION__} · {t("auth.selfHosted")}
            </Badge>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Badge tone="secure" mono icon="lock">
            {t("auth.e2eeChip")}
          </Badge>
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <main class="grid flex-1 items-center gap-6 px-4 pb-8 tablet:px-8 desktop:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] desktop:gap-10">
        <section class="flex flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-low p-6 desktop:p-8">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <Logo variant="full" size={56} />
              <div>
                <p class="font-display text-headline-md">{t("shell.brand")}</p>
                <p class="font-code text-label-code-sm text-on-surface-variant">
                  v{__APP_VERSION__} · {t("auth.privateInstance")}
                </p>
              </div>
            </div>
            <Badge tone="secure" mono>
              <span class="h-1.5 w-1.5 rounded-full bg-secondary" />
              {t("auth.active")}
            </Badge>
          </div>
          <div class="hidden flex-col gap-6 desktop:flex">
            <h1 class="font-display text-display-lg">{props.headline}</h1>
            <p class="text-body-lg text-on-surface-variant">{props.text}</p>
            <ul class="flex flex-col gap-3">
              {props.features.map((feature) => (
                <li class="flex items-start gap-4 rounded-lg bg-surface-container p-4">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-container-high text-primary">
                    <Icon name={feature.icon} class="text-[22px]" />
                  </span>
                  <div>
                    <p class="text-body-md font-semibold">{feature.title}</p>
                    <p class="text-body-sm text-on-surface-variant">{feature.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p class="mt-auto flex items-center gap-2 font-code text-label-code-sm text-on-surface-variant">
            <Icon name="verified_user" class="text-[16px] text-secondary" />
            {location.host}
          </p>
        </section>
        <section class="mx-auto w-full max-w-[640px] rounded-xl border border-outline-variant bg-surface-container-low p-6 desktop:p-8">{props.children}</section>
      </main>
    </div>
  );
}

/** Labelled input with an optional leading mark and trailing control, in the sign-in style. */
export function AuthField(props: {
  label: string;
  aside?: JSX.Element;
  lead?: JSX.Element;
  trail?: JSX.Element;
  hint?: string;
  error?: string;
  children: JSX.Element;
}) {
  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex items-baseline justify-between gap-3">
        <label class="text-body-sm font-semibold text-on-surface">{props.label}</label>
        {props.aside}
      </div>
      <div class="auth-input flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-3 transition-colors focus-within:border-primary-container" classList={{ "!border-error": !!props.error }}>
        <Show when={props.lead}>
          <span class="font-code text-on-surface-variant">{props.lead}</span>
        </Show>
        {props.children}
        <Show when={props.trail}>{props.trail}</Show>
      </div>
      <Show when={props.error} fallback={<Show when={props.hint}><p class="text-body-sm text-on-surface-variant">{props.hint}</p></Show>}>
        <p class="text-body-sm text-error" role="alert">
          {props.error}
        </p>
      </Show>
    </div>
  );
}

/** Two-way binding for a text input: spread the result onto the element. */
export function bindValue(read: () => string, write: (next: string) => void) {
  return {
    get value() {
      return read();
    },
    onInput: (event: InputEvent & { currentTarget: HTMLInputElement }) => write(event.currentTarget.value),
  };
}
