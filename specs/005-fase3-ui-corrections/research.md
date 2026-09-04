# Research: Fase 3 — Correções de UI

Fecha as decisões de implementação da spec 005 (Clarifications 2026-09-04) sobre o código 004 + F2.

---

## D1 — Persistir `layout_key` + slot_count 2–5

- **Decision**: Extender `GridLayout` / respostas de cena com `layout_key`: `"mestre" | "quad" | "faixa"`. Validar que `slot_count` coincide com o catálogo (mestre=5, quad=4, faixa=5). Alargar validação de `2..=4` para `2..=5` (e preferir igualdade exacta ao catálogo no PUT/PATCH). Coluna `layout_key` em `scene` (TEXT NOT NULL após backfill); canal activo herda ao activar / PUT grid.
- **Rationale**: Clarify Q1; Mestre e Faixa ambos têm 5 células com geometrias diferentes.
- **Alternatives considered**: Só `slot_count` — rejeitado. Geometria só cliente — rejeitado.

**Backfill**: cenas/`grid` sem chave → `quad` se `slot_count = 4`; se `slot_count = 2` ou `3`, mapear para `quad` e **expandir/contrair** slots no migrate (preencher índices em falta com NULL; truncar excesso devolvendo implicitamente ao “banco” ao ler). Documentar no migration comment. Preferência: dados legacy 4-slot → `quad` intacto.

---

## D2 — Catálogo canónico (espelho do protótipo)

- **Decision**: Três layouts exactamente como `LAYOUTS` em `Mesa - Protótipo v2.dc.html`:

| key | label | slots | CSS cols / rows | cells (slot → col / row) |
|-----|-------|-------|-----------------|--------------------------|
| `mestre` | Mestre em destaque | 5 | `2fr 1fr 1fr` / `1fr 1fr` | 1: 1 / 1 span 2; 2:2/1; 3:3/1; 4:2/2; 5:3/2 |
| `quad` | Painel 2×2 | 4 | `1fr 1fr` / `1fr 1fr` | 2×2 |
| `faixa` | Faixa 5-up | 5 | `repeat(5,1fr)` / `1fr` | 5 colunas |

Contrato: [contracts/layout-catalog.md](./contracts/layout-catalog.md). Cliente e servidor partilham as mesmas chaves/contagens; só o cliente aplica `grid-column`/`grid-row`.

- **Rationale**: FR-002 / SC-003.
- **Alternatives considered**: Layouts livres pelo utilizador — fora de âmbito.

---

## D3 — Modo palco vazio no telemóvel

- **Decision**: Bug de **layout CSS/shell**, não de LiveKit. Em viewport &lt;900px, `.shell.stage-mode` não pode deixar `.shell-main` / `.stage` com altura 0 (sidebar absolute + `grid-template-columns: 0 1fr` + flex mal encadeado). Corrigir: (1) em estreito, modo palco só fecha gaveta e garante `shell-main`/`pane`/`stage` com `flex:1; min-height:0` e altura mínima do stage (ex. `min-height: 40vh` ou `flex:1` na cadeia completa); (2) não aplicar `width:0; overflow:hidden` de forma que colapse o grid row; (3) re-layout media após toggle de stage (microtask `layoutMedia`).
- **Rationale**: SC-001 / FR-001; áudio/vídeo já fluem.
- **Alternatives considered**: Forçar landscape — rejeitado. Desactivar modo palco no mobile — rejeitado pela spec.

---

## D4 — Activação e edição só dono

- **Decision**: `POST .../scenes/{id}/activate`, `PATCH` cena, `PUT` grid: autorizar **apenas** `server.owner_account_id`. Remover caminho que permite `co_director`. UI: sem `CoDirectorPanel`; `canActivate`/`canManage` = owner. Endpoints `GET/PUT .../roles` podem permanecer (regressão/futuro) mas a UI não os chama; testes de co-diretor passam a esperar **403** na activação por co-diretor (ou são reescritos).
- **Rationale**: Clarify Q3 / FR-006a.
- **Alternatives considered**: API permissiva sem UI — rejeitado (papel fantasma).

---

## D5 — Sem texto no canal de voz; banco = room

- **Decision**: Remover lista/composer de mensagens de `VoiceChannel.tsx`. Banco do editor e CallBank usam identities LiveKit (+ local), **não** lista completa de membros (exceto handles para display via members map já carregado).
- **Rationale**: Clarify Q2; FR-007 / FR-003a.
- **Alternatives considered**: Membros do servidor no banco — rejeitado na clarify.

---

## D6 — Editor empilhado + toque em dois passos

- **Decision**: CSS: desktop `grid-template-columns: 1fr 296px`; `@media (max-width: 900px)` coluna única empilhada. Interacção: `selectedBankAccount` → click slot atribui; click slot ocupado sem selecção devolve ao banco; drag opcional só onde `matchMedia('(pointer:fine)')` ou sempre no desktop além do toque.
- **Rationale**: Clarify Q4–Q5.
- **Alternatives considered**: Só drag; editor desktop-only — rejeitados.

---

## D7 — Escala tipográfica / alvos

- **Decision**: Subir base da SPA autenticada para ~16px body onde o DS usa 14–15; garantir `.btn` / call controls / channel items com **min-height ≥ 40px** (já parcial); aumentar padding da sidebar e pane-title (~16–18px). Auth card alinhado. Checklist de fidelidade escala.
- **Rationale**: FR-005 / US3.
- **Alternatives considered**: Zoom CSS global `transform` — rejeitado (quebra layout).

---

## D8 — Conflitos concurrentes

- **Decision**: Last-write-wins no PUT/PATCH (comportamento F2); sem locking optimista nesta fase (deferred no clarify).
- **Rationale**: Grupo pequeno; YAGNI.
- **Alternatives considered**: ETags — adiado.

---

## D9 — Testes

- **Decision**: Actualizar contract tests: `layout_key` roundtrip; slot_count 5 para faixa/mestre; activate por non-owner 403; co_director activate 403. Frontend: tsc. Manual: quickstart US1–US4.
- **Rationale**: SC + regressão F2.
