import { Show, type JSX } from "solid-js";
import { Badge, Checkbox, Icon } from "../components/ui";
import { createCopy } from "../lib/copy";
import { t } from "../i18n";

// The key block shared by "create server" and "create channel": what the key protects, the key
// itself with a copy button, and the acknowledgement that must be ticked before creating.
export function KeyCustody(props: {
  icon: string;
  title: string;
  text: string;
  value: string;
  copyLabel: string;
  acknowledged: boolean;
  onAcknowledge: (checked: boolean) => void;
  acknowledgement: string;
  detail?: string;
  children?: JSX.Element;
}) {
  const { copied, copy } = createCopy();
  return (
    <section class="mg-custody">
      <header>
        <Icon name={props.icon} />
        <h3>{props.title}</h3>
        <Badge tone="secure" mono>{t("mgmt.key.badge")}</Badge>
      </header>
      <p>{props.text}</p>
      <div class="mg-key-row">
        <code data-testid="key-value">{props.value}</code>
        <button type="button" onClick={() => void copy(props.value)}>
          <Icon name={copied() ? "check" : "content_copy"} />
          {copied() ? t("mgmt.copied") : props.copyLabel}
        </button>
      </div>
      <Checkbox checked={props.acknowledged} onChange={(event) => props.onAcknowledge(event.currentTarget.checked)}>
        <strong>{props.acknowledgement}</strong>
        <Show when={props.detail}>{(text) => <small>{text()}</small>}</Show>
      </Checkbox>
      {props.children}
    </section>
  );
}
