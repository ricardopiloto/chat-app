# Feature Specification: Revert Mesa à Vela Reskin

**Feature Branch**: `090-revert-mesa-vela`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: “Crie uma spec … para reverter todas as alterações feitas em specs/089-mesa-a-vela-reskin/”

**Revert target**: [089-mesa-a-vela-reskin](../089-mesa-a-vela-reskin/) — visual identity renovation (“Mesa à Vela”) and its approved voice-header chrome change.

---

## Clarifying what this feature is (and is not)

| Intent | Implication |
|--------|-------------|
| Undo **all** product outcomes of 089 | Restore the **pre–Mesa à Vela** look and the **pre-089 voice header** (Editar cena + blur visible again)—not a partial theme tweak |
| Keep features delivered outside 089 | Screen share, Grade/spotlight, user-panel stack, unload leave, clear ended screen tile, etc. **stay** |
| Not a new design direction | No alternate palette or new typography program—return to the prior blurple / Inter product identity |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Product looks like pre–Mesa à Vela again (Priority: P1)

As a Mesa user, I want the app’s colors, surfaces, and default typography to match the identity that existed **before** the Mesa à Vela renovation, in both light and dark themes, so the amber/parchment/jade look is gone as the steady state.

**Why this priority**: Core of “revert all 089 visual changes.”

**Independent Test**: Toggle light/dark on shell, voice, and text; confirm primary accent reads as the prior blurple-led chrome (not amber), surfaces are cool nocturne greys (not parchment), and UI type is Inter-led (not Manrope/Fraunces as the product face).

**Acceptance Scenarios**:

1. **Given** any primary screen in dark theme, **When** I view accents and panels, **Then** the steady state matches the pre-089 identity (blurple primary accent; cool greys)—not Mesa à Vela amber/parchment.
2. **Given** the same screens, **When** I switch to light theme, **Then** light theme also matches the pre-089 light identity—not parchment/ink Mesa à Vela.
3. **Given** shared controls (primary actions, focus, segmented controls), **When** I use them, **Then** they inherit the restored pre-089 accent family consistently.

---

### User Story 2 - Voice header chrome restored (Priority: P1)

As a participant in a voice channel, I want **Editar cena** (when I have that affordance) and **blur** available again in the default header row—not only inside a `⋯` overflow—matching the pre-089 header.

**Why this priority**: 089’s only intentional chrome/IA change; “revert all” includes it.

**Independent Test**: Open a voice channel; confirm default header shows mode switch, Members, E2EE, and free-standing Editar cena / blur as before 089; `⋯` overflow for those controls is gone (or no longer required for those actions).

**Acceptance Scenarios**:

1. **Given** a voice channel view, **When** the header is at rest, **Then** Editar cena (when allowed) and blur are reachable without opening a `⋯` menu.
2. **Given** I change blur or open scene edit from the restored controls, **When** I use them, **Then** they still work as before 089.
3. **Given** Grade vs Composition and screen-share Grade rules from later features, **When** I switch modes after the revert, **Then** those behaviors still work (revert must not break non-089 work).

---

### User Story 3 - Place type, seats, and chat chrome undone (Priority: P2)

As a user, I no longer want Fraunces “place” titles, five-tone camera seat skins, or the Mesa à Vela chat composer treatment; those surfaces should match the pre-089 presentation while keeping message and call functionality.

**Why this priority**: Completes visual rollback of 089-specific surface treatments beyond global tokens.

**Independent Test**: Check voice title / server name / Auth brand (no Fraunces place face as product default), Grade camera tiles (no 089 seat-tone system), text composer (pre-089 shape/send treatment).

**Acceptance Scenarios**:

1. **Given** voice title, sidebar server name, and Auth brand, **When** I view them, **Then** they use the pre-089 typography approach (Inter-led UI)—not Fraunces as a distinct place face required by 089.
2. **Given** Grade with cameras, **When** I view tiles, **Then** 089 seat-tone / nameplate styling is absent; video still displays correctly; screen tiles still follow post-085 “show full frame” rules.
3. **Given** a text channel, **When** I view the composer, **Then** it matches the pre-089 composer chrome (not the 089 pill + circular-send look), and sending messages still works.

---

### Edge Cases

- Hard refresh / first paint: steady state must not remain Mesa à Vela after revert ships.
- Speaking indicators: restore pre-089 speaking treatment (not amber Mesa à Vela pulse styling), still respecting reduced-motion needs already present.
- E2EE / security chip: restore pre-089 chip styling (not jade-as-security from 089).
- Font assets added for Manrope/Fraunces: product must not depend on them after revert; unused assets may be removed as part of cleanup.
- Specs/docs that describe Mesa à Vela as current product identity: product behavior wins; documentation updates can note the revert without rewriting all of 089’s historical specs.
- Must not regress 082–088 (screen share, Grade layout, spotlight, user-panel stack, unload leave, clear ended screen tile).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST present the **pre–Mesa à Vela (pre-089)** color identity in **both** light and dark themes—prior primary accent family and cool surfaces—not amber/jade parchment as the steady state.
- **FR-002**: Default UI typography MUST return to the **pre-089 Inter-led** system; Mesa à Vela Manrope-as-default and Fraunces-as-place MUST NOT remain the product’s required faces.
- **FR-003**: The voice channel header MUST restore **Editar cena** (when allowed) and **blur** as default-header controls (not exclusively behind a `⋯` overflow introduced by 089).
- **FR-004**: Camera seat treatments introduced by 089 (multi-tone seat skins / nameplate styling / seat-only radius token as a product requirement) MUST be removed so Grade camera tiles match pre-089 presentation, without breaking video attach or screen-share tile rules from later features.
- **FR-005**: Text-channel chrome changes introduced by 089 (pill composer and circular send treatment) MUST be reverted to the pre-089 composer presentation.
- **FR-006**: Speaking indication and E2EE/security chip styling MUST return to their pre-089 visual treatments (not 089 amber speaking / jade security chip as the product look).
- **FR-007**: Revert MUST NOT remove or break non-089 feature behavior (including screen share, unified Grade, spotlight layout, user-panel stacking, unload leave, and clearing ended screen tiles).
- **FR-008**: After revert, the product MUST NOT require Mesa à Vela font files (Manrope/Fraunces) to render correctly; Inter (or the pre-089 stack) MUST suffice.
- **FR-009**: Danger/alert semantics that existed before 089 MUST remain intact (revert is identity rollback, not a danger-color redesign).

### Key Entities

- **Pre-089 visual identity**: Blurple-led accent, cool nocturne/Mesa surfaces, Inter-led UI—the restored target state.
- **089 Mesa à Vela identity**: Amber/jade parchment + Manrope/Fraunces + header overflow + seat/composer treatments—to be fully undone in the product.
- **Preserved later features**: Behavioral and layout work from specs other than 089 that must survive the revert.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a themed walkthrough (dark + light), 100% of reviewers agree the steady-state chrome no longer reads as Mesa à Vela (amber/parchment/jade-led); it matches the pre-089 identity.
- **SC-002**: 100% of reviewers confirm voice header exposes Editar cena (when allowed) and blur without requiring the 089 `⋯` overflow for those actions.
- **SC-003**: 100% of checks confirm Fraunces place-face / Manrope-default are not required for correct UI rendering after revert.
- **SC-004**: Grade cameras and screen tiles still show correctly in 100% of smoke runs; screen “full frame” behavior from post-085 work remains.
- **SC-005**: Regression smoke for non-089 work (screen share start/stop clear, user-panel controls, theme toggle, Grade ↔ Composition) passes in 100% of runs.
- **SC-006**: Text composer matches pre-089 chrome in 100% of reviewer checks while send still works.

## Assumptions

- “Reverter todas as alterações” means **full product rollback** of 089 outcomes (tokens, fonts, voice-header chrome, seats, speaking/E2EE chip skin, chat composer chrome)—not a selective keep of amber or of the `⋯` menu.
- Pre-089 baseline is the product state immediately before 089 shipped (blurple/Inter era with features 082–088 already present as applicable).
- Historical docs under `specs/089-…` may remain as a record of the abandoned direction; this feature’s success is measured on **running product** behavior and appearance.
- Removing unused Mesa à Vela font files from distribution is allowed and preferred once they are unused.
- No new visual redesign is in scope—only restoration.

## Out of scope (explicit)

- Designing a third identity (neither 089 nor pre-089).
- Reverting or redesigning features from specs other than 089.
- Rewriting the entire docs history of 089 (beyond noting revert in changelog/daily as process requires).
- Changing call/media protocols, occupancy APIs, or E2EE cryptography—visual/chrome rollback only where 089 touched presentation and header placement.
