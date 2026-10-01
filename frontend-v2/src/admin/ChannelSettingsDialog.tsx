import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js";
import {
  ApiError,
  api,
  deleteChannel,
  deleteChannelMute,
  fetchChannelAccess,
  fetchChannelAcl,
  fetchChannelMutes,
  fetchServerRoles,
  patchChannel,
  putChannelAcl,
  putChannelMute,
  type Channel,
  type ChannelAccessExplain,
  type ChannelAclEntry,
  type ChannelMute,
  type ServerMember,
} from "../api/client";
import { Button, Dialog } from "../components/ui";
import { t } from "../i18n";
import { errorText } from "../lib/errors";

export type ChannelTab = "access" | "inspect" | "mute" | "general";

const EVERYONE_SUBJECT_ID = "00000000-0000-0000-0000-000000000000";
const MUTE_PRESETS = [5, 10, 15, 30] as const;

type SubjectType = ChannelAclEntry["subject_type"];
type Effect = NonNullable<ChannelAclEntry["effect"]>;

export function remainingLabel(endsAt: string, now = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return t("admin.mute.expired");
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return t("admin.mute.remainingMins", { n: mins });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0
    ? t("admin.mute.remainingHoursMins", { h, m })
    : t("admin.mute.remainingHours", { h });
}

export function ChannelSettingsDialog(props: {
  open: boolean;
  channel: Channel | null;
  meId: string;
  ownerId: string;
  canMute: boolean;
  onClose: () => void;
  onChanged: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}) {
  const [tab, setTab] = createSignal<ChannelTab>("access");
  createEffect(() => {
    if (props.open) setTab("access");
  });
  const tabs = createMemo<ChannelTab[]>(() => [
    "access",
    "inspect",
    ...(props.canMute ? (["mute"] as ChannelTab[]) : []),
    "general",
  ]);
  return (
    <Dialog
      open={props.open}
      title={t("admin.channel.settingsTitle", {
        name: props.channel?.name ?? "",
      })}
      onClose={props.onClose}
    >
      <Show when={props.channel}>
        {(channel) => (
          <div class="channel-settings">
            <nav class="settings-tabs" aria-label={t("admin.channel.settings")}>
              <For each={tabs()}>
                {(item) => (
                  <button
                    classList={{ active: tab() === item }}
                    aria-current={tab() === item ? "page" : undefined}
                    onClick={() => setTab(item)}
                  >
                    {t(`admin.channel.tab.${item}`)}
                  </button>
                )}
              </For>
            </nav>
            <Show when={tab() === "access"}>
              <AccessTab
                channel={channel()}
                onClose={props.onClose}
                onChanged={props.onChanged}
              />
            </Show>
            <Show when={tab() === "inspect"}>
              <InspectTab channel={channel()} />
            </Show>
            <Show when={tab() === "mute"}>
              <MuteTab
                channel={channel()}
                meId={props.meId}
                ownerId={props.ownerId}
              />
            </Show>
            <Show when={tab() === "general"}>
              <GeneralTab channel={channel()} onDeleted={props.onDeleted} />
            </Show>
          </div>
        )}
      </Show>
    </Dialog>
  );
}

function useServerPeople(channel: () => Channel) {
  const [members] = createResource(
    () => channel().server_id,
    (id) => api<ServerMember[]>(`/api/servers/${id}/members`),
  );
  const [roles] = createResource(() => channel().server_id, fetchServerRoles);
  return { members, roles };
}

function AccessTab(props: {
  channel: Channel;
  onClose: () => void;
  onChanged: (channel: Channel) => void;
}) {
  const { members, roles } = useServerPeople(() => props.channel);
  const [entries, setEntries] = createSignal<ChannelAclEntry[]>([]);
  const [visibility, setVisibility] = createSignal<"public" | "private">(
    props.channel.visibility,
  );
  const [visibleToNew, setVisibleToNew] = createSignal(
    props.channel.visible_to_new_members,
  );
  const [subjectType, setSubjectType] = createSignal<SubjectType>("account");
  const [subjectId, setSubjectId] = createSignal("");
  const [effect, setEffect] = createSignal<Effect>("allow");
  const levels = () =>
    props.channel.type === "text"
      ? (["read", "write"] as const)
      : (["listen", "speak"] as const);
  const [level, setLevel] = createSignal<ChannelAclEntry["level"]>(
    props.channel.type === "text" ? "write" : "speak",
  );
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  void fetchChannelAcl(props.channel.id)
    .then(setEntries)
    .catch((err) => setError(errorText(err)));

  const subjects = createMemo<{ id: string; label: string }[]>(() => {
    if (subjectType() === "everyone") return [];
    if (subjectType() === "account")
      return (members() ?? []).map((m) => ({
        id: m.account_id,
        label: m.display_name || m.handle,
      }));
    return (roles() ?? []).map((r) => ({ id: r.id, label: r.name }));
  });
  createEffect(() => {
    setSubjectId(
      subjectType() === "everyone"
        ? EVERYONE_SUBJECT_ID
        : (subjects()[0]?.id ?? ""),
    );
  });
  const viewDenyBlocked = () =>
    visibility() === "public" && effect() === "deny";
  const availableLevels = () =>
    viewDenyBlocked()
      ? levels().filter((l) => l === "write" || l === "speak")
      : [...levels()];
  createEffect(() => {
    if (viewDenyBlocked() && (level() === "read" || level() === "listen"))
      setLevel(props.channel.type === "text" ? "write" : "speak");
  });
  const subjectLabel = (entry: ChannelAclEntry) => {
    if (entry.subject_type === "everyone") return t("admin.acl.everyone");
    if (entry.subject_type === "account")
      return (
        (members() ?? []).find((m) => m.account_id === entry.subject_id)
          ?.handle ?? entry.subject_id
      );
    return (
      (roles() ?? []).find((r) => r.id === entry.subject_id)?.name ??
      entry.subject_id
    );
  };
  function add() {
    if (subjectType() !== "everyone" && !subjectId()) return;
    const entry: ChannelAclEntry = {
      subject_type: subjectType(),
      subject_id:
        subjectType() === "everyone" ? EVERYONE_SUBJECT_ID : subjectId(),
      level: level(),
      effect: effect(),
    };
    setEntries((prev) => [
      ...prev.filter(
        (i) =>
          !(
            i.subject_type === entry.subject_type &&
            i.subject_id === entry.subject_id &&
            i.level === entry.level &&
            (i.effect ?? "allow") === effect()
          ),
      ),
      entry,
    ]);
  }
  async function save() {
    if (saving()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await patchChannel(props.channel.id, {
        visibility: visibility(),
        visible_to_new_members: visibility() === "public" && visibleToNew(),
      });
      await putChannelAcl(props.channel.id, entries());
      props.onChanged(updated);
      props.onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div class="admin-form">
      <fieldset class="admin-fieldset">
        <legend>{t("admin.channel.visibility")}</legend>
        <label class="choice">
          <input
            type="radio"
            name="acl-visibility"
            checked={visibility() === "public"}
            onChange={() => setVisibility("public")}
          />
          <span>{t("admin.channel.public")}</span>
        </label>
        <label class="choice">
          <input
            type="radio"
            name="acl-visibility"
            checked={visibility() === "private"}
            onChange={() => setVisibility("private")}
          />
          <span>{t("admin.channel.private")}</span>
        </label>
      </fieldset>
      <Show when={visibility() === "public"}>
        <label class="choice">
          <input
            type="checkbox"
            checked={visibleToNew()}
            onChange={(e) => setVisibleToNew(e.currentTarget.checked)}
          />
          <span>{t("admin.channel.visibleToNew")}</span>
        </label>
      </Show>
      <div class="rule-builder">
        <select
          aria-label={t("admin.acl.subjectType")}
          value={subjectType()}
          onChange={(e) => setSubjectType(e.currentTarget.value as SubjectType)}
        >
          <option value="account">{t("admin.acl.member")}</option>
          <option value="role">{t("admin.acl.role")}</option>
          <option value="everyone">{t("admin.acl.everyone")}</option>
        </select>
        <Show when={subjectType() !== "everyone"}>
          <select
            aria-label={t("admin.acl.subject")}
            value={subjectId()}
            onChange={(e) => setSubjectId(e.currentTarget.value)}
          >
            <For each={subjects()}>
              {(s) => (
                <option value={s.id} selected={s.id === subjectId()}>
                  {s.label}
                </option>
              )}
            </For>
          </select>
        </Show>
        <select
          aria-label={t("admin.acl.effect")}
          value={effect()}
          onChange={(e) => setEffect(e.currentTarget.value as Effect)}
        >
          <option value="allow">{t("admin.acl.allow")}</option>
          <option value="deny">{t("admin.acl.deny")}</option>
        </select>
        <select
          aria-label={t("admin.acl.level")}
          value={level()}
          onChange={(e) =>
            setLevel(e.currentTarget.value as ChannelAclEntry["level"])
          }
        >
          <For each={availableLevels()}>
            {(l) => (
              <option value={l} selected={l === level()}>
                {t(`admin.acl.levels.${l}`)}
              </option>
            )}
          </For>
        </select>
        <Button
          onClick={add}
          disabled={subjectType() !== "everyone" && !subjectId()}
        >
          {t("admin.acl.add")}
        </Button>
      </div>
      <Show when={visibility() === "public"}>
        <p class="muted">{t("admin.acl.publicNote")}</p>
      </Show>
      <ul class="rule-list" aria-label={t("admin.acl.rules")}>
        <For
          each={entries()}
          fallback={<li class="muted">{t("admin.acl.noRules")}</li>}
        >
          {(entry) => (
            <li>
              <span>
                {t(`admin.acl.type.${entry.subject_type}`)}:{" "}
                <strong>{subjectLabel(entry)}</strong>
              </span>
              <span>
                {t(
                  entry.effect === "deny"
                    ? "admin.acl.deny"
                    : "admin.acl.allow",
                )}{" "}
                — {t(`admin.acl.levels.${entry.level}`)}
              </span>
              <button
                aria-label={t("admin.acl.remove", {
                  name: subjectLabel(entry),
                })}
                onClick={() =>
                  setEntries((prev) => prev.filter((i) => i !== entry))
                }
              >
                ×
              </button>
            </li>
          )}
        </For>
      </ul>
      <Show when={error()}>
        <p class="form-error" role="alert">
          {error()}
        </p>
      </Show>
      <div class="dialog-actions">
        <Button onClick={props.onClose}>{t("admin.cancel")}</Button>
        <Button
          variant="primary"
          disabled={saving()}
          onClick={() => void save()}
        >
          {t("admin.save")}
        </Button>
      </div>
    </div>
  );
}

function InspectTab(props: { channel: Channel }) {
  const { members } = useServerPeople(() => props.channel);
  const [accountId, setAccountId] = createSignal("");
  const [result, setResult] = createSignal<ChannelAccessExplain | null>(null);
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  createEffect(() => {
    if (!accountId()) setAccountId(members()?.[0]?.account_id ?? "");
  });
  async function inspect() {
    if (!accountId() || busy()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await fetchChannelAccess(props.channel.id, accountId()));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div class="admin-form">
      <p class="muted">{t("admin.inspect.hint")}</p>
      <div class="rule-builder">
        <select
          aria-label={t("admin.inspect.member")}
          value={accountId()}
          onChange={(e) => setAccountId(e.currentTarget.value)}
        >
          <For each={members() ?? []}>
            {(m) => (
              <option
                value={m.account_id}
                selected={m.account_id === accountId()}
              >
                {m.display_name || m.handle}
              </option>
            )}
          </For>
        </select>
        <Button
          variant="primary"
          disabled={!accountId() || busy()}
          onClick={() => void inspect()}
        >
          {t("admin.inspect.action")}
        </Button>
      </div>
      <Show when={result()}>
        {(r) => (
          <div class="inspect-result">
            <p>
              <strong>{t("admin.inspect.canView")}:</strong>{" "}
              {r().view ? t("admin.yes") : t("admin.no")}
            </p>
            <p>
              <strong>{t("admin.inspect.level")}:</strong>{" "}
              {r().level ? t(`admin.acl.levels.${r().level}`) : "—"}
            </p>
            <p class="muted">{t("admin.inspect.precedence")}</p>
            <ol class="factor-list">
              <For each={r().factors}>
                {(f) => (
                  <li>
                    <span class="muted">{f.layer}:</span> {f.detail}
                  </li>
                )}
              </For>
            </ol>
          </div>
        )}
      </Show>
      <Show when={error()}>
        <p class="form-error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}

function MuteTab(props: { channel: Channel; meId: string; ownerId: string }) {
  const { members } = useServerPeople(() => props.channel);
  const [mutes, { refetch }] = createResource(
    () => props.channel.id,
    async (id) => {
      try {
        return await fetchChannelMutes(id);
      } catch {
        return [] as ChannelMute[];
      }
    },
  );
  const [target, setTarget] = createSignal<ServerMember | null>(null);
  const [custom, setCustom] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [now, setNow] = createSignal(Date.now());
  const timer = window.setInterval(() => setNow(Date.now()), 15_000);
  onCleanup(() => window.clearInterval(timer));
  const muteOf = (id: string) =>
    (mutes() ?? []).find(
      (m) => m.account_id === id && new Date(m.ends_at).getTime() > now(),
    );
  const actable = (m: ServerMember) =>
    m.account_id !== props.meId && m.account_id !== props.ownerId;
  async function apply(minutes: number) {
    const member = target();
    if (!member || !Number.isFinite(minutes) || minutes < 1 || busy()) return;
    setBusy(true);
    setError("");
    try {
      await putChannelMute(
        props.channel.id,
        member.account_id,
        Math.floor(minutes),
      );
      setTarget(null);
      setCustom("");
      await refetch();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function unmute(member: ServerMember) {
    setBusy(true);
    setError("");
    try {
      await deleteChannelMute(props.channel.id, member.account_id);
      await refetch();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div class="admin-form">
      <ul class="member-list">
        <For
          each={(members() ?? []).filter(actable)}
          fallback={<li class="muted">{t("admin.members.none")}</li>}
        >
          {(member) => (
            <li class="member-row">
              <span class="member-name">
                <strong>{member.display_name || member.handle}</strong>
                <small>@{member.handle}</small>
              </span>
              <Show
                when={muteOf(member.account_id)}
                fallback={
                  <Button
                    disabled={busy()}
                    onClick={() => {
                      setTarget(member);
                      setError("");
                    }}
                  >
                    {t("admin.mute.action")}
                  </Button>
                }
              >
                {(mute) => (
                  <>
                    <span class="mute-remaining">
                      {t("admin.mute.muted", {
                        remaining: remainingLabel(mute().ends_at, now()),
                      })}
                    </span>
                    <Button
                      disabled={busy()}
                      onClick={() => void unmute(member)}
                    >
                      {t("admin.mute.unmute")}
                    </Button>
                  </>
                )}
              </Show>
            </li>
          )}
        </For>
      </ul>
      <Show when={target()}>
        {(member) => (
          <div
            class="mute-picker"
            role="group"
            aria-label={t("admin.mute.durationFor", { name: member().handle })}
          >
            <strong>
              {t("admin.mute.durationFor", { name: member().handle })}
            </strong>
            <div class="mute-presets">
              <For each={MUTE_PRESETS}>
                {(minutes) => (
                  <Button disabled={busy()} onClick={() => void apply(minutes)}>
                    {t("admin.mute.minutes", { n: minutes })}
                  </Button>
                )}
              </For>
            </div>
            <div class="rule-builder">
              <input
                type="number"
                min="1"
                inputmode="numeric"
                aria-label={t("admin.mute.custom")}
                placeholder={t("admin.mute.custom")}
                value={custom()}
                onInput={(e) => setCustom(e.currentTarget.value)}
              />
              <Button
                variant="primary"
                disabled={busy() || !(Number(custom()) >= 1)}
                onClick={() => void apply(Number(custom()))}
              >
                {t("admin.mute.apply")}
              </Button>
              <Button onClick={() => setTarget(null)}>
                {t("admin.cancel")}
              </Button>
            </div>
          </div>
        )}
      </Show>
      <Show when={error()}>
        <p class="form-error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}

function GeneralTab(props: {
  channel: Channel;
  onDeleted: (channelId: string) => void;
}) {
  const [confirming, setConfirming] = createSignal(false);
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await deleteChannel(props.channel.id);
      props.onDeleted(props.channel.id);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 409 || err.code === "last_channel_of_type")
      )
        setError(t("admin.channel.lastOfType"));
      else setError(errorText(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div class="admin-form">
      <h3>{t("admin.channel.delete")}</h3>
      <p class="muted">{t("admin.channel.deleteHint")}</p>
      <Show
        when={!confirming()}
        fallback={
          <div class="dialog-actions">
            <span>
              {t("admin.channel.deleteConfirm", { name: props.channel.name })}
            </span>
            <Button onClick={() => setConfirming(false)}>
              {t("admin.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={busy()}
              onClick={() => void remove()}
            >
              {t("admin.channel.deleteAction")}
            </Button>
          </div>
        }
      >
        <div class="dialog-actions">
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {t("admin.channel.deleteAction")}
          </Button>
        </div>
      </Show>
      <Show when={error()}>
        <p class="form-error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}
