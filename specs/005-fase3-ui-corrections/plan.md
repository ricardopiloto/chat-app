# Implementation Plan: Fase 3 — Correções de UI (palco, editor, escala)

**Branch**: `005-fase3-ui-corrections` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-fase3-ui-corrections/spec.md`

## Summary

Corrigir e completar a Fase 3 (004): (1) **Modo palco no telemóvel** com palco visível; (2) **editor de cena** alinhado ao protótipo v2 com layouts nomeados persistidos (`mestre` | `quad` | `faixa`), até **5** slots e atribuição por toque em dois passos / arrastar; (3) **escala** tipográfica e de botões; (4) **remover** UI de co-diretor e chat de texto no canal de voz/vídeo; activação/edição **só dono** (API alinhada). Implica **migração SQLite** + extensão dos contratos de cena/grade — não é só CSS.

## Technical Context

**Language/Version**: TypeScript (SolidJS SPA) + Rust (Axum/SQLite) — herdado.

**Primary Dependencies**: SolidJS, Vite, Nocturne vendido em `frontend/src/styles/`; LiveKit inalterado na lógica de mídia; sqlx migrations.

**Storage**: SQLite — coluna `layout_key` (ou equivalente) em `scene` (+ espelho na grade activa do canal); `slot_count` validado **2–5** conforme catálogo. Preferências UI (`mesa.*`) inalteradas.

**Testing**: `cargo test` (contratos cena/grade/roles actualizados); `npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md) + [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md).

**Target Platform**: Browser desktop + telemóvel na LAN (HTTPS local).

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: Palco visível &lt;30s após Modo palco (SC-001); diretor completa layout+atribuir+Salvar &lt;3min (SC-002).

**Constraints**: Fidelidade layouts do protótipo v2; banco = só room; só dono activa/edita; sem UI co-diretor / texto em voz; E2EE-on; sem Gravar.

**Scale/Scope**: Canais de voz/vídeo + shell; ~editor, CameraGrid, VoiceChannel, AppShell CSS, APIs scene/grid, migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — contratos Rust + quickstart |
| Complexity Tracking | Ver abaixo (migração + API necessárias pela clarify) |

**Gate: PASS.**

### Re-check pós-Phase 1

Artefactos incluem migração e extensão de `GridLayout`/`Scene` (clarify Q1). Co-diretor desactivado na política de activação, não removido do schema nesta fase. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/005-fase3-ui-corrections/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
├── checklists/
└── tasks.md             # /speckit-tasks — NÃO criado aqui
```

### Source Code (repository root)

```text
frontend/src/
├── styles/mesa-theme.css       # escala + fix modo palco estreito
├── shell/AppShell.tsx          # stage-mode / drawer heights
├── components/
│   ├── SceneEditor.tsx         # layouts nomeados, empilhado, toque 2 passos
│   ├── CameraGrid.tsx          # geometria CSS grid do catálogo
│   ├── sceneLayouts.ts         # catálogo mestre/quad/faixa (cliente)
│   └── …                       # remover uso CoDirectorPanel no voice
├── pages/VoiceChannel.tsx      # sem chat texto; editor; owner-only
└── api/client.ts               # layout_key nos tipos

backend/
├── migrations/000N_layout_key.sql
├── src/domain/grid.rs          # validate 2–5 + layout_key
├── src/domain/scene.rs
├── src/api/scenes.rs / grid.rs # owner-only activate/edit
└── tests/contract/…
```

**Structure Decision**: Correções partilhadas UI + modelo de cena. Catálogo de geometria **duplicado de forma controlada**: constante canónica documentada em [contracts/layout-catalog.md](./contracts/layout-catalog.md); cliente renderiza CSS; servidor valida `layout_key` + `slot_count`.

## Complexity Tracking

| Divergência | Justificação | Alternatives rejected |
|-------------|--------------|----------------------|
| Migração + `layout_key` (API) | Clarify: sem id persistido, Mestre vs Faixa (ambos 5 slots) são indistinguíveis | Inferir só por `slot_count` |
| `slot_count` até 5 | Faixa / Mestre no protótipo | Limitar a 4 e aproximar Faixa |
| API recusa activação a co-diretor | Clarify: só dono nesta fase | Manter API permissiva sem UI |

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md)
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)
