# Research: 095-mesa-vela-reskin

## R1 — Token recalc vs prototype CSS paste

**Decision**: Recalculate Nocturne accent/surface/text ramps (OKLCH / existing lightness scale) from Mesa à Vela hex seeds in [prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md); update Mesa `.app` / `[data-theme=light]` aliases. Do **not** dump `mesa-ui-prototype.html` CSS into the app.

**Rationale**: PRD §0; FR-001/002/017 (identity fidelity, not pixel dump).

**Alternatives considered**: Find-replace blurple hex — brittle. Parallel theme stylesheet — fights `data-theme`.

## R2 — Accent-2 → jade (locked)

**Decision**: Remap `--color-accent-2` (+ `--color-accent-2-100..900`) to jade seeds. Point E2EE/security chrome (e.g. `.e2ee-chip`) at jade/accent-2 tokens. No separate `--color-security` unless a later audit finds conflicting consumers.

**Rationale**: Clarify Option A; pre-plan audit 2026-09-11: accent-2 / `.tag-accent-2` only in `nocturne.css`, **no TSX usage**. Note: E2EE chip may currently use **primary** accent—remap alone is insufficient; explicitly retarget chip styles to jade.

**Alternatives considered**: Always add `--color-security` — unnecessary given audit. Leave E2EE on amber — violates jade semantic role.

## R3 — Place typography (`--font-place`) (locked)

**Decision**: Add `--font-place: "Fraunces", …` + class (e.g. `.font-place`) only on voice channel title, sidebar server name, Auth brand. `--font-body` → Manrope with Inter fallback. Do **not** set `--font-heading` to Fraunces.

**Rationale**: Clarify Option B; FR-005; PRD §5.

**Alternatives considered**: Global `--font-heading` = Fraunces — rejected by PO.

## R4 — Font loading

**Decision**: Self-host Fraunces (400/500/600) and Manrope (400/500/600/700/800) as woff2 under `frontend/public/fonts/`, `@font-face` mirroring Inter, `font-display: swap`, OFL licenses. Keep Inter. No Google Fonts CDN.

**Rationale**: FR-004; 024-security-hardening.

**Alternatives considered**: CDN (prototype) — forbidden.

## R5 — Voice header overflow

**Decision**: Only structural chrome change: Editar cena + blur inside `⋯`; keep Composição/Grade, Members, E2EE always visible.

**Rationale**: FR-007; PRD §6/§9.3; analysis §5.1.

**Alternatives considered**: Hide E2EE in overflow — rejected. Keep always-visible blur — conflicts with approved prototype.

## R6 — Seats, speaking, radius (five tones required)

**Decision**:
- Camera seats: **five** tone gradients (ember/plum/slate/wine/umber from prototype) + nameplate; `--radius-token: 20px` on seat frames only.
- Speaking: amber treatment reusing 033/036 state; static under `prefers-reduced-motion: reduce`.
- Screen Grade tiles: preserve 085 contain (no face-seat crop on screens).

**Rationale**: Clarify Option A; FR-009/010; SC-008.

**Alternatives considered**: Token-only seats without five tones — rejected by PO. Global 20px radius — no.

## R7 — Delivery phasing + review gates

**Decision**: Phases 1→5 as in spec Delivery table. **Mandatory pause for stakeholder review after each phase** before starting the next.

**Rationale**: Clarify Option A; FR-015. Stakeholder originally asked to stop after Phase 1; clarify expanded to every phase.

**Alternatives considered**: Continuous 1–5 — rejected. Pause only after Phase 1 — superseded by clarify A.

## R8 — Relationship to 089/090/092

**Decision**: Treat 095 as the current apply under `docs/design-ref/prd-visual-refresh.md`. Reuse lessons from 089 research/contracts; do not assume 089 code remains (090 reverted). Preserve shipped behaviors (screen share, Grade, user panel as currently implemented)—visual restyle only except FR-007.

**Rationale**: Spec related-prior-work; FR-008.

## R9 — Hardcoded colors

**Decision**: During each phase, grep for hex/`rgb` outside token files in touched surfaces; move to tokens (FR-014).

**Rationale**: Stakeholder rule; prevents parallel ad-hoc colors.
