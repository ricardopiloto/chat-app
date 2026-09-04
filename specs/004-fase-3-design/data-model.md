# Data Model: Fase 3 — Redesign (estado de UI)

Esta fase **não** altera o modelo SQLite das Fases 1–2. Entidades abaixo são estado de **cliente** (e preferências no dispositivo). Domínio de cenas/canais continua em [../003-fase-2-cenas/data-model.md](../003-fase-2-cenas/data-model.md).

---

## ThemePreference

| Campo | Tipo | Notas |
|-------|------|--------|
| value | `light` \| `dark` | Persistido em `mesa.theme` |
| source | `user` \| `system` | Só em memória: se não há `mesa.theme`, deriva de `prefers-color-scheme` |

**Regras**: Palco (`--stage`) e tiles não herdam o “claro” do chrome. Troca aplica `data-theme` no contentor raiz.

---

## ViewModePreference

| Campo | Tipo | Notas |
|-------|------|--------|
| value | `composition` \| `grid` | Persistido em `mesa.viewMode` |

**Regras**: Uma por dispositivo/perfil de browser (não por `channel_id`). Default: `composition`.

---

## ShellState

| Campo | Tipo | Notas |
|-------|------|--------|
| selectedServerId | uuid \| null | Servidor cujo cabeçalho/lista estão activos |
| stageMode | boolean | Sidebar a 0 / gaveta fechada |
| sidebarOpen | boolean | Viewport estreita: gaveta visível |
| instanceLabel | string | `instância ·` + `location.hostname` (derivado, não persistido) |

**Transições**:
- Entrar em canal de voz → pode oferecer modo palco; sair do canal → `stageMode = false` (recomendado).
- Viewport estreita + `stageMode` → `sidebarOpen = false`.

---

## SceneDraft (editor)

| Campo | Tipo | Notas |
|-------|------|--------|
| sceneId | uuid | Cena em edição |
| channelId | uuid | |
| baseLayout | GridLayout | Snapshot ao abrir / após último Salvar bem-sucedido |
| draftLayout | GridLayout | Mutável (slots, slot_count) |
| dirty | boolean | `draftLayout` ≠ `baseLayout` (comparação estrutural) |
| nameDraft | string \| null | Se o editor permitir rename antes de Salvar |

**Transições**:
- Abrir editor → `base = draft = layout` actual; `dirty = false`.
- Mutação (drag/teclado/layout) → `dirty = true`.
- Descartar → `draft = base`; `dirty = false`.
- Salvar (ok) → persistir via API F2 → `base = draft`; `dirty = false`.
- Sair com `dirty` → confirmação: guardar | descartar | cancelar.

**Validação** (cliente, alinhada a F2): `slot_count` ∈ 2..4; no máximo um slot por `account_id`; índices 0..slot_count-1.

---

## CallBank (vista)

| Campo | Tipo | Notas |
|-------|------|--------|
| inCallAccountIds | uuid[] | Presentes na room LiveKit (ou equivalente local) |
| slottedAccountIds | uuid[] | `account_id` não nulos na cena activa |
| bankAccountIds | uuid[] | `inCall − slotted` |

Usado pelo chrome Composição (lista “No banco”) e para montar a Grade.

---

## Relationships (UI)

```text
ThemePreference ──applies──▶ AppShell (data-theme)
ViewModePreference ──selects──▶ VoiceStage (composition | grid)
ShellState ──owns──▶ Sidebar visibility
SceneDraft ──on Save──▶ Scene / GridLayout (servidor F2)
CallBank ──feeds──▶ Composition bank + Grid view
```

Sem novas FKs no SQLite.
