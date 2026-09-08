# Data Model: 053-frontend-build-optimize

Sem entidades de persistência servidor. Modelo conceptual para inventário, chunks e estados de carga.

## DuplicationCluster

| Campo | Tipo | Notas |
|-------|------|-------|
| id | string | Ex.: `C1-api-error` |
| title | string | Intenção partilhada |
| files | string[] | Paths relativos a `frontend/src` |
| target_helper | string \| null | Módulo local alvo (`frontend/src/lib/…`) |
| status | enum | `pending` \| `unified` \| `false-positive` \| `intentional-divergence` |
| notes | string | Razão se não unificado |

**Regras**: Ao fechar a feature, nenhum cluster inventariado fica `pending`. SC-002 exige cobertura total do inventário.

## LocalHelperModule

| Campo | Tipo | Notas |
|-------|------|-------|
| path | string | Ex.: `frontend/src/lib/apiError.ts` |
| responsibility | string | Uma intenção |
| consumers | string[] | Ecrãs migrados (FR-007) |

Helpers previstos (mínimo):
- `apiError` / `errorMessage` — C1 (+ base para C2)
- `capabilities` — C3
- `localPrefs` ou `storageKey` — C4
- Opcionais: `panelLoadState`, `routeShell`, `safePlayMedia` — C5–C7

## DeliveryChunk

| Campo | Tipo | Notas |
|-------|------|-------|
| name | string | Entry vs `voice-*` / vendor |
| role | enum | `entry` \| `async` \| `vendor` |
| max_bytes_entry | number | Entry MUST &lt; 500_000 (SC-001) |
| load_trigger | string | `boot` \| `voice_join_or_active` \| `route` |

## VoiceLoadState

| Estado | UI | Transições |
|--------|-----|------------|
| `idle` | N/A (texto, sem chamada) | → `loading` no join / deep-link voz |
| `loading` | Indicador «a carregar…» | → `ready` \| `failed` |
| `ready` | Canal/voz normal | → `idle` ao hangup (módulo pode ficar em cache) |
| `failed` | Mensagem + **Tentar de novo** | → `loading` |

**Invariantes**:
- `idle` sem chamada ⇒ LiveKit não no grafo do entry.
- Chamada activa ⇒ `ready` (stack carregado); PiP permitido em rotas de texto.
- Prefs unificadas ⇒ mesmas chaves `localStorage` (FR-008).

## BaselineBuild

| Campo | Valor de referência |
|-------|---------------------|
| entry_raw_kb | ~962.84 |
| entry_gzip_kb | ~277.26 |
| date | Build produção citada pelo utilizador |
| gate_entry_kb | 500 |
