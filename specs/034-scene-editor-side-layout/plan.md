# Implementation Plan: Painel lateral do editor de cena — slots compactos no topo

**Branch**: `034-scene-editor-side-layout` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/034-scene-editor-side-layout/spec.md`

## Summary

Corrigir o empilhamento de `.scene-editor-side`: o bloco **«Câmeras na cena» / N slots** fica **compacto no topo** (altura ≈ conteúdo, ≤120px em painéis altos). **Layout** e **No banco** empilham por conteúdo abaixo, **sem** divisão igual da altura. Scroll no **painel inteiro** se o conteúdo não couber. Só CSS + markup leve; sem mudança de lógica 018.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS em `mesa-theme.css`.

**Primary Dependencies**: `SceneEditor.tsx`, classes `.scene-editor-side`, `.layout-list`, `.editor-bank`; editor 013/018.

**Storage**: N/A — sem API/migração.

**Testing**: Validação visual/manual ([quickstart.md](./quickstart.md)); `./node_modules/.bin/tsc --noEmit`; smoke guardar/N/layout/banco (SC-003). Sem contract BE.

**Target Platform**: Browser desktop (≥901px coluna lateral) e stack estreito.

**Project Type**: Web app — `frontend/` only for this feature.

**Performance Goals**: Layout instantâneo; sem jank ao redimensionar.

**Constraints**: FR-001–005; clarificação: stack por conteúdo + scroll no painel; não redesenhar thumbnails; não mudar limites 2–8 nem reduce-N.

**Scale/Scope**: Uma coluna ~296px; três secções.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Manual/quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Só layout CSS + wrappers opcionais; zero BE. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/034-scene-editor-side-layout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── scene-editor-side-stack.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/mesa-theme.css       # .scene-editor-side + blocos flex:none; overflow
frontend/src/components/SceneEditor.tsx  # wrappers semânticos das 3 secções (slots / layout / banco)
```

**Structure Decision**: FE-only. Explicit section wrappers + CSS (`flex: none`, `justify-content: flex-start`, panel `overflow: auto`). Verify no equal-height/`flex: 1` on the three parts.

## Complexity Tracking

> Vazio — ajuste de layout.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
