# Implementation Plan: Menu de blur da câmara não abre

**Branch**: `023-fix-blur-menu` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-fix-blur-menu/spec.md`

## Summary

Restaurar a visibilidade do menu Sem blur / Blur leve / Blur forte ao clicar na seta do split da câmara (015), incluindo modo palco. Causa raiz provável: `overflow: hidden` em `.call-ctrl-split` (020) corta o painel absoluto acima do botão. Fix preferido: permitir overflow do menu sem perder o chrome Discord do split.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9) — frontend only.

**Primary Dependencies**: `CameraBlurMenu.tsx`, `VoiceChannel.tsx` split, `mesa-theme.css` (`.call-ctrl-split`, `.camera-blur-menu`).

**Storage**: N/A (`mesa.cameraBlur` inalterado).

**Testing**: `cd frontend && npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) (normal + stage mode).

**Target Platform**: Browser; barra `.call-controls` em voz/vídeo e stage-mode.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Menu visível no mesmo frame do toggle (≤1 s SC).

**Constraints**: Não mudar opções de blur nem media pipeline; manter toggle da seta / Escape / clique fora; ícone de câmara continua a só ligar/desligar.

**Scale/Scope**: Tipicamente 1–2 ficheiros CSS (+ ajuste mínimo TSX só se Portal for necessário).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Bugfix UI; contrato de menu + CSS. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/023-fix-blur-menu/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── blur-menu-visibility.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── components/
    │   └── CameraBlurMenu.tsx        # Só se Portal/ancoragem for necessária
    ├── pages/
    │   └── VoiceChannel.tsx          # Só se markup do menu sair do split
    └── styles/
        └── mesa-theme.css            # ALTERAR — overflow do split vs menu

backend/            # Intocado
```

**Structure Decision**: Corrigir clipping CSS primeiro (`overflow: visible` + cantos no split sem clipar o menu). Portal só se o menu continuar cortado por ancestrais (`.pane` / stage).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
