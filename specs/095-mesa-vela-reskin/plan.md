# Implementation Plan: Mesa à Vela — Full-App Visual Reskin

**Branch**: `095-mesa-vela-reskin` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/095-mesa-vela-reskin/spec.md`  
**PRD**: [docs/design-ref/prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md)  
**Context**: [docs/design-ref/ui-refactor-analysis.md](../../docs/design-ref/ui-refactor-analysis.md)

## Summary

Re-apply **Mesa à Vela** (amber + jade parchment, Fraunces place type + Manrope UI, light/dark) across the product by recalculating **Nocturne** + **Mesa** tokens—not dumping prototype CSS. IA unchanged except voice-header **⋯** (Editar cena + blur). Self-host Fraunces/Manrope; keep Inter fallback. Remap `--color-accent-2` → jade. Five camera seat tones in voice phase. Deliver in five phases with a **mandatory stakeholder pause after each**. Visual Done = identity/PRD fidelity, not pixel-perfect prototype match. Prior 089/090/092 inform approach; this feature is the current apply under the design-ref PRD.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; CSS tokens (`nocturne.css`, `mesa-theme.css`). No Rust/API expected.  
**Primary Dependencies**: Existing `data-theme` toggle; self-hosted `@font-face`; Solid (`VoiceChannel`, `Sidebar`, `CameraGrid`, `Auth`, `Channel`, `Dialog`).  
**Storage**: Font woff2 + OFL under `frontend/public/fonts/`.  
**Testing**: Manual visual QA per [quickstart.md](./quickstart.md); contrast AA checklist; `npx tsc --noEmit`; regression smoke (Grade/Composition/screen share/user panel/theme).  
**Target Platform**: Modern browsers; light + dark.  
**Project Type**: Web app — frontend visual/CSS + VoiceChannel header markup for ⋯.  
**Performance Goals**: `font-display: swap`; no CDN fonts; speaking respects `prefers-reduced-motion`.  
**Constraints**: No Google Fonts CDN (024); no shell IA redesign; preserve 085 screen contain; danger red unchanged; `--font-place` only (clarify); accent-2→jade locked; `--radius-token: 20px` seats-only; pause after each delivery phase.  
**Scale/Scope**: Full-product token propagation + shell/voice/text/auth restyles + five seat tones + QA on uncovered screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado. Apply project norms from recent plans:

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | PASS | Token layers + small overflow menu; no new framework |
| II. CLI Interface | N/A | Visual/CSS feature |
| III. Test-First | PASS | Visual QA / quickstart + tsc; no formal TDD in spec |
| IV. Integration Testing | PASS | Cross-surface theme walkthrough + regression smoke |
| V. Observability | PASS | Focus/contrast/reduced-motion in contracts |
| VI. Versioning & Breaking | PASS | Visual identity change; no API break |
| VII. Simplicity | PASS | Recalculate existing tokens; `--font-place`; no Sidebar/CSS split |

**Post-design re-check**: PASS — contracts encode tokens, place type, header overflow, seats without unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/095-mesa-vela-reskin/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-tokens.md
│   ├── place-typography.md
│   ├── voice-header-overflow.md
│   └── seat-speaking.md
└── tasks.md              # Phase 2 (/speckit-tasks)
```

### Source Code (expected touchpoints)

```text
frontend/public/fonts/                 # Fraunces + Manrope woff2 + LICENSE
frontend/src/styles/nocturne.css       # accent ramps, accent-2 jade, fonts, --font-place, --radius-token
frontend/src/styles/mesa-theme.css     # .app / light skin; shell; seats; speaking; chat; e2ee jade
frontend/src/pages/VoiceChannel.tsx    # ⋯ overflow (edit scene + blur)
frontend/src/shell/Sidebar.tsx         # .font-place on server name; section label classes if needed
frontend/src/shell/ServerRail.tsx      # CSS-only
frontend/src/components/CameraGrid.tsx # seat tone classes (c-ember…c-umber)
frontend/src/pages/Channel.tsx         # composer/message hooks if needed
frontend/src/pages/Auth.tsx            # brand .font-place
frontend/src/i18n/…                    # overflow menu a11y strings if new
```

**Structure Decision**: Stay in Nocturne + Mesa layers; markup only for place type, overflow, and seat tone classes.

## Complexity Tracking

No constitution violations. Large visual surface inherent to reskin; mitigated by token-first phasing, mandatory review pauses, and dedicated QA phase.
