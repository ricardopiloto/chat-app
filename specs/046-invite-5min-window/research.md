# Research: 046-invite-5min-window

## R1 — Default TTL 300s

**Decision**: Alterar fallback de `Config::default_invite_ttl_secs` de `604_800` para **`300`**. Continuar a ler `DEFAULT_INVITE_TTL_SECS` do ambiente (clarificação B).

**Rationale**: Produto 5 min; labs podem sobrescrever sem rebuild.

**Alternatives considered**: Hardcode 300 sem env (rejeitado — clarificação B); só UI enviar 300 e deixar default 7d (inconsistente).

## R2 — Proibir permanentes

**Decision**: Em `create_invite`, `MaybeExpires::Value(None)` (permanente) → **`400 bad_request`**. `Missing` → `now + default_invite_ttl_secs`. `Value(Some(secs))` → permitir para clientes avançados/testes, mas UI não envia (omite → default). Documentar que permanente está removido do produto.

**Rationale**: FR-006 / FR-009.

**Alternatives considered**: Ignorar null e forçar default (silencioso); rejeitar qualquer `expires_in_seconds` explícito (demasiado rígido para testes).

## R3 — Contagem de usos (teto 10)

**Decision**:

- Constante `pub const INVITE_MAX_USES: i64 = 10` (domínio ou config fixa, não env nesta feature).
- Coluna `use_count INTEGER NOT NULL DEFAULT 0` em `invite`.
- `is_usable(now)`: `revoked_at.is_none() && expires_at.map(|t| t > now).unwrap_or(false)` **e** `use_count < INVITE_MAX_USES`.  
  Nota: `expires_at` **MUST** ser `Some` para convites novos (nunca null após R2).
- Após membership criada com sucesso (register path + accept path), **`UPDATE invite SET use_count = use_count + 1 WHERE code = ? AND use_count < 10`** e falhar se `rows_affected == 0` (corrida / esgotado). Preferir incrementar **na mesma lógica** imediatamente após criar membership, idealmente em transacção com o insert de membership.

**Rationale**: FR-002 / FR-010; SC-003; evita 11.º uso sob concorrência.

**Alternatives considered**: Contar `membership` por `joined_via_invite_id` (OK mas mais lento / edge se membership apagada); max_uses por convite na API (out of scope).

## R4 — Quando conta como “uso”

**Decision**: Um uso = adesão nova bem-sucedida via esse convite (registo com `invite_code` que cria membership, ou `accept` que cria membership). Se a conta **já** é membro do servidor, accept idempotente **não** incrementa (já era o comportamento de early-return).

**Rationale**: Spec — registo ou aceitação que criem adesão.

## R5 — Invalidar legados (migração)

**Decision**: Migração `0011_…sql`:

1. `ALTER TABLE invite ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0;`
2. Invalidar activos:  
   `UPDATE invite SET revoked_at = COALESCE(revoked_at, <now RFC3339>) WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > <now>);`  
   (ou set `expires_at` para agora — revoke é mais claro e alinha a `is_usable`).

**Rationale**: FR-011 / clarificação B legados.

**Alternatives considered**: Só permanentes (incompleto vs “longos”); reescrever TTL para +5min (clarificação C rejeitada).

## R6 — Respostas de erro

**Decision**: Manter `410 Gone` / mensagens existentes para expirado/revogado/inválido; incluir esgotamento de usos na mesma família (“invite expired, revoked, or invalid” ou mensagem PT no FE). Preview `404` se não utilizável.

**Rationale**: Mínima mudança de contrato HTTP; FE pode mapear copy.

## R7 — Frontend

**Decision**: Sidebar continua sem enviar `expires_in_seconds`. Opcional: texto no diálogo “Válido 5 minutos · até 10 entradas”. Invite page: mensagem clara se preview falhar.

**Rationale**: Out of Scope redesenho completo.

## R8 — Docs operacionais

**Decision**: Actualizar menção a `DEFAULT_INVITE_TTL_SECS` (default 300) em docs de operar/deploy se existir.

**Rationale**: Operadores alinhados ao produto.
