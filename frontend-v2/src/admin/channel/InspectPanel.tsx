import { For, Show, createResource, createSignal } from "solid-js";
import { useShell } from "../../shell/state";
import { errorText } from "../../lib/errors";
import { publicDisplayLabel } from "../../lib/displayName";
import { t } from "../../i18n";
import { Avatar, Badge, Button, Icon } from "../../components/ui";
import { acl, avatarUrl, type AccessFactor, type Channel } from "../../api";

// The backend names each step of the resolution by layer. The panel groups them by precedence:
// a direct member override beats roles, which beat @everyone, with the channel base underneath.
const GROUPS = [
  { layers: ["member"], key: "member_", note: "memberNote", rank: "P1", icon: "person" },
  { layers: ["role"], key: "role_", note: "roleNote", rank: "P2", icon: "badge" },
  { layers: ["everyone"], key: "everyone_", note: "everyoneNote", rank: "P3", icon: "groups" },
] as const;

type Verdict = "allowed" | "denied" | "ignored";

/** An overwrite arrives as "<effect> <level>" (for example "deny write"); other lines are prose. */
function parseOverwrite(detail: string): { effect: "allow" | "deny"; level: "read" | "write" } | null {
  const found = /^(allow|deny) (read|write)$/.exec(detail.trim());
  return found ? { effect: found[1] as "allow" | "deny", level: found[2] as "read" | "write" } : null;
}

function FactorLine(props: { factor: AccessFactor; icon: string; superseded: boolean }) {
  const rule = () => parseOverwrite(props.factor.detail);
  const verdict = (): Verdict => (props.superseded ? "ignored" : rule()?.effect === "deny" ? "denied" : "allowed");
  return (
    <li classList={{ ignored: rule() !== null && props.superseded, denied: rule() !== null && verdict() === "denied" }}>
      <Icon name={props.icon} />
      <Show when={rule()} fallback={<span>{props.factor.detail}</span>}>
        {(found) => (
          <>
            <span>{t(`mgmt.channel.level.${found().level}`)}</span>
            <Badge tone={verdict() === "allowed" ? "secure" : verdict() === "denied" ? "danger" : "neutral"} mono>
              {t(`mgmt.channel.inspect.${verdict()}`)}
            </Badge>
          </>
        )}
      </Show>
    </li>
  );
}

export function InspectPanel(props: { channel: Channel; onEdit: () => void; onClose: () => void }) {
  const shell = useShell();
  const people = () => shell.members.data ?? [];
  const [accountId, setAccountId] = createSignal(shell.meId());
  const person = () => people().find((m) => m.account_id === accountId());

  const [report] = createResource(
    () => (accountId() ? { channel: props.channel.id, account: accountId() } : undefined),
    async (key) => {
      try {
        return { report: await acl.inspect(key.channel, key.account) };
      } catch (failure) {
        return { error: errorText(failure, "mgmt.error") };
      }
    },
  );
  const result = () => report()?.report;

  const inGroup = (layers: readonly string[]): AccessFactor[] => (result()?.factors ?? []).filter((f) => layers.includes(f.layer));
  // A rule in a higher layer settles the question, so rules below it are shown as ignored.
  const decidedAbove = (rank: number) => GROUPS.slice(0, rank).some((g) => inGroup(g.layers).some((f) => parseOverwrite(f.detail)));
  const base = (): AccessFactor[] => (result()?.factors ?? []).filter((f) => !GROUPS.some((g) => (g.layers as readonly string[]).includes(f.layer)));

  return (
    <>
      <div class="mg-panel-body">
        <div class="mg-inspect-top">
          <section class="mg-card compact">
            <span class="mg-label">{t("mgmt.channel.inspect.member")}</span>
            <Show when={person()}>
              {(member) => (
                <div class="mg-inspect-person">
                  <Avatar name={publicDisplayLabel(member().handle, member().display_name)} src={member().has_avatar ? avatarUrl(member().account_id) : undefined} size="lg" />
                  <div>
                    <strong>{publicDisplayLabel(member().handle, member().display_name)}</strong>
                    <small>@{member().handle}</small>
                  </div>
                </div>
              )}
            </Show>
            <select aria-label={t("mgmt.channel.inspect.pick")} value={accountId()} onChange={(event) => setAccountId(event.currentTarget.value)}>
              <For each={people()}>{(m) => <option value={m.account_id} selected={m.account_id === accountId()}>{publicDisplayLabel(m.handle, m.display_name)} (@{m.handle})</option>}</For>
            </select>
          </section>

          <section class="mg-card compact mg-verdict" aria-live="polite">
            <span class="mg-label">{t("mgmt.channel.inspect.verdict")}</span>
            <Show when={result()} fallback={<p class="mg-muted">{report()?.error ?? t("mgmt.channel.inspect.loading")}</p>}>
              {(data) => (
                <>
                  <div class="mg-verdict-line">
                    <Badge tone={data().view ? "secure" : "danger"} mono icon={data().view ? "visibility" : "visibility_off"}>
                      {t("mgmt.channel.inspect.canView")}: {data().view ? t("mgmt.channel.inspect.yes") : t("mgmt.channel.inspect.no")}
                    </Badge>
                    <Badge tone="primary" mono icon="tune">
                      {t("mgmt.channel.inspect.effective")}: {data().level ? t(`mgmt.channel.level.${data().level}`) : t("mgmt.channel.inspect.none")}
                    </Badge>
                  </div>
                </>
              )}
            </Show>
          </section>
        </div>

        <section class="mg-card compact">
          <h3 class="mg-card-title"><Icon name="account_tree" />{t("mgmt.channel.inspect.matrix")}<small>{t("mgmt.channel.inspect.order")}</small></h3>
          <For each={GROUPS}>
            {(group) => (
              <div class="mg-layer" data-layer={group.layers[0]}>
                <header>
                  <b class="mg-rank">{group.rank}</b>
                  <strong>{t(`mgmt.channel.inspect.${group.key}`)}</strong>
                  <small>{t(`mgmt.channel.inspect.${group.note}`)}</small>
                </header>
                <ul>
                  <For each={inGroup(group.layers)} fallback={<li class="mg-empty"><Icon name={group.icon} />{t("mgmt.channel.inspect.empty")}</li>}>
                    {(factor) => <FactorLine factor={factor} icon={group.icon} superseded={decidedAbove(GROUPS.indexOf(group))} />}
                  </For>
                </ul>
              </div>
            )}
          </For>
          <div class="mg-layer" data-layer="base">
            <header>
              <b class="mg-rank">P4</b>
              <strong>{t("mgmt.channel.inspect.base_")}</strong>
              <small>{t("mgmt.channel.inspect.baseNote")}</small>
            </header>
            <ul>
              <For each={base()} fallback={<li class="mg-empty"><Icon name="visibility" />{t("mgmt.channel.inspect.empty")}</li>}>
                {(factor) => <li><Icon name="visibility" /><span>{factor.detail}</span></li>}
              </For>
            </ul>
          </div>
        </section>
      </div>

      <footer class="mg-panel-foot">
        <p class="mg-note"><Icon name="info" />{t("mgmt.channel.inspect.rule")}</p>
        <Button variant="icon" class="mg-cancel" onClick={props.onClose}><Icon name="close" />{t("mgmt.channel.inspect.close")}</Button>
        <Button variant="primary" onClick={props.onEdit}><Icon name="tune" />{t("mgmt.channel.inspect.edit")}</Button>
      </footer>
    </>
  );
}
