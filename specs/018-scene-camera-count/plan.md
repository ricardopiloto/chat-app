# Implementation Plan: Número de câmeras na cena e re-layout

**Branch**: `018-scene-camera-count` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-scene-camera-count/spec.md`

## Summary

Permitir no **editor de cena** escolher **N ∈ [2,8]** câmeras/slots, **ortogonal** à família de layout (Mestre / Painel / Faixa). A geometria CSS regenera-se com N (Mestre: 1 destaque fixo + N−1 satélites; Faixa: N-up; Painel: grelha equilibrada). Reduzir N: vazios a mais saem automaticamente; se for preciso remover ocupados, o editor **escolhe** quais slots. Pré-visualização imediata no rascunho; palco ao vivo só após **Guardar**. Exige desacoplar `layout_key` de `slot_count` fixo no **backend** (`validate_layout` hoje força catálogo 4/5 e máx. 5) e no **frontend** (`sceneLayouts.ts` / `setNamedLayout`).

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS) + Rust (Axum/SQLite) para validação/persistência de cena.

**Primary Dependencies**: `SceneEditor.tsx`, `sceneDraft.ts`, `sceneLayouts.ts`, `CameraGrid.tsx`, `PATCH` cena (`scenes.rs` + `domain/grid.rs` `validate_layout`), WS broadcast de grid ao guardar cena activa.

**Storage**: SQLite — `scene.slot_count` + `layout_key` + slots; `channel.grid_slot_count` espelhado ao activar/guardar cena activa (já existente).

**Testing**: `cd frontend && npx tsc --noEmit`; `cargo test` (contract scenes/grid); [quickstart.md](./quickstart.md).

**Target Platform**: Browser + API self-hosted.

**Project Type**: Web app — `frontend/` + `backend/` (validação/limites).

**Performance Goals**: Troca de N no rascunho sem jank; save + broadcast como hoje.

**Constraints**: N 2–8; destaque Mestre = slot índice 0 geométrico; save-gated live; sem canvas livre; provision voice ainda pode usar defaults — alinhar limites a 2–8 onde aplicável.

**Scale/Scope**: Motor de layout paramétrico N; UI controlo N + fluxo de remoção selectiva; relaxar `validate_layout` / `LayoutKey::slot_count`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + `cargo test` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos cobrem layout paramétrico, API de save e UX de redução. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/018-scene-camera-count/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── parametric-layouts.md
│   ├── scene-slot-count-api.md
│   └── reduce-slot-count-ux.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/sceneLayouts.ts      # ALTERAR — geometria f(layout_key, N)
├── components/SceneEditor.tsx      # ALTERAR — controlo N + picker remoção
├── components/CameraGrid.tsx       # ALTERAR — cellStyle(key, index, N)
├── preferences/sceneDraft.ts       # ALTERAR — setSlotCount / reduce com escolha
└── pages/VoiceChannel.tsx          # VERIFICAR — save já envia slot_count

backend/src/
├── domain/grid.rs                  # ALTERAR — validate_layout 2..=8; key ⊥ count
├── api/channel_provision.rs        # ALTERAR — alinhar max voice slots se necessário
└── tests/contract/…                # ALTERAR — mestre+N=6, faixa N variável
```

**Structure Decision**: Parametrizar layouts no FE; desacoplar validação no BE; UI de N e redução no SceneEditor; persistência via PATCH layout existente.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
