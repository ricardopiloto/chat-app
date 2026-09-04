# Data Model: Fase 3 — Correções (layouts nomeados)

Estende o modelo de [../003-fase-2-cenas/data-model.md](../003-fase-2-cenas/data-model.md). Preferências UI da 004 mantêm-se.

---

## NamedLayoutKey (catálogo)

| Valor | Label | slot_count |
|-------|-------|------------|
| `mestre` | Mestre em destaque | 5 |
| `quad` | Painel 2×2 | 4 |
| `faixa` | Faixa 5-up | 5 |

Geometria CSS: [contracts/layout-catalog.md](./contracts/layout-catalog.md). Não é tabela SQLite — enum estável.

---

## Scene (estendido)

| Campo | Tipo | Notas |
|-------|------|--------|
| id | uuid | PK |
| channel_id | uuid | |
| name | string | |
| slot_count | int | 4 ou 5 conforme `layout_key` |
| layout_key | `mestre` \| `quad` \| `faixa` | **novo**; NOT NULL após migrate |
| slots | SceneSlot[] | índices 0..slot_count-1 (API pode usar 0-based; protótipo 1-based só visual) |
| is_active | bool | derivado |

**Regras**:
- `slot_count` MUST igualar o do catálogo para `layout_key`.
- Mudar `layout_key` no rascunho: redimensionar slots (excesso → sem conta; novos → vazios).
- Só **dono** PATCH / activar.

**Migração**: `ALTER TABLE scene ADD COLUMN layout_key TEXT`; backfill (ver research D1); depois NOT NULL default `quad`.

---

## GridLayout (API / canal activo)

| Campo | Tipo | Notas |
|-------|------|--------|
| layout_key | string | obrigatório nas respostas novas |
| slot_count | int | 4 ou 5 |
| assigned_by | `auto` \| `owner` | |
| slots | { index, account_id }[] | |

Canal: ao activar cena, copiar `layout_key` + slots para a grade activa (como F2 copia layout).

Validação servidor: `layout_key` ∈ catálogo; `slot_count` match; índices únicos; no máximo um slot por `account_id`; range `2..=5` (efectivamente 4|5).

---

## ChannelRole (co_director)

Sem mudança de schema. **Política**: papéis existentes **não** autorizam activação nesta fase. UI não gere. Feature futura pode reactivar.

---

## SceneDraft (cliente, estendido)

| Campo | Tipo | Notas |
|-------|------|--------|
| layoutKey | NamedLayoutKey | |
| baseLayout / draftLayout | GridLayout | incluem `layout_key` |
| dirty | boolean | inclui mudança de layout_key |
| selectedBankId | uuid \| null | toque em dois passos |

Banco derivado: `inCallAccountIds − slottedAccountIds` (só room).

---

## ShellState (cliente)

Inalterado conceptualmente; fix de CSS garante `stage` com área útil em modo palco estreito.

---

## Relationships

```text
NamedLayoutKey ──defines──▶ Scene.layout_key + slot_count + geometry
Scene ──activate──▶ Channel active GridLayout (copia layout_key + slots)
SceneDraft ──Salvar──▶ PATCH Scene | PUT Grid (owner)
CallBank ──from──▶ LiveKit room identities
```
