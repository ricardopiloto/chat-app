# Feature Specification: Mesa à Vela — Full-App Visual Reskin

**Feature Branch**: `095-mesa-vela-reskin`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: Apply the “Mesa à Vela” visual identity (amber + jade, Fraunces + Manrope, light/dark) across the whole application via the existing Nocturne + Mesa token system, following `docs/design-ref/prd-visual-refresh.md` token mapping and `docs/design-ref/ui-refactor-analysis.md` context; information architecture unchanged except the approved voice-header overflow; phased delivery starting with base tokens.

**Source of truth (visual / tokens)**: [docs/design-ref/prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md)  
**Context (what not to redo structurally)**: [docs/design-ref/ui-refactor-analysis.md](../../docs/design-ref/ui-refactor-analysis.md)  
**Prototype inspiration**: [docs/design-ref/mesa-ui-prototype.html](../../docs/design-ref/mesa-ui-prototype.html)  
**Related prior work**: [089-mesa-a-vela-reskin](../089-mesa-a-vela-reskin/), [090-revert-mesa-vela](../090-revert-mesa-vela/), [092-mesa-vela-fidelity](../092-mesa-vela-fidelity/) (prior attempts / revert — this feature re-applies identity under the current PRD).

---

## Clarifying what this feature is (and is not)

| Stakeholder intent | Implication |
|--------------------|-------------|
| New identity “Mesa à Vela” everywhere | **Reskin** of the whole product UI via design tokens — shell, voice, text, auth, and uncovered screens |
| Follow PRD token mapping | Recalculate Nocturne ramps + Mesa skin tokens from PRD seeds; **do not** invent a parallel style system or paste prototype CSS wholesale |
| Information architecture stays | Server rail → sidebar → channel header → content ± members panel **unchanged** |
| One approved chrome exception | Voice channel header: move **Editar cena** and blur into an overflow **⋯** menu (prototype-approved) |
| All current features keep working | Channels, scenes/grid, E2EE, voice roster, mentions, search, notifications, screen share, etc. — **behavior preserved** |
| Self-hosted fonts only | Fraunces + Manrope like Inter today — **no external font CDN** |
| Phased delivery | Tokens → shell → voice → text/auth → QA on non-mocked screens; review gate after each phase |

**Out of scope** (per PRD §2 and analysis §5.3–5.5 unless a later feature asks):

- Splitting `Sidebar.tsx` or modularizing `mesa-theme.css` into domain files  
- Collapsing sidebar sections, cross-server presence popover, multi-scene UI revive  
- Reintroducing retired stage mode  
- Redesigning settings / members / roles / invite flows beyond token inheritance  

## Clarifications

### Session 2026-09-11

- Q: Âmbito do Fraunces? → A: Novo **`--font-place`** (ou equivalente) só nos 3 contextos de lugar — título de canal de voz, nome do servidor, marca Auth; **não** trocar `--font-heading` global (Option B).
- Q: Jade / segurança vs `--color-accent-2`? → A: **Remapear `--color-accent-2` (+ rampa) para jade** e usar no papel E2EE/segurança (Option A); auditoria: sem uso TSX de `.tag-accent-2`.
- Q: Critério de fidelidade visual vs protótipo? → A: **Identidade + PRD** (tokens/chrome); coerência global, **não** pixel-perfect em todos os ecrãs (Option B).
- Q: Pausas de revisão entre fases? → A: Pausa obrigatória **após cada** fase 1–5 antes de avançar (Option A).
- Q: Tons dos assentos de câmara? → A: Incluir os **5 tons** (ember/plum/slate/wine/umber) + nameplate/anel na **Fase 3** (Option A).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Product looks like Mesa à Vela in light and dark (Priority: P1)

As a Mesa user, I want the app’s colors and type to match the Mesa à Vela identity (warm parchment, amber accent, jade for security cues, Manrope UI + Fraunces for “place” names) in both light and dark themes, so the product feels coherent and distinct from the old blurple look.

**Why this priority**: Core identity delivery.

**Independent Test**: Toggle light/dark on shell and main screens; compare to PRD palette intent (no leftover blurple-as-primary accent; parchment warmth on surfaces/text).

**Acceptance Scenarios**:

1. **Given** dark theme, **When** I view rail, sidebar, and main panes, **Then** surfaces and primary accent match Mesa à Vela dark seeds (not the previous blurple primary).
2. **Given** light theme, **When** I toggle theme, **Then** light parchment/amber/jade appear without a lasting flash of the old palette.
3. **Given** settings, members/roles, dialogs, and toasts, **When** I open them after the reskin, **Then** they look consistent with the new identity by inheriting shared tokens (no separate redesign required).

---

### User Story 2 - Place names use Fraunces; UI stays utility type (Priority: P1)

As a Mesa user, I want voice channel titles, server names, and the Auth brand “Mesa” to read as “place” typography (Fraunces), while ordinary UI (text channel names, dialog titles, settings) stays in the utility typeface (Manrope, with Inter available as fallback), so place vs utility remain distinct.

**Why this priority**: Explicit PRD typography role split; avoids accidental Fraunces everywhere.

**Independent Test**: Voice header title, sidebar server name, Auth brand → Fraunces; `#geral`-style text channel labels and a dialog title → not Fraunces.

**Acceptance Scenarios**:

1. **Given** a voice channel is open, **When** I read the voice header title, **Then** it uses place typography (Fraunces).
2. **Given** the sidebar shows the server name and Auth shows the brand, **When** I inspect those labels, **Then** they use place typography.
3. **Given** a text channel name and a modal dialog title, **When** I inspect them, **Then** they do **not** use Fraunces by accident.

---

### User Story 3 - Voice header declutter without losing controls (Priority: P1)

As a voice participant or scene admin, I want Editar cena and camera blur behind a **⋯** overflow, while title/occupancy, Composition/Grade, Members, and E2EE stay visible, so the header is calmer without removing capabilities.

**Why this priority**: Only approved structural/chrome change.

**Independent Test**: Open voice channel → primary chrome visible; open ⋯ → Editar cena (when allowed) and blur (when in call) reachable and functional.

**Acceptance Scenarios**:

1. **Given** a voice channel view, **When** the header is at rest, **Then** I see title/occupancy, Composition/Grade, Members, ⋯, and E2EE—not Editar cena or blur as always-visible peers.
2. **Given** I open ⋯, **When** I choose Editar cena or change blur (as applicable), **Then** those actions work as before the reskin.
3. **Given** E2EE state, **When** I look at the header, **Then** the security chip remains visible (not hidden inside ⋯) and uses the jade/security visual role.

---

### User Story 4 - Speaking ring and camera seats match identity (Priority: P2)

As a call participant, I want the speaking indicator and camera seats to use the Mesa à Vela visual language (amber speaking cue; seat framing per PRD), including a non-animated speaking state when I prefer reduced motion.

**Why this priority**: Voice-stage identity; a11y requirement.

**Independent Test**: Someone speaks → amber speaking treatment; OS/browser reduced motion → static (non-pulsing) speaking cue; seats readable in Composition/Grade.

**Acceptance Scenarios**:

1. **Given** a participant is speaking, **When** reduced motion is off, **Then** an amber speaking treatment is visible on the appropriate surface(s).
2. **Given** `prefers-reduced-motion: reduce`, **When** someone is speaking, **Then** speaking state remains visible **without** pulse animation.
3. **Given** camera seats in Grade/Composition, **When** I view them, **Then** seats use the **five** character seat tones from the PRD/prototype family, with nameplate treatment and amber speaking cue as applicable—without breaking attach/video behavior.

---

### User Story 5 - Text chat and Auth inherit the skin (Priority: P2)

As a user in text chat or on the login screen, I want messages, composer, and Auth to use the new skin while keeping the existing layouts (including Auth’s two-column structure).

**Why this priority**: Completes app-wide identity beyond voice/shell.

**Independent Test**: Send a message, use composer, open Auth — visuals match Mesa à Vela; flows unchanged.

**Acceptance Scenarios**:

1. **Given** a text channel, **When** I view messages and the composer, **Then** styling matches the new identity (pill composer / circular send as in PRD intent) without changing send/attach/mention behavior.
2. **Given** the Auth screen, **When** I view it, **Then** tokens/type update but the existing two-column structure remains.

---

### Edge Cases

- Hardcoded colors outside tokens: must be moved onto the correct token—not one-off hex painted on the component.
- Focus rings on amber primary buttons must remain visible (AA / keyboard).
- Danger/alert red stays danger semantics (not recolored to amber).
- Camera `--stage`/`--tile` stay dark in light theme (existing Mesa rule; PRD confirms).
- Screen-share / Grade / spotlight / user-panel behaviors from recent features keep working; only visuals change unless US3 says otherwise.
- Fonts fail to load: readable fallbacks (system / Inter) still usable.
- Large regression surface: QA must include non-prototype screens (settings, members, dialogs, toasts).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST present the Mesa à Vela color identity (amber primary accent, parchment surfaces/text, jade security role, light and dark) across the application by updating the **existing** Nocturne + Mesa token layers per [prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md) §3–§4—not a parallel CSS system.
- **FR-002**: Primary accent ramps MUST be recalculated with the same OKLCH / lightness approach already used in Nocturne (amber seed), not arbitrary hand-pasted nine-step hex lists disconnected from that method.
- **FR-003**: Mesa skin tokens (`--panel`, `--stage`, `--tile`, and related `.app` / light-theme vars listed in the PRD) MUST be recalculated for both themes; danger tokens MUST remain alert-red semantics.
- **FR-004**: Fraunces and Manrope MUST be available as **self-hosted** fonts (same operational pattern as Inter); external font CDNs MUST NOT be used.
- **FR-005**: Manrope MUST be the default UI body typeface; Inter MAY remain in the stack as fallback. Fraunces MUST be applied **only** via a dedicated **`--font-place`** (or equivalent class) on: voice channel title, server name, and Auth brand “Mesa”. **`--font-heading` MUST NOT** be globally switched to Fraunces (dialog titles, card titles, settings headings stay on the utility/heading stack without Fraunces).
- **FR-006**: Information architecture MUST NOT change (rail, sidebar nesting, channel header region, content, members panel). The sole approved chrome exception is FR-007.
- **FR-007**: Voice channel header MUST move **Editar cena** and the blur control into an overflow **⋯** menu; title/occupancy, Composition/Grade, Members, and E2EE chip MUST remain always visible when applicable.
- **FR-008**: Existing product behaviors MUST continue to work after the reskin (create/edit channels, scenes/grid, E2EE, voice roster, mentions, search, notifications, screen share, call controls, etc.).
- **FR-009**: Speaking indication MUST use an amber visual treatment; under reduced motion it MUST remain perceivable without pulse animation.
- **FR-010**: Camera seats MUST use the **five** seat tone family from the PRD (ember/plum/slate/wine/umber) plus nameplate treatment; character-frame radius MAY use a dedicated token (PRD `--radius-token` intent) without changing generic card radii system-wide.
- **FR-011**: Jade MUST serve the security/E2EE visual role by **remapping** Nocturne **`--color-accent-2`** (and its ramp) to the jade seed palette. E2EE chip and related security cues MUST consume that remapped accent-2 (or semantic aliases that point at it). A separate `--color-security` token is **not** required unless a later audit finds new conflicting consumers.
- **FR-012**: Theme toggle MUST keep the existing light/dark mechanism; only token values change.
- **FR-013**: UI text and icon contrast MUST meet WCAG AA (4.5:1 normal text, 3:1 large text/icons) in both themes before the feature is Done.
- **FR-014**: Hardcoded colors found outside the token system during the reskin MUST be corrected to use the appropriate token.
- **FR-015**: Delivery MUST follow PRD phases: (1) base tokens/fonts, (2) shell, (3) voice channel, (4) text + Auth, (5) QA coverage on non-mocked screens + contrast. Implementers MUST **pause for stakeholder review after each phase** before starting the next.
- **FR-017**: Acceptance of visual Done is **identity and PRD chrome fidelity** (palette, place typography, approved voice-header overflow, coherent uncovered screens via tokens)—**not** pixel-perfect matching of the HTML prototype on every screen.

### Key Entities

- **Design token layers**: Nocturne (generic system) and Mesa skin (product mapping on `.app`).
- **Place typography**: Fraunces reserved for place names (voice title, server name, Auth brand).
- **Utility typography**: Manrope (+ Inter fallback) for general UI.
- **Security accent (jade)**: E2EE / security chip via remapped `--color-accent-2` (+ ramp).
- **Voice header overflow**: ⋯ menu containing Editar cena + blur.
- **Camera seat tones**: Five-tone family (ember/plum/slate/wine/umber) for character frames in Phase 3.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a side-by-side review of **10** representative screens (including ≥2 non-prototype screens such as settings or members), **10/10** show Mesa à Vela **identity** (amber/jade parchment, place type where required) in both themes with no primary blurple accent remaining—judged as PRD/identity match, **not** pixel-perfect prototype clone.
- **SC-002**: Voice title, server name, and Auth brand use Fraunces in **100%** of checks; a sampled dialog title and text-channel label do **not** use Fraunces in **100%** of checks.
- **SC-003**: Voice header rest state hides Editar cena and blur behind ⋯ in **100%** of checks; both remain reachable and functional from ⋯ when applicable.
- **SC-004**: With reduced motion enabled, speaking state is visible without pulse in **100%** of checks.
- **SC-005**: Contrast spot-checks for body text, muted text, amber-as-small-text/icons, and jade chip text pass AA in both themes before Done (documented checklist).
- **SC-006**: Critical flows (join voice, Composition/Grade toggle, send message, members panel, light/dark toggle) succeed in a manual pass after each completed phase.
- **SC-008**: In Grade/Composition with multiple camera seats, reviewers can distinguish the **five-tone** seat family (or clear assignment across seats) in **100%** of voice-phase checks; speaking ring still meets SC-004.

## Assumptions

- PRD hex seeds and token table in [prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md) are the mapping authority; prototype HTML is inspirational, not a CSS dump target.
- **Place vs utility type (PO locked 2026-09-11)**: `--font-place` for the three place contexts only; do not globally set `--font-heading` to Fraunces.
- **Jade / secondary accent (PO locked 2026-09-11)**: Remap `--color-accent-2` (+ ramp) to jade; use for E2EE/security. Pre-implement audit found no TSX consumers of `.tag-accent-2`.
- Inter remains self-hosted as fallback; Manrope becomes default UI.
- Analysis items (Sidebar split, CSS file split, section collapse, presence popover) stay out of this feature.
- User-panel layout behavior as currently shipped (including any stacked/fixed-panel work) is **not** redesigned here—only token-level restyle unless it already matches the skin.
- Visual Done bar (PO locked): identity + PRD chrome, not pixel-perfect prototype replication.
- Phase gates (PO locked): mandatory review pause after **each** of phases 1–5.
- Phase 1 (base tokens + fonts) may have limited “visible polish” until shell/components consume tokens; review still validates ramp/fonts/skin vars before Phase 2.
- No backend work expected; if discovered, justify and minimize per FR-016.

## Delivery phases (for plan/tasks)

| Phase | Outcome |
|-------|---------|
| 1 | Nocturne amber ramp + parchment system tokens; Mesa `.app` skin vars; self-hosted Fraunces/Manrope; remap `--color-accent-2` → jade |
| 2 | Shell: rail, sidebar, top bar; light/dark verified on chrome |
| 3 | Voice: header ⋯, **five seat tones** + nameplate, speaking ring + reduced motion |
| 4 | Text channel + Auth restyle |
| 5 | QA: settings/members/dialogs/toasts + AA contrast both themes |

**Stakeholder note**: Implementation MUST pause for review after **each** phase (1–5) before continuing.
