import { onMount } from "solid-js";
import { t } from "../i18n";

export function InstanceSetupIntro() {
  let heading: HTMLHeadingElement | undefined;
  onMount(() => heading?.focus());
  return (
    <section aria-labelledby="instance-setup-title" class="flex min-w-0 flex-col gap-3 rounded-lg border border-primary-container bg-primary-container/10 p-4">
      <h2 id="instance-setup-title" ref={heading} tabIndex={-1} class="font-display text-headline-md outline-none">
        {t("setup.title")}
      </h2>
      <p class="text-body-md font-semibold" role="note">{t("setup.noExtraPermissions")}</p>
      <p class="text-body-sm text-on-surface-variant">{t("setup.role")}</p>
      <p class="text-body-sm text-on-surface-variant">{t("setup.exposure")}</p>
    </section>
  );
}
