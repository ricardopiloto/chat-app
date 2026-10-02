import { For, Show, createEffect, createMemo, createResource, createSignal } from "solid-js";
import { useShell } from "../../shell/state";
import { errorText } from "../../lib/errors";
import { t } from "../../i18n";
import { Badge, Button, Icon, Radio, Segmented } from "../../components/ui";
import { acl, channels, type AclEntry, type Channel } from "../../api";

const EVERYONE_ID = "00000000-0000-0000-0000-000000000000";

type Subject = AclEntry["subject_type"];
type Effect = AclEntry["effect"];
type Level = AclEntry["level"];
type Rule = Pick<AclEntry, "subject_type" | "subject_id" | "level" | "effect">;

const SUBJECT_ICON: Record<Subject, string> = { role: "badge", account: "person", everyone: "groups" };
/** Precedence layer of each subject type: member overrides role, role overrides everyone. */
const LAYER: Record<Subject, number> = { account: 1, role: 2, everyone: 3 };
const SUBJECT_KEY: Record<Subject, string> = { role: "typeRole", account: "typeMember", everyone: "typeEveryone" };

// Visibility, the rule builder and the list of active rules for one channel. Rules are edited as a
// draft and sent together with the visibility only when "Guardar alterações" is pressed.
export function AccessPanel(props: {
  channel: Channel;
  onSaved: (channel: Channel) => void;
  onCancel: () => void;
  onDelete: () => void;
  onCount: (count: number) => void;
}) {
  const shell = useShell();
  const text = () => props.channel.type === "text";
  const levels = (): Level[] => (text() ? ["read", "write"] : ["listen", "speak"]);

  const [visibility, setVisibility] = createSignal(props.channel.visibility);
  const [listed, setListed] = createSignal(props.channel.visible_to_new_members);
  const [rules, setRules] = createSignal<Rule[]>([]);
  const [subjectType, setSubjectType] = createSignal<Subject>("role");
  const [subjectId, setSubjectId] = createSignal("");
  const [effect, setEffect] = createSignal<Effect>("allow");
  const [level, setLevel] = createSignal<Level>(text() ? "write" : "speak");
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const [loaded] = createResource(
    () => props.channel.id,
    async (id) => {
      try {
        const current = await acl.list(id);
        setRules(current.map(({ subject_type, subject_id, level, effect }) => ({ subject_type, subject_id, level, effect })));
      } catch (failure) {
        setError(errorText(failure, "mgmt.error"));
      }
      return true;
    },
  );
  createEffect(() => props.onCount(rules().length));

  const people = () => shell.members.data ?? [];
  const roleList = () => (shell.roles.data ?? []).filter((role) => !role.is_system);
  const subjects = createMemo(() => {
    if (subjectType() === "everyone") return [];
    if (subjectType() === "account") return people().map((m) => ({ id: m.account_id, label: `@${m.handle}` }));
    return roleList().map((r) => ({ id: r.id, label: r.name }));
  });
  createEffect(() => setSubjectId(subjectType() === "everyone" ? EVERYONE_ID : (subjects()[0]?.id ?? "")));

  // A public channel cannot be hidden: denying the lowest level is refused by the backend.
  const viewDenyBlocked = () => visibility() === "public" && effect() === "deny";
  const levelChoices = () => (viewDenyBlocked() ? levels().slice(1) : levels());
  createEffect(() => {
    if (!levelChoices().includes(level())) setLevel(levelChoices()[0]!);
  });

  const nameOf = (rule: Rule) => {
    if (rule.subject_type === "everyone") return t("mgmt.channel.everyone");
    if (rule.subject_type === "account") return `@${people().find((m) => m.account_id === rule.subject_id)?.handle ?? rule.subject_id}`;
    return roleList().find((r) => r.id === rule.subject_id)?.name ?? rule.subject_id;
  };

  function add() {
    if (subjectType() !== "everyone" && !subjectId()) return;
    const rule: Rule = { subject_type: subjectType(), subject_id: subjectType() === "everyone" ? EVERYONE_ID : subjectId(), level: level(), effect: effect() };
    setRules((all) => [...all.filter((r) => !(r.subject_type === rule.subject_type && r.subject_id === rule.subject_id && r.level === rule.level && r.effect === rule.effect)), rule]);
  }

  async function save() {
    if (saving()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await channels.update(props.channel.id, { visibility: visibility(), visible_to_new_members: visibility() === "public" && listed() });
      await acl.replace(props.channel.id, rules());
      props.onSaved(updated);
    } catch (failure) {
      setError(errorText(failure, "mgmt.error"));
      setSaving(false);
    }
  }

  return (
    <>
      <div class="mg-panel-body">
        <section class="mg-card compact">
          <h3 class="mg-card-title"><Icon name="visibility" />{t("mgmt.channel.baseTitle")}</h3>
          <fieldset class="mg-block mg-vis-grid">
            <Radio name="channel-visibility" value="public" checked={visibility() === "public"} onChange={() => setVisibility("public")}>
              <span class="mg-option">
                <Icon name="public" /><strong>{t("mgmt.channel.public")}</strong><Badge tone="secure" mono>{t("mgmt.channel.publicBadge")}</Badge>
                <small>{t("mgmt.channel.publicText")}</small>
              </span>
            </Radio>
            <Radio name="channel-visibility" value="private" checked={visibility() === "private"} onChange={() => setVisibility("private")}>
              <span class="mg-option">
                <Icon name="lock" /><strong>{t("mgmt.channel.private")}</strong><Badge tone="neutral" mono>{t("mgmt.channel.privateBadge")}</Badge>
                <small>{t("mgmt.channel.privateText")}</small>
              </span>
            </Radio>
          </fieldset>
          <label class="choice mg-listed-row" classList={{ off: visibility() === "private" }}>
            <input type="checkbox" checked={listed()} disabled={visibility() === "private"} onChange={(event) => setListed(event.currentTarget.checked)} />
            <span>{t("mgmt.channel.listed")}</span>
          </label>
        </section>

        <section class="mg-card compact">
          <h3 class="mg-card-title"><Icon name="rule" />{t("mgmt.channel.ruleTitle")}</h3>
          <div class="mg-rule-builder">
            <label class="mg-field">
              <span class="mg-label">{t("mgmt.channel.stepSubject")}</span>
              <select value={subjectType()} onChange={(event) => setSubjectType(event.currentTarget.value as Subject)}>
                <option value="role">{t("mgmt.channel.subjectRole")}</option>
                <option value="account">{t("mgmt.channel.subjectMember")}</option>
                <option value="everyone">{t("mgmt.channel.subjectEveryone")}</option>
              </select>
            </label>
            <label class="mg-field">
              <span class="mg-label">{t("mgmt.channel.stepIdentity")}</span>
              <select value={subjectId()} disabled={subjectType() === "everyone"} onChange={(event) => setSubjectId(event.currentTarget.value)}>
                <Show when={subjectType() !== "everyone"} fallback={<option value={EVERYONE_ID}>{t("mgmt.channel.everyone")}</option>}>
                  <For each={subjects()}>{(subject) => <option value={subject.id} selected={subject.id === subjectId()}>{subject.label}</option>}</For>
                </Show>
              </select>
            </label>
            <div class="mg-field">
              <span class="mg-label">{t("mgmt.channel.stepEffect")}</span>
              <Segmented
                label={t("mgmt.channel.stepEffect")}
                value={effect()}
                onChange={setEffect}
                options={[
                  { value: "allow", label: t("mgmt.channel.allow") },
                  { value: "deny", label: t("mgmt.channel.deny") },
                ]}
              />
            </div>
            <label class="mg-field">
              <span class="mg-label">{t("mgmt.channel.stepLevel")}</span>
              <select value={level()} onChange={(event) => setLevel(event.currentTarget.value as Level)}>
                <For each={levelChoices()}>{(item) => <option value={item} selected={item === level()}>{t(`mgmt.channel.level.${item}`)}</option>}</For>
              </select>
            </label>
            <Button variant="primary" class="mg-rule-add" disabled={subjectType() !== "everyone" && !subjectId()} onClick={add}>
              <Icon name="add_circle" />{t("mgmt.channel.add")}
            </Button>
          </div>
          <Show when={visibility() === "public"}><p class="mg-note"><Icon name="info" />{t("mgmt.channel.publicNote")}</p></Show>
        </section>

        <section class="mg-card compact">
          <h3 class="mg-card-title">
            <Icon name="verified_user" />{t("mgmt.channel.rulesTitle")}
            <span class="mg-pill">{t("mgmt.channel.rulesCount", { count: rules().length })}</span>
            <small>{t("mgmt.channel.priority")}</small>
          </h3>
          <ul class="mg-rule-list" aria-label={t("mgmt.channel.rulesTitle")}>
            <For each={rules()} fallback={<li class="mg-empty">{loaded.loading ? t("mgmt.loading") : t("mgmt.channel.noRules")}</li>}>
              {(rule) => (
                <li classList={{ deny: rule.effect === "deny" }}>
                  <span class="mg-rule-icon"><Icon name={SUBJECT_ICON[rule.subject_type]} /></span>
                  <div>
                    <strong>{t(`mgmt.channel.${SUBJECT_KEY[rule.subject_type]}`)} {nameOf(rule)}</strong>
                    <small>{t("mgmt.channel.ruleLevel", { level: t(`mgmt.channel.level.${rule.level}`) })} · {t("mgmt.channel.rulePriority", { layer: LAYER[rule.subject_type] })}</small>
                  </div>
                  <Badge tone={rule.effect === "allow" ? "secure" : "danger"} mono icon={rule.effect === "allow" ? "check_circle" : "block"}>
                    {rule.effect === "allow" ? t("mgmt.channel.allow") : t("mgmt.channel.deny")}
                  </Badge>
                  <button type="button" class="mg-icon-button" title={t("mgmt.channel.remove", { name: nameOf(rule) })} aria-label={t("mgmt.channel.remove", { name: nameOf(rule) })} onClick={() => setRules((all) => all.filter((r) => r !== rule))}>
                    <Icon name="delete" />
                  </button>
                </li>
              )}
            </For>
          </ul>
        </section>
        <Show when={error()}><p class="mg-error" role="alert">{error()}</p></Show>
      </div>

      <footer class="mg-panel-foot">
        <button type="button" class="mg-danger-link" onClick={props.onDelete}><Icon name="delete_forever" />{t("mgmt.channel.deleteChannel")}</button>
        <p class="mg-note"><Icon name="sync" />{t("mgmt.channel.footerNote")}</p>
        <Button variant="icon" class="mg-cancel" onClick={props.onCancel}>{t("mgmt.cancel")}</Button>
        <Button variant="primary" disabled={saving()} onClick={() => void save()}><Icon name="verified" />{saving() ? t("mgmt.channel.saving") : t("mgmt.channel.save")}</Button>
      </footer>
    </>
  );
}
