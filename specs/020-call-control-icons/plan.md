# Implementation Plan: Ícones e split da barra de chamada

**Branch**: `020-call-control-icons` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-call-control-icons/spec.md`

## Summary

Polimento visual da barra de chamada: **Microfone** e **Câmara** passam a **só ícone** (com tooltip/`title` espelhando o `aria-label` de estado); o split da câmara (015) passa a um **contentor Discord-like** (fundo contínuo + separador vertical + chevron); **Sair** mantém hangup + texto «Sair» mas fica **vermelho** (acção destrutiva). Sem mudanças de API, media ou blur logic.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend only.

**Primary Dependencies**: Ícones existentes (012); split + `CameraBlurMenu` (015); CSS Mesa / Nocturne. Sem npm novos.

**Storage**: N/A (sem persistência nova; blur continua em `mesa.cameraBlur`).

**Testing**: `cd frontend && npx tsc --noEmit`; revisão visual manual [quickstart.md](./quickstart.md) (claro/escuro).

**Target Platform**: Browser SPA; barra `.call-controls` em canal de voz/vídeo ao vivo.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Tooltip nativo ≤1 s de pairar estável (SC-006); sem trabalho contínuo novo.

**Constraints**: Não alterar toggle mic/cam, menu blur, gravar, E2EE. Microfone e Sair sem split. Touch targets ≥ ~44 px. Contraste do vermelho em claro e escuro.

**Scale/Scope**: ~1 ficheiro TSX (`VoiceChannel.tsx`) + CSS (`.call-ctrl-split`, `.btn-danger` / leave); contrato UI actualizado vs 015.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado (como 007–019).

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart visual |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Sem schema/API; contratos UI + data-model de apresentação. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/020-call-control-icons/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── call-control-chrome.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── pages/
    │   └── VoiceChannel.tsx          # ALTERAR — remover spans Microfone/Câmara; title=aria; Sair danger
    └── styles/
        ├── mesa-theme.css            # ALTERAR — split Discord (contentor + divider); leave red; icon-only sizing
        └── nocturne.css              # ALTERAR se necessário — .btn-danger token/base

backend/            # Intocado
```

**Structure Decision**: Só UI na barra de chamada existente. Reutilizar markup do split 015; endurecer CSS para contentor unificado estilo Discord; `title` nativo para tooltips (espelha `aria-label`).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
