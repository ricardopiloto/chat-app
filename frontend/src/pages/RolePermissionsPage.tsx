import { For, Show, createEffect, createSignal } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import {
  OPEN_ROLE_CAPABILITIES,
  fetchServerRoles,
  patchServerRole,
  type RoleCapabilities,
  type ServerRole,
} from "../api/client";
import { systemRoleLabel, t } from "../i18n";
import { errorMessage } from "../lib/apiError";

type CapKey = keyof RoleCapabilities;

type CapDef = {
  key: CapKey;
  titleKey: string;
  descKey: string;
  sectionKey: string;
};

const CAP_DEFS: CapDef[] = [
  {
    key: "can_view_channels",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.viewChannelsTitle",
    descKey: "roles.caps.viewChannelsDesc",
  },
  {
    key: "can_manage_channels",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.manageChannelsTitle",
    descKey: "roles.caps.manageChannelsDesc",
  },
  {
    key: "can_manage_roles",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.manageRolesTitle",
    descKey: "roles.caps.manageRolesDesc",
  },
  {
    key: "can_create_invites",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.createInvitesTitle",
    descKey: "roles.caps.createInvitesDesc",
  },
  {
    key: "can_remove_members",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.removeMembersTitle",
    descKey: "roles.caps.removeMembersDesc",
  },
  {
    key: "can_mute_members",
    sectionKey: "roles.caps.sectionGeneral",
    titleKey: "roles.caps.muteMembersTitle",
    descKey: "roles.caps.muteMembersDesc",
  },
  {
    key: "can_send_messages",
    sectionKey: "roles.caps.sectionText",
    titleKey: "roles.caps.sendMessagesTitle",
    descKey: "roles.caps.sendMessagesDesc",
  },
  {
    key: "can_delete_messages",
    sectionKey: "roles.caps.sectionText",
    titleKey: "roles.caps.deleteMessagesTitle",
    descKey: "roles.caps.deleteMessagesDesc",
  },
  {
    key: "can_attach_files",
    sectionKey: "roles.caps.sectionText",
    titleKey: "roles.caps.attachFilesTitle",
    descKey: "roles.caps.attachFilesDesc",
  },
  {
    key: "can_connect_voice",
    sectionKey: "roles.caps.sectionVoice",
    titleKey: "roles.caps.connectVoiceTitle",
    descKey: "roles.caps.connectVoiceDesc",
  },
  {
    key: "can_speak_voice",
    sectionKey: "roles.caps.sectionVoice",
    titleKey: "roles.caps.speakVoiceTitle",
    descKey: "roles.caps.speakVoiceDesc",
  },
];

const SECTION_KEYS = [
  "roles.caps.sectionGeneral",
  "roles.caps.sectionText",
  "roles.caps.sectionVoice",
] as const;

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
          setError(t("roles.notFound"));
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

  const roleTitle = () => {
    const r = role();
    return r ? systemRoleLabel(r) : "…";
  };

  return (
    <div class="role-permissions-page main" role="main">
      <header class="role-permissions-header">
        <div>
          <p class="muted">{t("roles.permissionsOf")}</p>
          <h1>{roleTitle()}</h1>
          <Show when={role()?.is_system}>
            <p class="muted">{t("roles.systemReadonly")}</p>
          </Show>
        </div>
        <div class="role-permissions-actions">
          <button type="button" class="btn btn-secondary" onClick={cancel}>
            {role()?.is_system ? t("common.close") : t("common.cancel")}
          </button>
          <Show when={!role()?.is_system}>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!dirty() || saving() || !role()}
              onClick={() => void save()}
            >
              {t("common.save")}
            </button>
          </Show>
        </div>
      </header>

      <For each={[...SECTION_KEYS]}>
        {(sectionKey) => (
          <section class="role-permissions-section">
            <h2>{t(sectionKey)}</h2>
            <For each={CAP_DEFS.filter((d) => d.sectionKey === sectionKey)}>
              {(def) => (
                <div class="role-permission-row">
                  <div class="role-permission-copy">
                    <strong>{t(def.titleKey)}</strong>
                    <p class="muted">{t(def.descKey)}</p>
                  </div>
                  <label class="role-permission-toggle">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={draft()[def.key]}
                      disabled={!!role()?.is_system}
                      onChange={(e) => setCap(def.key, e.currentTarget.checked)}
                      aria-label={t(def.titleKey)}
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
