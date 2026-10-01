import { Show, type JSX } from "solid-js";
import { Badge } from "../../components/ui";
import { t } from "../../i18n";

// Header shared by every settings page: breadcrumb, title and the state chips.
export function PageHead(props: { crumb: string; title: string; lead?: JSX.Element; owner?: boolean; aside?: JSX.Element }) {
  return (
    <header class="mg-page-head">
      <div>
        <p class="mg-crumb">{props.crumb}</p>
        <div class="mg-title-row">
          <h1>{props.title}</h1>
          <Badge tone="secure" mono icon="lock">{t("mgmt.settings.e2eeChip")}</Badge>
          <Show when={props.owner}>
            <Badge tone="primary" icon="key">{t("mgmt.settings.ownerChip")}</Badge>
          </Show>
        </div>
        <Show when={props.lead}><p class="mg-page-lead">{props.lead}</p></Show>
      </div>
      {props.aside}
    </header>
  );
}
