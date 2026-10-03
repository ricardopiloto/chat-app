import { For, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { auth } from "../api";
import { Avatar, Badge, Button, Card, Checkbox, ContextMenu, Dialog, Icon, Logo, MonoLabel, Radio, Segmented, Select, Switch, TextField, Toast, Tooltip } from "../components/ui";
import { LOCALES, getLocale, setLocale, t, type AppLocale } from "../i18n";
import { applyTheme } from "../shell/theme";

// Verification screen for the base library: every variant of every component, side by side, in the
// active theme and language. It is not a product route.

const SWATCHES = ["background", "surface-container-low", "surface-container-high", "primary-container", "secondary", "tertiary", "error", "on-surface"];

const Row = (props: { children: JSX.Element }) => <div class="flex flex-wrap items-center gap-4">{props.children}</div>;

function activeBreakpoint(width: number): "mobile" | "tablet" | "desktop" {
  if (width < 768) return "mobile";
  return width <= 1024 ? "tablet" : "desktop";
}

export function Foundation() {
  const session = createQuery(() => ({ queryKey: ["foundation", "session"], queryFn: auth.me, retry: false }));
  const [theme, setTheme] = createSignal<"dark" | "light">(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const [locale, setLocaleSignal] = createSignal<AppLocale>(getLocale());
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [toastOn, setToastOn] = createSignal(false);
  const [choice, setChoice] = createSignal("a");
  const [view, setView] = createSignal<"grid" | "list">("grid");
  const [width, setWidth] = createSignal(window.innerWidth);

  const onResize = () => setWidth(window.innerWidth);
  onMount(() => window.addEventListener("resize", onResize));
  onCleanup(() => window.removeEventListener("resize", onResize));

  const pickTheme = (next: "dark" | "light") => {
    setTheme(next);
    applyTheme(next);
  };
  const pickLocale = (next: AppLocale) => {
    setLocale(next);
    setLocaleSignal(next);
  };
  const showToast = () => {
    setToastOn(true);
    window.setTimeout(() => setToastOn(false), 2400);
  };
  const sessionState = () => (session.isPending ? "pending" : session.isError ? "failed" : "ok");

  return (
    <main class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 desktop:px-8 desktop:py-12">
      <header class="flex flex-col gap-6 tablet:flex-row tablet:items-end tablet:justify-between">
        <div class="flex items-center gap-4">
          <Logo variant="full" size={72} />
          <div class="flex flex-col gap-1">
            <Badge tone="secure" mono icon="shield_lock">{t("foundation.caption")}</Badge>
            <h1 class="font-display text-display-lg-mobile desktop:text-display-lg">{t("foundation.title")}</h1>
            <p class="text-body-md text-on-surface-variant">{t("foundation.description")}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1">
            <MonoLabel>{t("foundation.theme")}</MonoLabel>
            <Segmented
              label={t("foundation.theme")}
              value={theme()}
              options={[{ value: "dark", label: t("foundation.dark") }, { value: "light", label: t("foundation.light") }]}
              onChange={pickTheme}
            />
          </div>
          <div class="flex flex-col gap-1">
            <MonoLabel>{t("foundation.language")}</MonoLabel>
            <Segmented label={t("foundation.language")} value={locale()} options={LOCALES.map((l) => ({ value: l.code, label: l.name }))} onChange={pickLocale} />
          </div>
        </div>
      </header>

      <div class="grid gap-6 tablet:grid-cols-2">
        <Card icon="touch_app" label={t("foundation.buttons.label")} title={t("foundation.buttons.title")}>
          <Row>
            <Button variant="primary" onClick={showToast}><Icon name="check" />{t("foundation.buttons.primary")}</Button>
            <Button variant="secondary"><Icon name="tune" />{t("foundation.buttons.secondary")}</Button>
            <Button variant="danger"><Icon name="delete" />{t("foundation.buttons.danger")}</Button>
            <Button variant="icon" title={t("foundation.buttons.icon")}><Icon name="search" /></Button>
            <Button variant="icon" title={t("foundation.buttons.icon")}><Icon name="mic" /></Button>
            <Button variant="icon" title={t("foundation.buttons.icon")}><Icon name="settings" /></Button>
          </Row>
          <Row>
            <Button variant="primary" disabled>{t("foundation.buttons.disabled")}</Button>
            <Button variant="secondary" disabled>{t("foundation.buttons.disabled")}</Button>
          </Row>
        </Card>

        <Card icon="edit_note" label={t("foundation.forms.label")} title={t("foundation.forms.title")}>
          <div class="grid gap-4 mobile:grid-cols-1 tablet:grid-cols-2">
            <TextField label={t("foundation.forms.input")} placeholder={t("foundation.forms.sample")} />
            <TextField label={t("foundation.forms.required")} value="x" error={t("foundation.forms.error")} />
            <TextField label={t("foundation.forms.disabled")} value={t("foundation.forms.sample")} disabled />
            <Select label={t("foundation.forms.select")} value={choice()} onChange={(e) => setChoice(e.currentTarget.value)}>
              <option value="a">{t("foundation.forms.optionA")}</option>
              <option value="b">{t("foundation.forms.optionB")}</option>
            </Select>
          </div>
          <Row>
            <Radio name="foundation-radio" value="a" checked>{t("foundation.forms.optionA")}</Radio>
            <Radio name="foundation-radio" value="b">{t("foundation.forms.optionB")}</Radio>
            <Radio name="foundation-radio-off" value="c" disabled>{t("foundation.forms.disabled")}</Radio>
          </Row>
          <Row>
            <Checkbox checked>{t("foundation.forms.checkbox")}</Checkbox>
            <Checkbox error={t("foundation.forms.error")}>{t("foundation.forms.required")}</Checkbox>
            <Checkbox disabled>{t("foundation.forms.disabled")}</Checkbox>
          </Row>
          <Row>
            <Switch label={t("foundation.forms.toggle")} checked />
            <Switch label={t("foundation.forms.toggle")} />
            <Switch label={t("foundation.forms.disabled")} disabled />
          </Row>
          <Segmented label={t("foundation.forms.segmented")} value={view()} options={[{ value: "grid", label: t("foundation.forms.grid") }, { value: "list", label: t("foundation.forms.list") }]} onChange={setView} />
        </Card>

        <Card icon="layers" label={t("foundation.overlays.label")} title={t("foundation.overlays.title")}>
          <Row>
            <Button variant="primary" onClick={() => setDialogOpen(true)}><Icon name="open_in_new" />{t("foundation.overlays.openDialog")}</Button>
            <Button onClick={showToast}><Icon name="notifications" />{t("foundation.overlays.showToast")}</Button>
          </Row>
          <ContextMenu items={[{ label: t("foundation.overlays.menuEdit"), action: showToast }, { label: t("foundation.overlays.menuDelete"), danger: true, action: showToast }]}>
            <div class="rounded-md border border-dashed border-outline-variant p-6 text-body-sm text-on-surface-variant">{t("foundation.overlays.menuHint")}</div>
          </ContextMenu>
        </Card>

        <Card icon="badge" label={t("foundation.identity.label")} title={t("foundation.identity.title")}>
          <Row>
            <Avatar name={t("foundation.identity.online")} online size="sm" />
            <Avatar name={t("foundation.identity.online")} online />
            <Avatar name={t("foundation.identity.offline")} online={false} size="lg" />
          </Row>
          <Row>
            <Badge tone="secure" mono icon="lock">{t("foundation.identity.e2ee")}</Badge>
            <Badge tone="live" mono>{t("foundation.identity.live")}</Badge>
            <Badge tone="primary" mono>{t("foundation.identity.role")}</Badge>
            <Badge tone="neutral" mono>{t("foundation.identity.state")}</Badge>
            <Badge tone="danger">{t("foundation.buttons.danger")}</Badge>
          </Row>
          <Tooltip text={t("foundation.identity.tooltipText")}>
            <Button><Icon name="info" />{t("foundation.identity.tooltip")}</Button>
          </Tooltip>
        </Card>
      </div>

      <Card icon="info" label={t("foundation.cards.label")} title={t("foundation.cards.title")}>
        <p class="text-body-md text-on-surface-variant">{t("foundation.cards.body")}</p>
      </Card>

      <Card icon="palette" label={t("foundation.tokens.label")} title={t("foundation.tokens.title", { theme: t(`foundation.${theme()}`) })}>
        <div class="flex flex-wrap gap-3">
          <For each={SWATCHES}>
            {(name) => (
              <div class="flex flex-col gap-1">
                <span class="h-10 w-20 rounded-sm border border-outline-variant" style={{ background: `var(--${name})` }} />
                <MonoLabel>{name}</MonoLabel>
              </div>
            )}
          </For>
        </div>
      </Card>

      <div class="grid gap-6 tablet:grid-cols-2">
        <Card icon="cloud_sync" label={t("foundation.query.label")} title={t("foundation.query.title")}>
          <Badge tone={sessionState() === "pending" ? "neutral" : sessionState() === "ok" ? "secure" : "danger"} mono>
            {t(`foundation.query.${sessionState()}`)}
          </Badge>
        </Card>
        <Card icon="devices" label={t("foundation.breakpoint.label")} title={t("foundation.breakpoint.title")}>
          <Badge tone="primary" mono>{t(`foundation.breakpoint.${activeBreakpoint(width())}`)} · {width()}px</Badge>
        </Card>
      </div>

      <Dialog open={dialogOpen()} title={t("foundation.overlays.dialogTitle")} onClose={() => setDialogOpen(false)}>
        <p>{t("foundation.overlays.dialogBody")}</p>
        <Button variant="primary" onClick={() => setDialogOpen(false)}>{t("foundation.overlays.close")}</Button>
      </Dialog>
      <Toast message={t("foundation.overlays.toast")} show={toastOn()} />
    </main>
  );
}
