import { For, Show, createEffect, createSignal } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import {
  OPEN_ROLE_CAPABILITIES,
  fetchServerRoles,
  patchServerRole,
  type RoleCapabilities,
  type ServerRole,
} from "../api/client";
import { errorMessage } from "../lib/apiError";

type CapKey = keyof RoleCapabilities;

type CapDef = {
  key: CapKey;
  title: string;
  description: string;
  section: "Geral" | "Texto" | "Voz / vídeo";
};

const CAP_DEFS: CapDef[] = [
  {
    key: "can_view_channels",
    section: "Geral",
    title: "Visualizar canal",
    description:
      "Permite ver canais. Em canais públicos todos os membros continuam a ver o canal; use privado + ACL para ocultar.",
  },
  {
    key: "can_manage_channels",
    section: "Geral",
    title: "Gerenciar canal",
    description: "Permite criar, editar ou apagar canais neste servidor.",
  },
  {
    key: "can_manage_roles",
    section: "Geral",
    title: "Gerenciar papéis / cargos",
    description: "Permite criar, editar e apagar papéis e atribuir membros a papéis.",
  },
  {
    key: "can_create_invites",
    section: "Geral",
    title: "Criar convites",
    description: "Permite gerar e gerir códigos de convite para este servidor.",
  },
  {
    key: "can_remove_members",
    section: "Geral",
    title: "Remover membros",
    description: "Permite remover (expulsar) outros membros do servidor.",
  },
  {
    key: "can_mute_members",
    section: "Geral",
    title: "Silenciar membros",
    description:
      "Permite silenciar (timeout) membros num canal de texto por um período definido.",
  },
  {
    key: "can_send_messages",
    section: "Texto",
    title: "Enviar mensagens",
    description: "Permite enviar mensagens em canais de texto (sujeito também à ACL do canal).",
  },
  {
    key: "can_delete_messages",
    section: "Texto",
    title: "Apagar mensagens",
    description: "Permite apagar mensagens de outros autores (o autor pode sempre apagar as próprias).",
  },
  {
    key: "can_attach_files",
    section: "Texto",
    title: "Anexar ficheiros",
    description: "Permite carregar anexos / imagens nas mensagens de texto.",
  },
  {
    key: "can_connect_voice",
    section: "Voz / vídeo",
    title: "Entrar / ouvir",
    description: "Permite entrar em canais de voz/vídeo e ouvir a chamada.",
  },
  {
    key: "can_speak_voice",
    section: "Voz / vídeo",
    title: "Falar",
    description: "Permite transmitir microfone e câmara na chamada.",
  },
];

const SECTIONS = ["Geral", "Texto", "Voz / vídeo"] as const;

export default function RolePermissionsPage() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = createSignal<ServerRole | null>(null);
  const [draft, setDraft] = createSignal<RoleCapabilities>({ ...OPEN_ROLE_CAPABILITIES });
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);

  const returnTo = () => {
    const raw = search.returnTo;
    if (typeof raw === "string" && raw.startsWith("/")) return raw;
    return `/servers/${params.serverId}/settings/roles`;
  };

  createEffect(() => {
    const serverId = params.serverId;
    const roleId = params.roleId;
    if (!serverId || !roleId) return;
    setError("");
    void fetchServerRoles(serverId)
      .then((roles) => {
        const found = roles.find((r) => r.id === roleId) ?? null;
        setRole(found);
        if (found) {
          setDraft({ ...OPEN_ROLE_CAPABILITIES, ...found.capabilities });
          setDirty(false);
        } else {
          setError("Papel não encontrado.");
        }
      })
      .catch((err) => setError(errorMessage(err)));
  });

  function setCap(key: CapKey, value: boolean) {
    if (role()?.is_system) return;
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    const current = role();
    if (!current || saving() || current.is_system) return;
    setSaving(true);
    setError("");
    try {
      const caps = draft();
      await patchServerRole(params.serverId!, current.id, {
        capabilities: caps,
        can_create_channels: caps.can_manage_channels,
      });
      setDirty(false);
      window.dispatchEvent(
        new CustomEvent("mesa:roles-changed", { detail: { serverId: params.serverId } }),
      );
      navigate(returnTo());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    navigate(returnTo());
  }

  return (
    <div class="role-permissions-page main" role="main">
      <header class="role-permissions-header">
        <div>
          <p class="muted">Permissões do papel</p>
          <h1>{role()?.name ?? "…"}</h1>
          <Show when={role()?.is_system}>
            <p class="muted">Perfil de sistema — permissões apenas para consulta.</p>
          </Show>
        </div>
        <div class="role-permissions-actions">
          <button type="button" class="btn btn-secondary" onClick={cancel}>
            {role()?.is_system ? "Fechar" : "Cancelar"}
          </button>
          <Show when={!role()?.is_system}>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!dirty() || saving() || !role()}
              onClick={() => void save()}
            >
              Guardar
            </button>
          </Show>
        </div>
      </header>

      <For each={[...SECTIONS]}>
        {(section) => (
          <section class="role-permissions-section">
            <h2>{section}</h2>
            <For each={CAP_DEFS.filter((d) => d.section === section)}>
              {(def) => (
                <div class="role-permission-row">
                  <div class="role-permission-copy">
                    <strong>{def.title}</strong>
                    <p class="muted">{def.description}</p>
                  </div>
                  <label class="role-permission-toggle">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={draft()[def.key]}
                      disabled={!!role()?.is_system}
                      onChange={(e) => setCap(def.key, e.currentTarget.checked)}
                      aria-label={def.title}
                    />
                    <span class="role-permission-switch" aria-hidden="true" />
                  </label>
                </div>
              )}
            </For>
          </section>
        )}
      </For>

      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}
