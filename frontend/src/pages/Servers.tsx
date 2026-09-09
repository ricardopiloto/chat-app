import type { Account } from "../api/client";
import type { Identity } from "../crypto/identity";
import { t } from "../i18n";

type Props = {
  me: Account;
  identity: Identity;
};

/** Home pane — navigation lives in Sidebar; main only shows a quiet empty state. */
export default function Servers(_props: Props) {
  return (
    <div class="home-empty pane">
      <div>
        <p style={{ "font-size": "16px", "font-weight": "600", color: "var(--color-text)" }}>
          {t("servers.pickChannel")}
        </p>
        <p class="muted">{t("servers.pickChannelHint")}</p>
      </div>
    </div>
  );
}
