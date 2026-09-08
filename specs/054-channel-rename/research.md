# Research: 054-channel-rename

## R1 — Autorização

**Decision**: Permitir rename se **qualquer** de: `server.owner_account_id == caller`, `channel.created_by_account_id == caller`, ou `aggregated_caps.can_manage_channels`. Espelhar a lógica já usada em `patch_channel` para visibilidade (owner/creator via `can_manage_channel_acl` **ou** `can_manage_channels`), mas **incluir explicitamente criador** mesmo quando a função ACL actual já o cobre — e garantir criador + manage-channels + owner na UI.

Nota: `permissions::can_manage_channel_acl(owner, creator)` já cobre dono e criador; `can_manage_channels` cobre o papel. Reutilizar esse padrão no rename.

**Rationale**: Clarificação Q1 + FR-002–004.

**Alternatives considered**: ACL por canal — rejeitado; só dono+criador — rejeitado.

## R2 — API shape

**Decision**: Estender `PatchChannelBody` com `name: Option<String>`. Se `name` presente: trim; empty → 400; `db::channel::update_name`. Pode combinar com visibility no mesmo PATCH, mas a UI de rename envia só `name`.

**Rationale**: Um recurso, um PATCH; evita rota nova.

**Alternatives considered**: `PUT /channels/{id}/name` — desnecessário.

## R3 — Unicidade

**Decision**: Não verificar unicidade (clarificação Q3).

**Rationale**: Paridade com criação.

## R4 — UI inline

**Decision**: No label do canal na Sidebar: `ondblclick` inicia edição; em tactil, detectar segundo `touchend` dentro de ~300ms no mesmo alvo (duplo-toque) sem navegar no segundo toque. Input inline; Enter confirma; Escape cancela; blur confirma se válido ou restaura se inválido/vazio.

**Rationale**: Clarificações Q2/Q4.

**Alternatives considered**: Menu «Renomear» — não obrigatório; inline-only.

## R5 — Refresh

**Decision**: Após PATCH OK, actualizar o canal na resource `channels` da Sidebar (`refetchChannels` ou patch local do nome) e, se for o canal activo, o título/contexto reflecte o novo nome via mesma lista / active channel prefs se aplicável.

**Rationale**: FR-008.
