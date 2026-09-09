import { t } from "../i18n";

export default function SettingsHomePage() {
  return (
    <div class="settings-home-page main" role="main">
      <h1 class="settings-home-title">{t("settings.homeTitle")}</h1>
      <p class="muted settings-home-copy">{t("settings.homeCopy")}</p>
    </div>
  );
}
