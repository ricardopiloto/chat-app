# Feature Specification: User Panel Stack for Control Overflow

**Feature Branch**: `084-user-panel-stack`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Para a barra de usuário (user-panel), vamos evitar reduzir muito o display name do usuário ao ponto de não conseguir ver. Caso tenhamos muitos ícones para exibir, nós vamos «subir» um nível na barra e adicionar os botões nesse nível superior, todos alinhados ao centro da barra."

**Related**: Discord-style user panel layout ([078-user-panel-discord](../078-user-panel-discord/)); later call controls on the panel (e.g. leave, camera, screen share from 080–082).

## Clarifications

### Session 2026-09-10

- Q: When the user panel grows (e.g. stacked control row), how should surrounding chrome react? → A: The taller panel MUST **push the layout upward** (reflow)—channel list / nav content above cedes space; the panel MUST NOT overlay or cover the sidebar content.
- Q: In stacked mode, where does Settings sit? → A: **Identity row** (right of the name)—only call/action controls move to the centered upper row; Settings stays with the identity cluster.
- Q: When should the stacked (two-level) layout activate? → A: When a single-row layout would leave the display name below a **minimum readable width** (layout overflow measure)—not a fixed icon count or “always in call”.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display name stays readable (Priority: P1)

As a Mesa user looking at the bottom user bar, I want my display name (handle) to remain readable even when I am in a call with several control icons, so I can still recognize “this is me” without squinting at an ellipsis-only label.

**Why this priority**: Core complaint — overcrowding currently trades away the identity text.

**Independent Test**: Enter a call state that shows many panel icons (e.g. leave + mic + deafen + camera + screen share + settings where applicable) with a medium/long handle; confirm the primary name line remains legible (not reduced to a few characters or empty-looking truncate).

**Acceptance Scenarios**:

1. **Given** the user panel shows only identity + the idle control set (few icons), **When** the user views the bar, **Then** the handle is fully or mostly visible with normal single-row layout (no unnecessary second row).
2. **Given** many control icons are visible at once, **When** a single-row layout would force the handle below the minimum readable width, **Then** the product MUST NOT keep crushing the name; it switches to the stacked layout (US2) so the name stays usable.
3. **Given** a long handle in stacked or single-row mode, **When** residual truncation is still needed, **Then** truncation uses ellipsis but leaves enough characters that the name remains recognizable (not a near-empty label).

---

### User Story 2 - Extra icon row above, centered (Priority: P1)

As a Mesa user with many icons on the user bar, I want those control buttons to move to a **second level above** the identity row, **centered** on the bar’s width, so controls stay reachable without stealing horizontal space from my name.

**Why this priority**: Explicit product solution for icon overflow.

**Independent Test**: Force a crowded control set → confirm a upper row of centered icons appears above the identity row; identity remains on the lower level with readable name.

**Acceptance Scenarios**:

1. **Given** the panel needs the overflow strategy, **When** the stacked layout is active, **Then** control icons appear on an **upper** row, horizontally **centered** within the user panel width.
2. **Given** the stacked layout is active, **When** the user looks at the lower row, **Then** the identity cluster (avatar, status, display name / online line) **and Settings** (when shown) remain on that lower level; the name still has enough width to stay readable beside Settings.
3. **Given** the stacked layout is active, **When** the user uses mic, deafen, camera, leave, or screen share (as offered in that state), **Then** those controls appear on the **upper** centered row and behave as they do today — only placement changes. Settings remains on the lower identity row and still works.
4. **Given** the control set shrinks again (e.g. leave call so fewer icons show), **When** a single row would again leave the name readable, **Then** the panel MAY return to the compact single-row Discord-like arrangement (no permanent two-row when unnecessary).
5. **Given** the panel grows taller because of the stacked control row, **When** the layout updates, **Then** content above the user panel (channel list / shell nav) is **pushed upward / shortened**—the taller panel occupies space in normal document flow and does **not** draw on top of the channel list.

---

### User Story 3 - Stable, familiar identity affordances (Priority: P2)

As a Mesa user, I still want to open account options from the identity area (and settings where shown) after the layout stacks, so stacking does not break account access.

**Why this priority**: Protects existing account entry while layout changes.

**Independent Test**: In stacked and single-row modes, activate identity (and settings if present) → account menu opens as today.

**Acceptance Scenarios**:

1. **Given** single-row or stacked layout, **When** the user activates the identity region, **Then** the account menu / account entry path opens as today.
2. **Given** settings is offered on the panel, **When** the user activates it in either layout, **Then** the same account/settings entry path works.

---

### Edge Cases

- Very long handles: ellipsis allowed after preserving a readable minimum; avatar and online indicator stay visible.
- Narrow panel / rail width: stacking is preferred over unreadable name; upper icons may wrap to a second icon line only if unavoidable — prefer one centered icon row that fits by using existing compact control sizes.
- Rapid join/leave: layout switches without flicker that hides controls for more than a moment; no stuck “empty” upper row when no icons belong there; panel height changes reflow the nav (push up / reclaim space) rather than overlay.
- Reduced motion: stacking is a layout change, not a required animation.
- Listen-only / disabled controls: disabled state preserved when moved to the upper row.
- Stacked panel height: must increase the user-panel’s footprint so siblings above shrink; must not use absolute overlay that covers channels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The user panel MUST keep the signed-in user’s primary display name (handle) **readable** whenever the panel is shown; the product MUST NOT rely on extreme horizontal compression that makes the name effectively unreadable when many icons are present.
- **FR-002**: When a **single-row** arrangement would leave the primary display name below a **minimum readable width** (layout overflow), the panel MUST switch to a **two-level** layout: an **upper** row for call/action buttons and a **lower** row for identity + Settings. Activation MUST NOT be based solely on a fixed icon count or on “always stack while in a call.”
- **FR-003**: In the two-level layout, **call/action** control buttons on the upper row (e.g. leave, mic, deafen, camera, screen share—not Settings) MUST be **horizontally centered** within the user panel.
- **FR-004**: In the two-level layout, the lower row MUST present the identity cluster (avatar, online indicator, primary name, secondary status line as today) **and Settings** (when shown), with width prioritized for name readability beside Settings.
- **FR-005**: Control behaviors (mute, deafen, camera, leave, screen share, settings, etc.) MUST remain functionally unchanged; only arrangement may change between single-row and stacked modes.
- **FR-006**: In the two-level layout, Settings MUST remain on the **identity (lower) row**; it MUST NOT move to the centered upper control row.
- **FR-007**: When few enough icons are visible that a single row keeps the name readable, the panel SHOULD use the compact single-row layout (identity + icons) rather than forcing an empty or sparse upper row.
- **FR-008**: Account access via the identity control (and settings, when shown) MUST work in both single-row and stacked layouts.
- **FR-009**: Truncation of the display name, if still required, MUST use ellipsis and MUST preserve a recognizable portion of the name (not collapse to an unusable stub).
- **FR-010**: When the user panel’s height increases due to the stacked control row (or shrinks when returning to single-row), the shell layout MUST **reflow**: content above the panel (notably the channel list in the nav column) MUST be pushed upward / reduced in available height so the panel does not cover it. Absolute overlay of the channel list by the taller panel is forbidden.

### Key Entities

- **User panel**: Bottom chrome under the server rail / channel list showing identity and quick controls.
- **Identity cluster**: Avatar, online indicator, primary display name (handle), secondary status text.
- **Control icon set**: Variable set of panel actions (e.g. leave, mic, deafen, camera, screen share, settings) depending on call/view state.
- **Stacked layout**: Two-level arrangement — centered **call/action** controls above; identity **plus Settings** below.
- **Single-row layout**: Compact arrangement used when icons and name fit without unreadable name compression.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a crowded in-call panel review (many icons + medium/long handle), 100% of reviewers can read a recognizable form of the display name without opening the account menu.
- **SC-002**: When stacked mode is active, 100% of reviewers identify the control icons as a **centered upper** row above the identity row.
- **SC-003**: Switching into and out of a crowded control set (join/leave or show/hide screen share) keeps all offered controls usable within one interaction; no reviewer finds controls “missing” solely due to the layout switch.
- **SC-004**: With only the idle/minimal icon set, the panel stays on a single row for ≥90% of typical desktop panel widths used in the product (no gratuitous double row).
- **SC-005**: Account menu still opens from identity (and settings if present) in under 2 seconds of seeking in both layouts.
- **SC-006**: When stacked mode makes the panel taller, 100% of reviewers still see the bottom of the channel list (or its scrollable area) above the panel—not hidden underneath the user bar.

## Assumptions

- “Display name” in this feature means the primary identity text already shown on the panel (the account **handle**), not a new profile display-name field.
- “Many icons” means the variable call/control set that appears on the user panel in current product states (leave, mic, deafen, camera, screen share, settings, and any peers already on that bar)—not a redesign of which actions exist.
- Stacking threshold is **minimum readable name width** (layout overflow): stack when single-row would shrink the name below that floor; icon count may be an implementation proxy but is not the product rule (clarification session 2026-09-10). Exact pixel/ch floor is a planning/implementation detail as long as SC-001 holds.
- Upper-row centering is relative to the **user panel** width (the bar under rail+sidebar), not the full browser window.
- Stacked height growth **reflows** `shell-nav` (panel pushes layout up); it does not overlay the sidebar (clarification session 2026-09-10).
- In stacked mode, **Settings stays on the identity row**; only call/action icons use the centered upper row (clarification session 2026-09-10).
- No change to voice/call semantics, permissions, or backend APIs.
- i18n: no new user-facing copy required beyond existing control labels unless an affordance needs a name for the upper toolbar (optional `aria` grouping).
