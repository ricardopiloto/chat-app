# Research: 018-scene-camera-count

## 1. Desacoplar `layout_key` de `slot_count` fixo (backend)

**Decision**: Alterar `validate_layout` em `backend/src/domain/grid.rs` para:
- Aceitar `slot_count` ∈ **[2, 8]**;
- Exigir `slots.len() == slot_count` e índices `0..slot_count-1` únicos;
- **Não** exigir `slot_count == layout_key.slot_count()` do catálogo antigo;
- Manter `layout_key` ∈ `{mestre, quad, faixa}` como família visual.

Remover ou redefinir `LayoutKey::slot_count()` / `from_slot_count()` para não forçar 4/5 (defaults de provisionamento podem usar N=4 + `quad` explicitamente).

**Rationale**: Hoje `validate_layout` rejeita qualquer N≠catálogo e limita a 2–5 — bloqueia N=6 e Faixa/Mestre variáveis. A spec trata N como ortogonal à família.

**Alternatives considered**:
- Novos `layout_key` por N (`faixa6`, `mestre6`) — explosão de enums; rejeitado.
- Só FE sem BE — save falharia na validação actual.

## 2. Geometria paramétrica no frontend

**Decision**: Substituir `SCENE_LAYOUTS.*.slotCount` fixo por funções `layoutGeometry(key, n) → { cols, rows, cells[] }` em `sceneLayouts.ts`:

| Família | Regra |
|---------|--------|
| **faixa** | `cols: repeat(N, 1fr)`, 1 linha; label dinâmico `Faixa ${N}-up` |
| **mestre** | Slot **0** = destaque (área maior, posição fixa); slots `1..N-1` = satélites em grelha no resto (ex. coluna esquerda `2fr` span rows; direita `repeat(k, 1fr)`). Para N=5 reproduzir o aspecto actual o mais possível |
| **quad** | Grelha equilibrada: `cols = ceil(sqrt(N))`, `rows = ceil(N/cols)`, células iguais |

`cellStyle(key, slotIndex, n)` e `CameraGrid` / `SceneEditor` passam a usar `draft.slot_count` (não o catálogo fixo).

**Rationale**: Spec US2–US4; destaque fixo no índice 0 (clarificação).

**Alternatives considered**: CSS container queries only — insuficiente para reindexação de slots; templates por N hardcoded — manutenção pesada.

## 3. Draft: `setSlotCount` e redução com escolha

**Decision**: Em `sceneDraft.ts`:
- **Aumentar N**: acrescentar slots vazios com índices `oldN .. N-1`.
- **Diminuir N, só vazios em excesso**: remover automaticamente slots vazios (preferir índices mais altos) até restarem N; reindexar `0..N-1` preservando ordem relativa dos mantidos e `account_id`.
- **Diminuir N, precisa remover ocupados**: UI pede selecção de exactamente `oldN - N` slots a eliminar; restantes reindexados; ocupantes eliminados → banco (sem `account_id` nos slots removidos).

`setNamedLayout(key)` **mantém** o N actual do draft (não força 4/5); só muda `layout_key` e regenera geometria.

**Rationale**: Clarificações A/B sobre remoção; FR-007/009.

**Alternatives considered**: Truncar sempre no fim — rejeitado; sempre pedir escolha — rejeitado quando só há vazios.

## 4. Persistência e palco ao vivo

**Decision**: Continuar a guardar via PATCH de cena com `layout: { layout_key, slot_count, slots, assigned_by }` (fluxo actual do editor). Broadcast de grid só no save da cena **activa** (já implementado). Rascunho local até save/discard (FR-006/011).

**Rationale**: Clarificação — palco só após Guardar.

**Alternatives considered**: PATCH parcial só `slot_count` — desnecessário se o layout completo já é enviado.

## 5. Provisionamento de canal de voz

**Decision**: Alinhar `channel_provision` de `grid_slot_count must be 2–4` para **2–8** (ou pelo menos permitir até 8) se a criação ainda expõe o campo; default pode permanecer 4 + `quad`. Não é o foco do editor, mas evita inconsistência de limites.

**Rationale**: Um único intervalo de produto (FR-008).

**Alternatives considered**: Deixar provision em 2–4 — confuso face ao editor 2–8.
