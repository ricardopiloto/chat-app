import { Show } from "solid-js";
import { Button, Icon } from "../components/ui";
import { t } from "../i18n";

export type RecoveryChoice = "later" | "now";

/** Shared "create a recovery key now / later" step. The code exists only in memory. */
export function RecoverySetup(props: {
  choice: RecoveryChoice;
  onChoice: (choice: RecoveryChoice) => void;
  code?: string;
  saved: boolean;
  onSaved: (saved: boolean) => void;
}) {
  async function copy() {
    if (!props.code) return;
    await navigator.clipboard.writeText(props.code);
  }

  function download() {
    if (!props.code) return;
    const url = URL.createObjectURL(new Blob([`${props.code}\n`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mesa-recovery-key.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <fieldset class="flex flex-col gap-3">
      <legend class="text-body-sm text-on-surface-variant">{t("recover.setupTitle")}</legend>
      <label class="flex items-start gap-3 text-body-sm">
        <input type="radio" name="recovery" checked={props.choice === "now"} onChange={() => props.onChoice("now")} />
        <span>{t("recover.setupNow")}</span>
      </label>
      <label class="flex items-start gap-3 text-body-sm">
        <input type="radio" name="recovery" checked={props.choice === "later"} onChange={() => props.onChoice("later")} />
        <span>{t("recover.setupLater")}</span>
      </label>
      <Show when={props.choice === "now" && props.code}>
        <p class="text-body-sm text-on-surface-variant">{t("recover.setupOnce")}</p>
        <code class="break-all rounded-md bg-surface-container-lowest px-3 py-2 font-code text-body-sm">{props.code}</code>
        <div class="flex gap-2">
          <Button type="button" onClick={() => void copy()}>
            <Icon name="content_copy" />
            {t("recover.copy")}
          </Button>
          <Button type="button" onClick={download}>
            <Icon name="download" />
            {t("recover.download")}
          </Button>
        </div>
        <label class="flex items-start gap-3 text-body-sm">
          <input type="checkbox" class="mt-1" checked={props.saved} onChange={(event) => props.onSaved(event.currentTarget.checked)} />
          <span>{t("recover.saved")}</span>
        </label>
      </Show>
    </fieldset>
  );
}
