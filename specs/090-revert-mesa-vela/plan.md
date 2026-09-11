# Implementation Plan: Revert Mesa à Vela Reskin

**Branch**: `090-revert-mesa-vela` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/090-revert-mesa-vela/spec.md`  
**Revert target**: [089-mesa-a-vela-reskin](../089-mesa-a-vela-reskin/)

## Summary

Undo all **product** outcomes of 089: restore blurple/cool-grey/Inter identity, restore voice-header Editar cena + blur in the default row, remove place typography / seat tones / Mesa à Vela composer chrome / jade E2EE chip / amber speaking restyle, and drop Manrope/Fraunces from the runtime font load. Preserve 082–088 behavior (screen share, Grade, spotlight, user-panel stack, unload leave, clear screen tile). Prefer **surgical undo of 089 hunks** over wholesale file checkout (mesa-theme also holds later features).

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; CSS tokens (`nocturne.css`, `mesa-theme.css`). No Rust/API changes.  
**Primary Dependencies**: Existing `data-theme` toggle; Inter self-hosted fonts; pre-089 VoiceChannel header markup.  
**Storage**: Remove unused `Manrope*` / `Fraunces*` under `frontend/public/fonts/`; keep Inter.  
**Testing**: Manual [quickstart.md](./quickstart.md); `npx tsc --noEmit`; regression smoke for 082–088 surfaces.  
**Target Platform**: Modern browsers; light + dark.  
**Project Type**: Web app — FE visual/chrome rollback only.  
**Performance Goals**: Fewer font files after cleanup; no CDN.  
**Constraints**: Full 089 rollback (FR); must not regress non-089 features; no third identity.  
**Scale/Scope**: Token restore + header markup + remove 089-only CSS/classes/assets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | PASS | Restore existing token/header patterns; no new framework |
| II. CLI Interface | N/A | Visual/chrome |
| III. Test-First | PASS | Visual QA + tsc; quickstart scenarios |
| IV. Integration Testing | PASS | Theme walkthrough + Grade/screen/user-panel smoke |
| V. Observability | PASS | Speaking/reduced-motion restored to prior treatment |
| VI. Versioning & Breaking | PASS | Intentional identity rollback; document in CHANGELOG |
| VII. Simplicity | PASS | Surgical revert vs redesign |

**Post-design re-check**: PASS — contracts encode restore targets without unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/090-revert-mesa-vela/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── identity-restore.md
│   ├── voice-header-restore.md
│   └── surface-rollback.md
└── tasks.md              # /speckit-tasks
```

### Source Code (expected touchpoints)

```text
frontend/src/styles/nocturne.css       # restore blurple ramps, Inter fonts; remove Manrope/Fraunces/@font-face/place/radius-token
frontend/src/styles/mesa-theme.css     # restore .app/light aliases; undo 089 seats/overflow/composer/e2ee/speaking/section-label tweaks; keep 082–088
frontend/src/pages/VoiceChannel.tsx    # restore header; remove ⋯ overflow
frontend/src/components/CameraGrid.tsx # remove seatToneFor / grade-cam-tile seat classes
frontend/src/shell/Sidebar.tsx         # remove .font-place on server name
frontend/src/components/AuthShell.tsx  # remove .font-place on brand
frontend/src/i18n/catalogs/en.ts       # remove voice.headerMore
frontend/src/i18n/catalogs/pt-BR.ts    # remove voice.headerMore
frontend/public/fonts/                 # delete Manrope* / Fraunces*
```

**Structure Decision**: Surgical rollback of 089 deltas; baseline values from pre-089 Nocturne/Mesa documented in 089 gap analysis + git history of those hunks.

## Complexity Tracking

No constitution violations. Risk is mixed `mesa-theme.css` history—mitigated by hunk-level revert and regression smoke (FR-007).
