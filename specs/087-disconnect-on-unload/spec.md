# Feature Specification: Disconnect Voice Session on Browser Unload

**Feature Branch**: `087-disconnect-on-unload`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Quando um usuário der refresh no navegador, ou fechar o navegador, fechar a aba, etc, nós temos que desconectar ele da sessão. Atualmente ele fica com a sessão presa e mostra como ainda estivesse conectado, mesmo não estando."

**Problem**: When a participant **refreshes**, **closes the tab**, or **closes the browser** while in a voice/video call, their call session often remains **stuck as connected**. Other users (and the UI) still show them as present in the channel/call even though they are gone.

**Goal**: Leaving the page in those ways MUST end the call session the same way an intentional leave does from other participants’ point of view—no ghost occupants.

## Clarifications

### Session 2026-09-10

- Q: Multi-tab policy when one tab holds the live call? → A: **One live call session per account**—unload (refresh/close) of the tab that owned the call **ends the call/occupancy globally**, even if another Mesa tab remains open.
- Q: If leave-on-unload fails (abrupt kill)? → A: **Both**—best-effort client leave on unload **and** server-side stale occupancy cleanup within ~1 minute when leave did not complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refresh does not leave a ghost (Priority: P1)

As a participant in a voice/video channel, when I **refresh** the page, I want my call presence cleared so others no longer see me as connected, and so I do not reappear as a stuck “still in call” entry after the reload until I join again.

**Why this priority**: Refresh is common; stuck presence is the core complaint.

**Independent Test**: Two users in a call; user A refreshes; user B’s sidebar/occupancy/stage no longer shows A as in the call (within a short, observable wait). After reload, A is not auto-shown as connected until they join again.

**Acceptance Scenarios**:

1. **Given** I am connected to a voice/video channel call, **When** I refresh the browser, **Then** my occupancy/call presence is cleared for other participants (I am no longer shown as in the call).
2. **Given** I refreshed while in a call, **When** the page finishes loading, **Then** I am **not** treated as still connected solely because of the previous session—I must join again to appear connected.
3. **Given** another participant was viewing my presence, **When** I refresh, **Then** they stop seeing me as connected without needing to refresh themselves (presence update reaches them).

---

### User Story 2 - Closing tab or browser clears the session (Priority: P1)

As a participant, when I **close the tab** or **close the browser** while in a call, I want the session disconnected so I do not remain listed as connected.

**Why this priority**: Same stuck-session impact as refresh; equally reported.

**Independent Test**: User A in call with B; A closes the tab (or browser); B no longer sees A as connected.

**Acceptance Scenarios**:

1. **Given** I am in a call, **When** I close the tab, **Then** other participants stop seeing me as connected.
2. **Given** I am in a call, **When** I close the browser window, **Then** other participants stop seeing me as connected.
4. **Given** I have another Mesa tab open that was not the live call tab, **When** I close/refresh the call tab, **Then** I am no longer shown as in the call anywhere; the other tab does not keep ghost call presence.

---

### User Story 3 - Intentional leave still works (Priority: P2)

As a participant, I want the normal **Leave** / hang-up control to keep clearing my session, and unload disconnect must not break that path or leave duplicates.

**Why this priority**: Regression guard for existing leave behavior.

**Independent Test**: Leave via the product control while staying on the page; presence clears as today.

**Acceptance Scenarios**:

1. **Given** I am in a call, **When** I use the normal leave/hang-up control, **Then** my presence clears for others as before this feature.
2. **Given** leave already ran, **When** the page later unloads, **Then** no error or stuck state is introduced (idempotent cleanup).

---

### Edge Cases

- Multiple tabs: **one live call per account**. Closing or refreshing the tab that held the call MUST end that call session and clear occupancy for everyone; another open Mesa tab MUST NOT keep the user shown as in the call without an explicit new join.
- Network drop mid-unload: presence MUST still clear via **server-side stale cleanup within ~1 minute** if the unload leave never arrives (clarification 2026-09-10).
- User navigates away inside the app to a non-call view without unload: existing in-app leave/navigation rules remain; this feature focuses on **browser unload** (refresh, tab close, window close).
- Listen-only occupants: same disconnect-on-unload rules as speakers.
- Offline / flaky network for peers: peers receive leave/presence update when connectivity allows; no permanent ghost after the disconnected user’s session is cleared server-side.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a user **refreshes** the page while connected to a voice/video call session, the product MUST **disconnect** that session and clear their call/occupancy presence for other participants.
- **FR-002**: When a user **closes the tab** or **closes the browser** while connected to a call session, the product MUST **disconnect** that session and clear their call/occupancy presence for other participants.
- **FR-003**: After unload disconnect, the user MUST NOT remain shown as connected until they explicitly join again (no stuck “ghost” occupant).
- **FR-004**: Other participants MUST observe the departure (presence/occupancy update) without requiring their own refresh, under normal connectivity.
- **FR-005**: Normal in-app leave/hang-up MUST continue to clear the session; unload cleanup MUST be safe if leave already occurred (idempotent).
- **FR-006**: Unload MUST attempt an immediate leave/disconnect (best-effort). If that leave cannot complete (e.g. tab killed abruptly), the **server MUST clear stale call/occupancy** so the user is not shown as connected indefinitely—stale presence MUST be gone within **about 1 minute** under normal conditions (see SC-005).
- **FR-007**: The product treats **at most one live call session per account**. Unload of the tab that owned that session MUST clear call/occupancy globally; a remaining Mesa tab MUST NOT preserve “still in call” presence for the ended session.
- **FR-008**: Stale occupancy cleanup is a **required** safety net alongside client unload leave—not an optional nicety. Client-only best-effort without server cleanup is insufficient.

### Key Entities

- **Call / voice session**: The user’s live connection to a voice/video channel (media + occupancy).
- **Occupancy / presence**: The signal that shows others someone is connected in the channel/call.
- **Browser unload**: Refresh, tab close, window/browser close (and equivalent page teardown).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-user call, after user A refreshes, user B stops seeing A as connected within **10 seconds** in 100% of manual quickstart runs.
- **SC-002**: In a two-user call, after user A closes the tab, user B stops seeing A as connected within **10 seconds** in 100% of manual quickstart runs.
- **SC-003**: After A’s unload, A’s own UI (on reload or later return) does not show A as still in that call until A joins again—**0** ghost self-presence cases in quickstart.
- **SC-004**: Intentional leave via product control still clears presence in 100% of checks (no regression).
- **SC-005**: No reviewer reports a participant remaining listed as connected for **more than 1 minute** after tab/browser close under normal test network conditions (covers server stale cleanup / FR-006–FR-008).
- **SC-006**: In a simulated abrupt kill where unload leave cannot run, occupancy still clears within **1 minute** without requiring peer refresh (server safety net).

## Assumptions

- “Sessão” means the **voice/video call session and channel occupancy**, not the Mesa account login session (auth cookie/token may survive refresh).
- **One live call per account** (clarification 2026-09-10): unload of the call-owning tab ends the call even if other Mesa tabs stay open.
- Safety net (clarification 2026-09-10): client leave-on-unload **plus** server stale occupancy cleanup (~1 min) when leave fails.
- Closing a tab that was not in a call does not require special call cleanup.
- In-app navigation away from a channel may already hang up today; this feature’s mandate is **browser unload** paths that currently leave ghosts.
- A short delay for peers to learn of the leave is acceptable if within SC-001/002; indefinite ghosts are not.
- Exact transport for leave-on-unload and the stale-detection mechanism are planning/implementation details; both layers are required as product outcomes.
