import { Button } from "../components/ui";
import { t } from "../i18n";
import { useCall } from "./callSession";

export function CallElsewhere() {
  const call = useCall();
  return (
    <section class="call-elsewhere">
      <p>{t("call.popout.elsewhere")}</p>
      <Button variant="secondary" onClick={() => void call.closePopout()}>{t("call.popout.bringBack")}</Button>
    </section>
  );
}
