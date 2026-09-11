# Research: 090-revert-mesa-vela

## R1 — Full vs partial revert

**Decision**: Full product rollback of 089 outcomes (tokens, fonts, voice-header chrome, seats, speaking/E2EE skin, composer chrome), per spec assumptions.

**Rationale**: User ask and FR-001–FR-008 leave no selective keep of amber or `⋯`.

**Alternatives considered**: Keep `⋯` header but restore colors only — rejected by FR-003 / “todas as alterações.”

## R2 — How to restore pre-089 baselines

**Decision**: Restore known pre-089 token values (blurple `#9184d9` accent ramp, lavender accent-2, cool bg/surface/text, Inter-only `--font-heading`/`--font-body`, Mesa `.app` / light aliases from pre-089). Use 089 gap-analysis “Today” column + reverse of 089 implement hunks as the source of truth when git does not isolate 089 cleanly.

**Rationale**: Working tree mixes 082–089; `git checkout HEAD -- mesa-theme.css` would destroy later feature CSS. Surgical restore is safer.

**Alternatives considered**: `git restore` entire style files from last release tag — too coarse (would drop 082–088 CSS).

## R3 — Voice header

**Decision**: Remove `⋯` overflow state/panel; put Editar cena button and blur `<select>` back in the default header row (pre-089 order relative to Members / E2EE as before 089). Remove `voice.headerMore` i18n keys.

**Rationale**: FR-003 / US2.

**Alternatives considered**: Keep empty overflow control — fails SC-002.

## R4 — Fonts & assets

**Decision**: Remove Manrope/Fraunces `@font-face`, `--font-place`, `.font-place` usages; set fonts back to Inter; delete `frontend/public/fonts/Manrope*` and `Fraunces*` (+ licenses). Keep Inter files.

**Rationale**: FR-002, FR-008; unused assets preferred removed.

**Alternatives considered**: Leave files unused on disk — allowed but wasteful; spec prefers cleanup.

## R5 — Seats, speaking, E2EE, composer, sidebar labels

**Decision**:
- Remove `seatToneFor` / `grade-cam-tile` / seat CSS / `--radius-token` / seat gradient variables.
- Restore speaking aura colors to pre-089 accent-based treatment (not amber-specific 089 restyle); keep reduced-motion static path if it already existed or was only color-changed.
- Restore `.e2ee-chip` to pre-089 (primary accent wash, not jade).
- Restore composer input radius/send button to pre-089 (not pill + circular amber fill).
- Restore `.sidebar-section` uppercase tracked label style if 089 changed it to weight-700 / no uppercase.

**Rationale**: FR-004–FR-006, US3.

**Alternatives considered**: Leave seat classes inert — fails “absent styling” acceptance.

## R6 — Preserve non-089 work

**Decision**: Explicit regression checklist for screen share, Grade/spotlight, user-panel stack, unload leave, clear ended screen tile; do not revert `liveClient` unsubscribe, occupancy screen_on, etc.

**Rationale**: FR-007 / SC-004–SC-005.

## R7 — Clarification skipped

**Decision**: Proceed to plan without `/speckit-clarify`; spec already states full rollback with no open `[NEEDS CLARIFICATION]`.

**Rationale**: Ambiguity low; user invoked plan directly. Downstream risk: if they later want to keep `⋯`, that would be a scope change.
