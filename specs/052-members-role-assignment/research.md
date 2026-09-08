# Research: 052-members-role-assignment

## R1 — Papel único: armazenamento

**Decision**: Manter `server_role_member` e **impor no máximo uma linha por (servidor, conta)** via coluna `server_id` denormalizada (ou join-checked) + `UNIQUE(server_id, account_id)`, após migração FR-011. API preferida: `PUT/PATCH /api/servers/{serverId}/members/{accountId}/role` com `{ "role_id": "<uuid>" | null }`. O endpoint legado `PUT .../roles/{roleId}/members` passa a rejeitar conjuntos que violem unicidade (ou a ser usado só internamente e deprecado na UI).

**Rationale**: Menos churn que mover tudo para `membership.role_id` de imediato; UI membro-cêntrica encaixa no PATCH; listagens de `member_ids` por papel continuam a funcionar (0..n membros, cada um noutro papel).

**Alternatives considered**:

- `membership.role_id` FK — mais limpo a longo prazo; mais ficheiros a tocar nesta feature.
- Continuar multi-select e só esconder na UI — viola FR-010 / SC-006.

## R2 — Migração FR-011 (capacidades)

**Decision**: Para cada `(server_id, account_id)` com N>1 papéis: pontuar cada papel pelo **número de flags `true` em `RoleCapabilities`** (todas as booleans do struct actual); escolher o maior; empate → papel que aparece **primeiro** em `list_by_server` (ordem actual de listagem); apagar as outras linhas em `server_role_member`.

**Rationale**: Coincide com a clarificação C; determinístico e testável em contrato.

**Alternatives considered**: Manter primeiro papel só; zerar todos — rejeitados na clarify.

## R3 — Capacidades efectivas

**Decision**: `aggregated_caps` torna-se o papel único do membro (ou defaults «sem papel» / só member baseline) **mais** `owner_all` se for dono. Remover OR entre vários papéis do mesmo account/server.

**Rationale**: FR-006 / papel único.

**Alternatives considered**: Manter OR «por compatibilidade» — contradiz clarify.

## R4 — Presença online

**Decision**: Conta **online** se `WsHub` tem ≥1 sender activo para esse `account_id`. Expor `GET /api/servers/{id}/presence` → lista de `account_id` online **∩** membros do servidor. No connect/disconnect do WS, emitir evento `presence` (ou `presence.changed`) aos membros dos servidores partilhados (ou refresh no open do painel + poll curto / re-fetch on focus se broadcast for caro v1).

**Rationale**: Hub já indexa por conta; clarificação B pede sessão activa, não voz.

**Alternatives considered**:

- Só voz (`voice_occupant`) — rejeitado.
- Presença só por cookie de sessão HTTP sem WS — não reflecte «ligado à app» em tempo real.

## R5 — Roster UI

**Decision**: `MembersPanel`: secção **Online** depois **Offline**; dentro de cada, headings por nome de papel (+ «Sem papel»). Kick permanece para quem já podia (dono / `can_remove_members`) no painel e/ou página de gestão.

**Rationale**: Clarify Q2 = B.

## R6 — Menu servidor

**Decision**: Controlo no título do servidor na Sidebar abre menu com **Membros** (rota gestão) e **Perfis** (abre `RolesPanel` sem checkboxes). Convite: header actual. Engrenagem «Gerir papéis»: pode remover-se se **Perfis** a substituir (preferido) para evitar duplicar.

**Rationale**: Clarify Q5 custom.

## R7 — RolesPanel

**Decision**: Remover lista de membros/checkboxes e calls a `setServerRoleMembers` do diálogo. Manter criar, permissões, apagar.

**Rationale**: US1 / FR-001.
