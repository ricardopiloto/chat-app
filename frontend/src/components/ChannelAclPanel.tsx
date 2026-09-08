import { For, Show, createEffect, createSignal } from "solid-js";
import {
  api,
  fetchChannelAccess,
  fetchChannelAcl,
  fetchServerRoles,
  patchChannel,
  putChannelAcl,
  type Channel,
  type ChannelAccessExplain,
  type ChannelAclEntry,
  type ServerMember,
  type ServerRole,
} from "../api/client";
import { errorMessage } from "../lib/apiError";
import { runPanelAction } from "../lib/panelState";
import Dialog from "./Dialog";

type Props = {
  open: boolean;
  channel: Channel | null;
  onClose: () => void;
  onSaved: (channel: Channel) => void;
};

const EVERYONE_SUBJECT_ID = "00000000-0000-0000-0000-000000000000";

const LEVEL_LABELS: Record<ChannelAclEntry["level"], string> = {
  read: "Ler",
  write: "Escrever",
  listen: "Ouvir",
  speak: "Falar",
};

const EFFECT_LABELS: Record<NonNullable<ChannelAclEntry["effect"]>, string> = {
  allow: "Permitir",
  deny: "Negar",
};

type SubjectType = ChannelAclEntry["subject_type"];

export default function ChannelAclPanel(props: Props) {
  const [entries, setEntries] = createSignal<ChannelAclEntry[]>([]);
  const [members, setMembers] = createSignal<ServerMember[]>([]);
  const [roles, setRoles] = createSignal<ServerRole[]>([]);
  const [visibility, setVisibility] = createSignal<"public" | "private">("public");
  const [visibleToNew, setVisibleToNew] = createSignal(true);
  const [subjectType, setSubjectType] = createSignal<SubjectType>("account");
  const [subjectId, setSubjectId] = createSignal("");
  const [level, setLevel] = createSignal<ChannelAclEntry["level"]>("write");
  const [effect, setEffect] = createSignal<NonNullable<ChannelAclEntry["effect"]>>("allow");
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [inspectAccountId, setInspectAccountId] = createSignal("");
  const [inspectResult, setInspectResult] = createSignal<ChannelAccessExplain | null>(null);
  const [inspectError, setInspectError] = createSignal("");
  const [inspectBusy, setInspectBusy] = createSignal(false);

  const subjects = () => {
    if (subjectType() === "everyone") return [];
    return subjectType() === "account" ? members() : roles();
  };

  const allLevels = () =>
    props.channel?.type === "text"
      ? (["read", "write"] as const)
      : (["listen", "speak"] as const);

  const viewDenyBlocked = () =>
    visibility() === "public" && effect() === "deny";

  const availableLevels = () => {
    const levels = allLevels();
    if (!viewDenyBlocked()) return levels;
    return levels.filter((item) => item === "write" || item === "speak");
  };

  createEffect(() => {
    const channel = props.channel;
    if (!props.open || !channel) return;
    setVisibility(channel.visibility);
    setVisibleToNew(channel.visible_to_new_members);
    setLevel(channel.type === "text" ? "write" : "speak");
    setEffect("allow");
    setError("");
    setInspectResult(null);
    setInspectError("");
    void Promise.all([
      fetchChannelAcl(channel.id),
      api<ServerMember[]>(`/api/servers/${channel.server_id}/members`),
      fetchServerRoles(channel.server_id),
    ])
      .then(([nextEntries, nextMembers, nextRoles]) => {
        setEntries(nextEntries);
        setMembers(nextMembers);
        setRoles(nextRoles);
        setSubjectId(nextMembers[0]?.account_id ?? "");
        setInspectAccountId(nextMembers[0]?.account_id ?? "");
      })
      .catch((err) => setError(errorMessage(err)));
  });

  createEffect(() => {
    if (subjectType() === "everyone") {
      setSubjectId(EVERYONE_SUBJECT_ID);
      return;
    }
    const first = subjects()[0];
    setSubjectId(first ? ("account_id" in first ? first.account_id : first.id) : "");
  });

  createEffect(() => {
    if (!viewDenyBlocked()) return;
    const blocked = level() === "read" || level() === "listen";
    if (blocked) {
      setLevel(props.channel?.type === "text" ? "write" : "speak");
    }
  });

  function addGrant() {
    if (subjectType() !== "everyone" && !subjectId()) return;
    const entry: ChannelAclEntry = {
      subject_type: subjectType(),
      subject_id: subjectType() === "everyone" ? EVERYONE_SUBJECT_ID : subjectId(),
      level: level(),
      effect: effect(),
    };
    setEntries((prev) => [
      ...prev.filter(
        (item) =>
          !(
            item.subject_type === entry.subject_type &&
            item.subject_id === entry.subject_id &&
            item.level === entry.level &&
            (item.effect ?? "allow") === (entry.effect ?? "allow")
          ),
      ),
      entry,
    ]);
  }

  function subjectLabel(entry: ChannelAclEntry): string {
    if (entry.subject_type === "everyone") return "Todos os membros";
    if (entry.subject_type === "account") {
      return members().find((m) => m.account_id === entry.subject_id)?.handle ?? entry.subject_id;
    }
    return roles().find((r) => r.id === entry.subject_id)?.name ?? entry.subject_id;
  }

  function subjectTypeLabel(entry: ChannelAclEntry): string {
    if (entry.subject_type === "everyone") return "Todos";
    if (entry.subject_type === "role") return "Papel";
    return "Membro";
  }

  async function inspectAccess() {
    const channel = props.channel;
    const accountId = inspectAccountId();
    if (!channel || !accountId || inspectBusy()) return;
    setInspectBusy(true);
    setInspectError("");
    setInspectResult(null);
    try {
      setInspectResult(await fetchChannelAccess(channel.id, accountId));
    } catch (err) {
      setInspectError(errorMessage(err));
    } finally {
      setInspectBusy(false);
    }
  }

  async function save() {
    const channel = props.channel;
    if (!channel || saving()) return;
    await runPanelAction(setError, setSaving, async () => {
      const updated = await patchChannel(channel.id, {
        visibility: visibility(),
        visible_to_new_members: visibility() === "public" && visibleToNew(),
      });
      await putChannelAcl(channel.id, entries());
      props.onSaved(updated);
      props.onClose();
    });
  }

  return (
    <Dialog
      open={props.open}
      title={`Permissões — ${props.channel?.name ?? ""}`}
      onClose={props.onClose}
      actions={
        <>
          <button type="button" class="btn btn-secondary" onClick={props.onClose}>
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" disabled={saving()} onClick={() => void save()}>
            Guardar
          </button>
        </>
      }
    >
      <div class="field">
        <label>Visibilidade</label>
        <div class="row" style={{ gap: "16px" }}>
          <label class="check-line">
            <input
              type="radio"
              name="channel-settings-visibility"
              checked={visibility() === "public"}
              onChange={() => setVisibility("public")}
            />
            Público
          </label>
          <label class="check-line">
            <input
              type="radio"
              name="channel-settings-visibility"
              checked={visibility() === "private"}
              onChange={() => setVisibility("private")}
            />
            Privado
          </label>
        </div>
      </div>
      <Show when={visibility() === "public"}>
        <label class="check-line">
          <input
            type="checkbox"
            checked={visibleToNew()}
            onChange={(e) => setVisibleToNew(e.currentTarget.checked)}
          />
          Visível a novos membros
        </label>
      </Show>

      <div class="permission-grant-row">
        <select
          class="input"
          value={subjectType()}
          onChange={(e) => setSubjectType(e.currentTarget.value as SubjectType)}
          aria-label="Tipo do destinatário"
        >
          <option value="account">Membro</option>
          <option value="role">Papel</option>
          <option value="everyone">Todos os membros</option>
        </select>
        <Show when={subjectType() !== "everyone"}>
          <select
            class="input"
            value={subjectId()}
            onChange={(e) => setSubjectId(e.currentTarget.value)}
            aria-label="Destinatário"
          >
            <For each={subjects()}>
              {(subject) => (
                <option value={"account_id" in subject ? subject.account_id : subject.id}>
                  {"handle" in subject ? subject.handle : subject.name}
                </option>
              )}
            </For>
          </select>
        </Show>
        <select
          class="input"
          value={effect()}
          onChange={(e) =>
            setEffect(e.currentTarget.value as NonNullable<ChannelAclEntry["effect"]>)
          }
          aria-label="Efeito"
        >
          <option value="allow">{EFFECT_LABELS.allow}</option>
          <option value="deny">{EFFECT_LABELS.deny}</option>
        </select>
        <select
          class="input"
          value={level()}
          onChange={(e) => setLevel(e.currentTarget.value as ChannelAclEntry["level"])}
          aria-label="Nível"
        >
          <For each={availableLevels()}>
            {(item) => <option value={item}>{LEVEL_LABELS[item]}</option>}
          </For>
        </select>
        <button
          type="button"
          class="btn btn-secondary"
          disabled={subjectType() !== "everyone" && !subjectId()}
          onClick={addGrant}
        >
          Adicionar
        </button>
      </div>
      <Show when={visibility() === "public"}>
        <p class="muted" style={{ "margin-top": "8px" }}>
          Em canais públicos não é possível negar ver/ouvir (ocultar o canal).
        </p>
      </Show>

      <div class="permission-list">
        <For each={entries()} fallback={<p class="muted">Sem concessões explícitas.</p>}>
          {(entry) => (
            <div class="permission-entry">
              <span>
                {subjectTypeLabel(entry)}: {subjectLabel(entry)}
              </span>
              <span>
                {EFFECT_LABELS[entry.effect ?? "allow"]} — {LEVEL_LABELS[entry.level]}
              </span>
              <button
                type="button"
                class="btn btn-ghost"
                aria-label={`Remover ${subjectLabel(entry)}`}
                onClick={() => setEntries((prev) => prev.filter((item) => item !== entry))}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>

      <section class="field" style={{ "margin-top": "24px" }}>
        <h3 class="members-role-title">Inspecionar acesso</h3>
        <p class="muted">Ver como um membro resolve permissões neste canal.</p>
        <div class="permission-grant-row">
          <select
            class="input"
            value={inspectAccountId()}
            onChange={(e) => setInspectAccountId(e.currentTarget.value)}
            aria-label="Membro a inspecionar"
          >
            <For each={members()}>
              {(member) => <option value={member.account_id}>{member.handle}</option>}
            </For>
          </select>
          <button
            type="button"
            class="btn btn-secondary"
            disabled={!inspectAccountId() || inspectBusy()}
            onClick={() => void inspectAccess()}
          >
            Inspecionar
          </button>
        </div>
        <Show when={inspectResult()}>
          {(result) => (
            <div class="permission-inspect-result">
              <p>
                <strong>Ver canal:</strong> {result().view ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Nível efectivo:</strong>{" "}
                {result().level != null ? LEVEL_LABELS[result().level!] : "—"}
              </p>
              <ul class="permission-inspect-factors">
                <For each={result().factors}>
                  {(factor) => (
                    <li>
                      <span class="muted">{factor.layer}:</span> {factor.detail}
                    </li>
                  )}
                </For>
              </ul>
            </div>
          )}
        </Show>
        <Show when={inspectError()}>
          <p class="error" role="alert">
            {inspectError()}
          </p>
        </Show>
      </section>

      <Show when={error()}>
        <p class="error" role="alert">{error()}</p>
      </Show>
    </Dialog>
  );
}
