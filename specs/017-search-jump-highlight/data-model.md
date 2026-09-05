# Data Model: 017-search-jump-highlight

Sem entidades de persistência novas. Estado de UI / navegação.

## `SearchHit` (existente — 014)

| Campo | Uso neste salto |
|-------|-----------------|
| `messageId` | Alvo do deep-link |
| `channelId` / `serverId` / `channelType` | Rota de navegação |
| snippet / nomes | Só apresentação na lista |

## `MessageJumpTarget` (query / intenção)

| Campo | Tipo | Notas |
|-------|------|-------|
| `messageId` | string (UUID) | Query `message` |
| `channelId` | string | Path `/channels/:id` |
| `serverId` | string | Query `server` (existente) |

### Resolução

| Estado | Transição |
|--------|-----------|
| `pending` | Navegação iniciada; Channel a carregar |
| `found` | Mensagem no DOM → scroll center + highlight 3 s → `idle` |
| `seeking` | Não na página actual → fetch `before` (≤5) |
| `missing` | Esgotou seek / apagada → toast → `idle` (sem highlight) |

## `MessageHighlight` (UI efémera)

| Campo | Valor |
|-------|-------|
| `messageId` | id destacado |
| `until` | ~now + 3000 ms |
| Clear | Timer OU novo salto (substitui) — **não** scroll/clique |

## `ToastNotice` (UI efémera)

| Campo | Notas |
|-------|-------|
| `message` | Texto PT curto |
| `kind` | `info` / `error` (falha de salto) |
| Auto-dismiss | ~4 s |

## Validação

- `message` query ausente → comportamento actual (sem foco).
- `message` presente mas inválido / não encontrado após seek → toast, sem classe highlight.
