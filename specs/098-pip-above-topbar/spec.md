# Feature Specification: Floating PiP Above Top Bar

**Feature Branch**: `098-pip-above-topbar`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "O PiP está ficando atrás do header, necessário arrumar. DOM Path: div#root > div.app > header.topbar …"

## Clarifications

### Session 2026-09-11

- Q: When top bar menus (notifications, search, account) are open, should they stack above the PiP or should the PiP stay above those menus too? → A: PiP above top bar strip; open menus above PiP

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See and use the floating call PiP over the top bar (Priority: P1)

A member is in a voice/video call and navigates so the floating picture-in-picture (PiP) call preview is visible. Today the PiP can sit **under** the app top bar (brand / version / instance chrome), so part of the PiP is hidden or hard to drag/click. After this fix, the PiP always paints **above** the top bar and remains fully usable (visible, draggable, and interactive) when it overlaps that header region.

**Why this priority**: The PiP is the main way to stay aware of the call while browsing the shell; being obscured by the header blocks core use.

**Independent Test**: Join a call, open a view where PiP shows, drag or place the PiP so it overlaps the top bar; confirm the PiP remains fully on top and controls remain clickable.

**Acceptance Scenarios**:

1. **Given** a live call with floating PiP visible, **When** the PiP overlaps the top bar area, **Then** the entire PiP (including edges near the top of the window) remains visible above the top bar—not clipped underneath it.
2. **Given** the PiP overlaps the top bar, **When** the member drags the PiP by its handle/header, **Then** the drag still works and the PiP stays above the top bar during and after the drag.
3. **Given** the PiP overlaps the top bar, **When** the member uses PiP controls (e.g. return to call / hang up if present), **Then** those controls receive the click/tap—not the top bar underneath.
4. **Given** light and dark themes, **When** repeating the overlap check, **Then** stacking remains correct in both themes.

---

### Edge Cases

- PiP parked in a corner that does not overlap the top bar: behavior unchanged; no regression to size, corner memory, or content.
- Narrow / mobile drawer layouts: PiP still stacks above the top bar when paths cross.
- Top bar menus (notifications, search, account): the PiP MUST stack above the **top bar chrome strip** (closed header). When a top-bar menu is **open**, that menu MUST stack above the PiP. Full-screen modals/dialogs that must stay on top of everything remain above the PiP.
- Reduced motion / no animation: stacking fix must not depend on motion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While the floating call PiP is shown, it MUST stack visually above the app top bar chrome strip so the top bar does not cover the PiP.
- **FR-002**: Pointer interaction with the PiP (drag and PiP controls) MUST work when the PiP overlaps the top bar region (and no open top-bar menu is covering that point).
- **FR-003**: Fixing stacking MUST NOT remove or hide the top bar, nor change top-bar content (brand, version, instance, actions) beyond what is required for correct layering.
- **FR-004**: Existing PiP capabilities (show while in call, corner placement/memory, media preview behavior) MUST remain available (chrome/layering fix only).
- **FR-005**: Light and dark themes MUST both show the PiP above the top bar under the same overlap conditions.
- **FR-006**: When a top-bar menu (notifications, search, account, or equivalent) is open, that menu MUST stack above the floating PiP so menu items remain visible and clickable.

### Key Entities

- **Top bar**: Persistent app header chrome (brand, version, instance, actions).
- **Floating call PiP**: Detached in-call preview overlay that can be moved over the shell.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a side-by-side or screenshot review, stakeholders agree the PiP is fully visible above the top bar when intentionally overlapped, in ≥1 desktop layout (both themes).
- **SC-002**: Drag and at least one PiP control remain operable when the PiP overlaps the top bar in a manual check (zero “clicks fall through to the header” cases in that check).
- **SC-003**: Regression: top bar remains visible and usable when the PiP is not overlapping it; PiP still appears for an in-call member who leaves the voice stage view.

## Assumptions

- “Header” in the report means the app **top bar** (`.topbar`), not channel pane headers.
- PiP already exists as a floating call affordance; this feature only corrects **layering / hit-testing** relative to the top bar.
- Full-screen system modals and security prompts may still appear above the PiP (platform/browser rules).
- No new PiP features (resize, multi-PiP, always-on-top OS window) are in scope.
