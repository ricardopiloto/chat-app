# Research: 050-invite-permission-ui

## R1 — Predicado FE de convite

**Decision**: Adicionar `canCreateInvites` em `Sidebar.tsx`:

```text
isOwner()
  || roles().some(r => r.capabilities?.can_create_invites && r.member_ids.includes(me.id))
```

Mesmo padrão que `canCreateChannels` (OR de papéis + bypass dono).

**Rationale**: Backend já usa `aggregated_caps` + owner bypass em `invites.rs`; a UI estava só em `isOwner()`, logo membros autorizados não viam o botão.

**Alternatives considered**:

- Endpoint «my capabilities» dedicado — desnecessário (roles list já carregada).
- Mostrar botão a todos e falhar no 403 — rejeitado (FR-002 / SC-002).

## R2 — Separar chrome: papéis vs convite

**Decision**: Substituir o único `<Show when={selected() && isOwner()}>` que envolve **Gerir papéis** + **Convite** por dois controlos independentes:

| Controlo | Visível quando |
|----------|----------------|
| Gerir papéis | `isOwner()` (FR-005; sem expandir a `can_manage_roles` nesta feature) |
| Convite | `canCreateInvites()` |

**Rationale**: Spec exige que «Criar convites» não exponha gestão de papéis.

**Alternatives considered**: Abrir RolesPanel também a `can_manage_roles` — fora de âmbito (Out of Scope).

## R3 — Backend

**Decision**: **Verify-only** — `create_invite` / `list_invites` / `revoke` já exigem owner ou `caps.can_create_invites`. Sem alteração de API salvo se um teste de contrato falhar e revelar gap.

**Rationale**: Spec Assumptions; evita scope creep.

## R4 — Refresh após mudança de papel (US3)

**Decision**: Reutilizar o `createResource` de `roles` já existente; quando RolesPanel / patch de papéis chama `refetchRoles` (ou equivalente já usado para canais), o predicado reavalia. Sem WebSocket novo nesta feature.

**Rationale**: Alinhado a FR-006 e ao comportamento de «criar canais».

## R5 — Fluxo createInvite

**Decision**: Manter `createInvite(false)` e o diálogo URL intactos; apenas a condição de montagem do botão muda.

**Rationale**: Out of Scope — sem redesign 046/019.
