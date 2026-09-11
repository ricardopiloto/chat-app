# Feature Specification: Clear Ended Screen Share from Grade

**Feature Branch**: `088-clear-ended-screen-tile`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Outro comportamento do compartilhamento de tela que temos que corrigir, quando um usuário cancela o compartilhamento, a grade ainda exibe como se existisse um compartilhamento: [Grade unified stage still shows a screen tile with empty `<video>` and “Tela” chip]. Se o compartilhamento for encerrado, nós temos que remover ele da grade também."

**Problem**: When a participant **stops / cancels** screen share, **Grade** often keeps a **screen-share tile** (label/chip such as “Tela”, empty or dead `<video>`). The grid still behaves as if a share exists.

**Goal**: Ending screen share MUST **remove** that share’s tile from Grade for everyone who sees the grid—no leftover screen cell.

**Related**: Screen share + Grade tiles ([082](../082-screen-share/), [083](../083-grade-screen-tiles/), [085](../085-screen-share-fit/)).

## Clarifications

### Session 2026-09-10

- Q: Beyond removing the Grade screen tile, what else must clear when share ends? → A: **Grade tile + active-share indicators** (e.g. sidebar/channel occupancy “sharing” affordances) for sharer and viewers—not Grade-only.
- Q: Which end-share paths must clear tile + indicators? → A: **Both** in-app stop control **and** browser/OS “Stop sharing” / capture-track ended.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stop share removes my screen tile (Priority: P1)

As someone sharing my screen in Grade, when I **cancel / stop** sharing, I want my screen tile to **disappear** from the grid immediately so the layout only shows real camera (and any other still-active) tiles.

**Why this priority**: Core reported bug—ghost share tile after stop.

**Independent Test**: Start share in Grade → confirm screen tile present → stop share → confirm screen tile gone and no empty “Tela” cell remains.

**Acceptance Scenarios**:

1. **Given** I am sharing screen in Grade and a screen tile is visible, **When** I stop/cancel sharing, **Then** that screen tile is **removed** from the Grade (no empty video cell, no lingering “Tela”/share chip for that share) **and** active-share indicators (sidebar/channel) no longer show me as sharing.
2. **Given** I stopped sharing, **When** I look at the Grade layout, **Then** remaining tiles are only cameras (and any other participants’ **still-active** shares)—grid columns/rows reflow without a blank share slot.
3. **Given** I stop sharing via the **in-app** control **or** the browser’s stop-sharing affordance, **When** the share ends, **Then** the Grade and share indicators update without requiring leave/rejoin or a full page refresh.

---

### User Story 2 - Viewers lose the ended share tile (Priority: P1)

As another participant watching Grade, when someone else ends their screen share, I want their screen tile to disappear from my grid too—not stay as an empty share cell.

**Why this priority**: Same ghost for everyone watching.

**Independent Test**: User A shares; user B sees screen tile; A stops; B’s Grade no longer shows A’s screen tile.

**Acceptance Scenarios**:

1. **Given** peer A is sharing and I see their screen tile (and share indicators), **When** A stops sharing, **Then** A’s screen tile disappears from my Grade **and** share indicators for A clear within a short observable wait.
2. **Given** A’s share ended, **When** A’s camera is still on, **Then** I still see A’s **camera** tile (if applicable)—only the **screen** tile is removed.
3. **Given** spotlight was on A’s screen tile, **When** A stops sharing, **Then** the ended screen tile is gone and spotlight does not keep an empty share cell.

---

### User Story 3 - Starting share again works cleanly (Priority: P2)

As a sharer, after stopping, I want to be able to **start screen share again** and see a fresh screen tile, without duplicates or a zombie tile from the previous share.

**Why this priority**: Guards against partial cleanup.

**Independent Test**: Share → stop → share again; exactly one live screen tile for the new share.

**Acceptance Scenarios**:

1. **Given** I stopped sharing and the tile was removed, **When** I start sharing again, **Then** a new screen tile appears with live content (no second ghost tile from before).

---

### Edge Cases

- Multiple sharers: stopping one share removes **only** that sharer’s screen tile; others remain.
- Stop while spotlighted: screen tile and spotlight on that share clear; cameras remain.
- Composition mode: still does not show screen video; ending share must not leave Grade ghosts when switching back to Grade.
- Rapid stop/start: at most brief flicker; no permanent empty screen tile.
- Peer leaves the call while sharing: their screen tile must also disappear (same “share no longer exists” rule).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a participant’s screen share **ends**—via the **in-app** stop control **or** the browser/OS stop-sharing affordance / ended capture track—the Grade MUST **remove** that participant’s **screen-share tile** from the unified grid.
- **FR-002**: After removal, Grade MUST NOT keep an empty or dead screen cell (no blank `<video>`, no lingering share/“Tela” chip for an inactive share).
- **FR-003**: Other participants’ Grade views MUST also drop the ended screen tile without requiring their refresh.
- **FR-004**: Ending a screen share MUST NOT remove that user’s **camera** tile if their camera is still on.
- **FR-005**: Re-starting screen share after a stop MUST show a single new screen tile for the active share (no duplicate/zombie tiles).
- **FR-006**: If spotlight referenced the ended screen share, spotlight/empty share emphasis MUST clear with the tile.
- **FR-007**: When screen share ends, **active-share indicators** (e.g. sidebar / channel occupancy cues that someone is sharing) MUST clear for the sharer and for other participants—not only the Grade tile.
- **FR-008**: Both end paths (in-app and browser/track-ended) MUST produce the same cleanup: no Grade screen tile and no active-share indicators for that ended share.

### Key Entities

- **Screen-share tile**: Grade cell for an active screen/window share (distinct from camera tiles).
- **Ended share**: Share no longer active—must not occupy a Grade tile.
- **Camera tile**: Unaffected by share end except layout reflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of manual stop-share runs, the sharer’s Grade shows **0** screen tiles for that ended share within **3 seconds** of stopping.
- **SC-002**: In 100% of two-user runs, the viewer’s Grade also shows **0** tiles for the ended share within **5 seconds**.
- **SC-003**: After stop, reviewers confirm no empty share cell / “Tela” chip remains for the inactive share (0 ghost tiles).
- **SC-004**: Stop then start again yields exactly **one** live screen tile for the new share in 100% of checks.
- **SC-005**: Camera tiles for users who still have camera on remain visible after share stop in 100% of checks.
- **SC-006**: After stop, 100% of reviewers confirm sidebar/channel **share indicators** are off for that ended share (sharer and viewer).

## Assumptions

- “Cancelar o compartilhamento” includes the in-app stop control and any browser UI that ends the capture track / share.
- Ghost tile described by the reporter (unified Grade stage + screen tile with empty video + “Tela”) is the primary failure mode.
- Cleanup scope (clarification 2026-09-10): Grade tile **and** active-share indicators (sidebar/occupancy)—not Grade-only.
- End paths (clarification 2026-09-10): **in-app stop** and **browser/OS stop / track ended** both require full cleanup.
- Composition remains without screen video; this feature’s visible fix is Grade tile lifecycle plus share indicators.
- Occupancy/`screen_on` and media teardown details are planning concerns; the product rule is: **no Grade screen tile and no active-share indicators unless a share is actually active**.
