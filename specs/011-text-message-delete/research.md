# Research: 011-text-message-delete

## 1. Hard delete vs soft-delete

**Decision**: **Hard DELETE** da linha `message` (e anexos via FK CASCADE). Sem coluna `deleted_at`, sem placeholder na UI.

**Rationale**: Clarificação 2026-09-04 — remoção completa da vista; produto E2EE favorece desaparecimento do ciphertext.

**Alternatives considered**: Soft-delete + «Mensagem eliminada» (rejeitado); soft-delete invisível só no servidor (complexidade sem benefício de produto).

## 2. Endpoint shape

**Decision**: `DELETE /api/channels/{channel_id}/messages/{message_id}` autenticado; **204** sem body em sucesso; **403** sem permissão; **404** se mensagem inexistente / canal errado / não texto.

**Rationale**: REST claro; `channel_id` no path evita apagar mensagem noutro canal por ID adivinhado; alinhado a outros deletes do projecto.

**Alternatives considered**: `POST .../delete` (desnecessário); apagar só por `message_id` global (pior ACL).

## 3. Regra de autorização

**Decision**: Permitir se **qualquer** for verdade (membro do servidor + canal tipo `text`):

1. `message.sender_account_id == caller` (autor; sem janela temporal)
2. `channel.created_by_account_id == caller`
3. `server.owner_account_id == caller`

Caso contrário **403** (mensagem intacta).

**Rationale**: Spec FR-001–004; `created_by_account_id` e `owner_account_id` já existem.

**Alternatives considered**: Só owner (insuficiente); cargos/roles (out of scope); janela 15 min para autor (clarificação: sem limite).

## 4. Realtime

**Decision**: Após delete bem-sucedido, `ws.send_to_server_members(..., "message.deleted", { id, channel_id })`. Clientes removem a mensagem do estado local se `channel_id` coincidir.

**Rationale**: Espelha `message.new`; SC-002 sem reload.

**Alternatives considered**: Só refetch periódico (pior UX); enviar ciphertext tombstone (rejeitado).

## 5. Anexos e ficheiros em disco

**Decision**: Antes do `DELETE` SQL (ou na mesma transação lógica): listar `message_attachment` da mensagem; apagar ficheiros `{ATTACHMENTS_DIR}/{id}`; depois apagar a mensagem (CASCADE remove rows). `GET /api/attachments/{id}` passa a 404.

**Rationale**: SQLite `ON DELETE CASCADE` limpa metadados, **não** ficheiros; FR-006 / SC-004.

**Alternatives considered**: Deixar órfãos no disco (rejeitado); GC assíncrono só (atrasa SC-004).

## 6. UI: hover + confirmação

**Decision**: Botão «Apagar» visível no hover/foco da mensagem quando `canDelete`; `window.confirm` (texto PT) antes do DELETE; ausente se sem permissão. Cliente calcula `canDelete` com `me.id`, `channel.created_by_account_id`, `server.owner_account_id` (prop/contexto já disponível no shell) + `sender`.

**Rationale**: Clarificações; sem design system de modal; servidor permanece fonte de verdade (403 se UI errada).

**Alternatives considered**: Menu contexto (adiado); confirmar só moderação (spec: confirmação para todas).

## 7. Idempotência

**Decision**: Segundo DELETE → **404** (não encontrada); UI trata como sucesso silencioso / remove local se ainda visível.

**Rationale**: Edge case spec — não corromper canal.
