import { createSignal } from "solid-js";
import { checkInstance, saveInstanceUrl } from "../api/instance";
import { Button, Icon } from "../components/ui";
import { t } from "../i18n";
import { AuthField, AuthFrame, bindValue } from "./AuthFrame";

const features = () => [
  { icon: "dns", title: t("instance.featureHost"), text: t("instance.featureHostText") },
  { icon: "lock", title: t("instance.featureLocal"), text: t("instance.featureLocalText") },
];

function failureText(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "empty") return t("instance.empty");
  if (code === "protocol") return t("instance.protocol");
  if (code === "invalid") return t("instance.invalid");
  if (code === "unreachable") return t("instance.unreachable");
  return t("instance.unexpected");
}

/** Asks for a Mesa address and stores it only after GET /health succeeds. */
export function InstanceConnect(props: { onSaved: () => void }) {
  const [address, setAddress] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      const base = await checkInstance(address());
      await saveInstanceUrl(base);
      props.onSaved();
    } catch (error) {
      setProblem(failureText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame headline={t("instance.headline")} text={t("instance.pitch")} features={features()}>
      <form class="flex flex-col gap-5" onSubmit={(event) => void submit(event)}>
        <div>
          <h2 class="font-display text-headline-md">{t("instance.title")}</h2>
          <p class="mt-2 text-body-md text-on-surface-variant">{t("instance.intro")}</p>
        </div>
        <AuthField label={t("instance.address")} error={problem()} lead={<Icon name="link" class="text-[18px]" />}>
          <input
            class="min-w-0 flex-1 bg-transparent py-3 text-body-md outline-none"
            type="url"
            inputMode="url"
            autocomplete="url"
            placeholder={t("instance.placeholder")}
            required
            disabled={busy()}
            {...bindValue(address, setAddress)}
          />
        </AuthField>
        <Button type="submit" variant="primary" disabled={busy()}>
          {busy() ? t("instance.checking") : t("instance.continue")}
        </Button>
      </form>
    </AuthFrame>
  );
}
