# Data Model: 014-search-channel-scope

Sem alterações SQLite/REST. Entidades de consulta UI.

## `ParsedSearchQuery`

| Campo | Tipo | Notas |
|-------|------|-------|
| `mode` | `"global" \| "scoped"` | `scoped` se raw começa por `#` |
| `channelName` | `string \| undefined` | Token após `#` até ao espaço; só em `scoped` |
| `term` | `string` | Texto a procurar (trim); mínimo ~2 chars para disparar |
| `raw` | `string` | Valor do input |

### Regras

```
trim(raw) starts with "#" → scoped; channelName = first token after #; term = remainder after first whitespace
else → global; term = trim(raw)
term.length < 2 → não dispara runSearch (idle)
scoped && term ok && no text channel match → emptyReason = channel_not_found | voice_only
```

## `SearchEmptyReason`

| Valor | Copy (PT) | Quando |
|-------|-----------|--------|
| `channel_not_found` | Canal não encontrado | `#nome` sem canal acessível com esse nome |
| `voice_only` | Só canais de texto | Nome existe só em voz/vídeo |
| `no_results` | Sem resultados | Âmbito válido, zero hits (scoped ou global) |

## `InlineSearchState` (refina 013)

| Campo | Tipo | Notas |
|-------|------|-------|
| `expanded` | `boolean` | |
| `query` | `string` | Pode ser seed `#nome ` via atalho |
| `status` | `idle \| searching \| done` | |
| `results` | `SearchHit[]` | |
| `emptyReason` | `SearchEmptyReason \| null` | Preenchido em `done` sem results |

## `SearchShortcutContext`

| Campo | Tipo | Notas |
|-------|------|-------|
| `currentTextChannelName` | `string \| null` | Nome se rota = canal texto; senão null |
| On Ctrl/Cmd+F | — | Se nome ≠ null → `query = "#" + name + " "` (replace); senão expand sem seed `#` |

## Validação

- Hits em `scoped` só de canais texto com nome equalIgnoreCase.
- Global: só `type === "text"`.
- Membership: só servidores de `GET /api/servers`.
