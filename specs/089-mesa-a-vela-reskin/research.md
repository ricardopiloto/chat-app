# Research: 089-mesa-a-vela-reskin

## R1 — Token recalc vs prototype CSS paste

**Decision**: Recalculate Nocturne accent/surface/text ramps (OKLCH / existing lightness scale) from Mesa à Vela hex seeds; update Mesa `.app` / `[data-theme=light]` aliases. Do **not** dump `mesa-ui-prototype.html` CSS into the app.

**Rationale**: PRD §0 — Nocturne is a documented system (`color-mix`, accent ramps, self-hosted fonts). Prototype was written in a vacuum. Spec FR-001.

**Alternatives considered**: Find-replace blurple hex everywhere — brittle; misses `color-mix` and ramp steps. New parallel CSS theme file — duplicates system, fights `data-theme`.

## R2 — Accent-2 → jade (audit path)

**Decision**: At implement start, re-run `grep` for `color-accent-2` / `tag-accent-2` in product TS/TSX. Pre-plan audit (2026-09-10): **no TS/TSX usage**; only Nocturne `.tag-accent-2` CSS. **Preferred path**: remap `--color-accent-2` (+ ramp) to jade seeds. Introduce `--color-security` only if audit later finds meaningful production use of lavender accent-2.

**Rationale**: FR-010 / clarification; PRD §4.3.

**Additional finding**: `.e2ee-chip` today uses **primary** `--color-accent-*` (blurple), not accent-2. After jade remap (or new security token), **point E2EE/security chrome at jade tokens**—remap alone does not jade the chip.

**Alternatives considered**: Always add `--color-security` — extra tokens without need if accent-2 unused. Leave E2EE on amber — violates jade semantic role in PRD.

## R3 — Place typography (`--font-place`)

**Decision**: Add `--font-place: "Fraunces", …` and apply via a dedicated class (e.g. `.font-place`) only on: voice channel title, sidebar server name, Auth brand. Set `--font-body` / default UI to Manrope with Inter fallback; do **not** globally set `--font-heading` to Fraunces.

**Rationale**: FR-003/004; PRD §5 — role (place vs utility), not heading level. Global heading swap would Fraunces dialog/settings titles.

**Alternatives considered**: Reuse `--font-heading` = Fraunces — rejected by clarification and PRD §5.

## R4 — Font loading

**Decision**: Self-host Fraunces (400/500/600) and Manrope (400/500/600/700/800) as woff2 under `frontend/public/fonts/`, `@font-face` mirroring Inter, `font-display: swap`, OFL license files. Keep existing Inter files. No Google Fonts CDN.

**Rationale**: FR-002; 024-security-hardening; Inter fallback clarification.

**Alternatives considered**: CDN (prototype) — forbidden. Variable fonts only — optional later; static weights match PRD list.

## R5 — Voice header overflow

**Decision**: Only structural chrome change: hide free-standing Editar cena + blur select; expose them inside a `⋯` menu. Keep Composição/Grade, Members, E2EE always visible.

**Rationale**: FR-005; PRD §1/§6/§9.3. Current `VoiceChannel.tsx` still shows edit button + blur `<select>` in the header.

**Alternatives considered**: Keep always-visible blur (081) — conflicts with approved prototype. Move E2EE into overflow — rejected by FR-005.

## R6 — Seats, speaking, radius

**Decision**:
- Camera seats: five tone gradients + nameplate; `--radius-token: 20px` on seat frames only; keep `--radius-sm/md/lg`.
- Speaking: amber treatment reusing 033/036 state; static border under `prefers-reduced-motion: reduce`.
- Screen Grade tiles: do not apply face crop/seat “portrait” zoom; preserve 085 contain + letterbox.

**Rationale**: FR-006/007/013; regression matrix for 082–086.

**Alternatives considered**: Global 20px radius — clarification forbids. New speaking state machine — unnecessary.

## R7 — Delivery phasing

**Decision**: Implement in PRD §11 order inside one feature: (1) tokens+fonts → (2) shell → (3) voice header/seats/speaking → (4) text+auth → (5) uncovered screens QA + contrast.

**Rationale**: Tokens unlock everything; voice header is the only behavior change; uncovered screens inherit tokens and need a dedicated pass (FR-012).

**Alternatives considered**: Big-bang CSS dump — higher regression risk. Split into multiple feature ids — possible later; out of scope for this plan’s single feature directory.

## R8 — Accent-2 audit (implement 2026-09-10)

**Decision**: Remap `--color-accent-2` (+ ramp) to jade. No TS/TSX references to `color-accent-2` / `tag-accent-2`; only Nocturne `.tag-accent-2` CSS. Point `.e2ee-chip` at jade tokens.

**Rationale**: FR-010 preferred path; research R2.

**Alternatives considered**: `--color-security` — not needed after audit.
