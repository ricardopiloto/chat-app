# Implementation Plan: Mesa à Vela — Visual Identity Renovation

**Branch**: `089-mesa-a-vela-reskin` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/089-mesa-a-vela-reskin/spec.md`  
**PRD**: [docs/layout-review-01.md](../../docs/layout-review-01.md)

## Summary

Replace blurple/Inter-only chrome with the **Mesa à Vela** identity (amber + jade parchment, Fraunces place type + Manrope UI, light/dark) by recalculating **Nocturne** + **Mesa** design tokens and restyling shell/voice/text/auth surfaces—**without** changing information architecture. One intentional chrome change: move **Editar cena** + blur into a voice-header `⋯` overflow. Self-host Fraunces/Manrope woff2 (keep Inter as fallback). Delivery follows PRD §11 phasing: tokens → shell → voice → text/auth → QA.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; CSS design tokens (`nocturne.css`, `mesa-theme.css`). No Rust/API changes.  
**Primary Dependencies**: Existing `data-theme` toggle; self-hosted `@font-face`; Solid components (`VoiceChannel`, `Sidebar`, `CameraGrid`, `Auth`, `Channel`, `Dialog`).  
**Storage**: Font files under `frontend/public/fonts/` (woff2 + OFL licenses).  
**Testing**: Manual visual QA per [quickstart.md](./quickstart.md); contrast AA checklist; `npx tsc --noEmit`; regression smoke (Grade/Composition/screen share/user panel/theme toggle).  
**Target Platform**: Modern browsers; light + dark themes.  
**Project Type**: Web app — frontend visual/CSS + one VoiceChannel header markup change.  
**Performance Goals**: `font-display: swap`; no CDN font latency; speaking animation respects `prefers-reduced-motion`.  
**Constraints**: No Google Fonts CDN (024); no shell IA redesign; screen tiles keep 085 contain rules; danger red unchanged; accent-2→jade only after usage audit (FR-010); `--radius-token: 20px` seats-only (FR-013).  
**Scale/Scope**: Full-product token propagation (~80 prior specs’ shared chrome) + targeted seat/header/composer restyles.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado. Apply project norms from recent plans:

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | PASS | Token layers + small UI helpers (overflow menu); no new framework |
| II. CLI Interface | N/A | Visual/CSS feature |
| III. Test-First | PASS | Visual QA / quickstart + tsc; no formal TDD required by spec |
| IV. Integration Testing | PASS | Cross-surface theme walkthrough + regression smoke |
| V. Observability | PASS | Focus/contrast/reduced-motion called out in contracts |
| VI. Versioning & Breaking | PASS | Visual identity change expected; no API break |
| VII. Simplicity | PASS | Recalculate existing tokens; `--font-place` instead of global heading hijack; no Sidebar split |

**Post-design re-check**: PASS — contracts encode token + place-type + header overflow without unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/089-mesa-a-vela-reskin/
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
frontend/src/styles/nocturne.css       # accent ramps, fonts, --font-place, --radius-token
frontend/src/styles/mesa-theme.css     # .app / light skin; shell; seats; speaking; chat; e2ee jade
frontend/src/pages/VoiceChannel.tsx    # ⋯ overflow (edit scene + blur)
frontend/src/shell/Sidebar.tsx         # place class on server name; section label classes if needed
frontend/src/shell/ServerRail.tsx      # CSS-only (classes already present)
frontend/src/components/CameraGrid.tsx # seat tone classes if markup needed
frontend/src/pages/Channel.tsx         # composer/message class hooks if needed
frontend/src/pages/Auth.tsx            # brand place typography class
frontend/src/i18n/…                    # overflow menu a11y strings if new
```

**Structure Decision**: Stay in existing Nocturne + Mesa layers; point fixes only where place type / overflow / seats need markup.

## Complexity Tracking

No constitution violations. Large visual surface is inherent to a product reskin; mitigated by token-first phasing and dedicated QA (PRD §8.4 / §10).
