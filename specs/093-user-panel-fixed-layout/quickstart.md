# Quickstart: 093 User Panel Fixed Layout

**Feature**: [spec.md](./spec.md)  
**Contracts**: [user-panel-fixed-layout.md](./contracts/user-panel-fixed-layout.md), [panel-channel-label.md](./contracts/panel-channel-label.md)

## Prerequisites

- App running (backend + `frontend` dev server) with a signed-in account
- At least one text channel and one voice channel on a server
- Two browser sessions optional (not required for layout-only checks)

## Setup

```bash
# backend
cd backend && cargo run

# frontend
cd frontend && npm run dev
```

```bash
cd frontend && npx tsc --noEmit
```

## Validation scenarios

### 1. Idle stacked layout + open channel label

1. Sign in; **do not** join a call.
2. Open a **text** channel (e.g. `#geral`).
3. **Expect**: User panel has **upper** row with idle controls (per current visibility); **lower** row = identity | **channel display name** | Settings.
4. **Expect**: Label shows the channel **name only** (no required `#`).
5. Click the channel label → **Expect**: nothing navigates; Settings/identity still work.

### 2. Collapse / no migration

1. While idle, note which icons are on the **upper** row.
2. Join a voice call (more icons may appear, e.g. leave / screen share).
3. **Expect**: New icons appear on the **upper** row only; Settings stays lower-right; icons do not jump beside the handle.
4. If a state exists with **zero** upper icons (if product rules allow), **Expect**: no tall empty upper strip.

### 3. Live call label wins over browsed channel

1. Join voice channel **V** (camera optional).
2. Confirm panel label shows **V**’s name.
3. Without leaving the call, open a **different** text channel in the main pane.
4. **Expect**: Panel label still shows **V**, not the text channel.

### 4. Hangup reverts label

1. From scenario 3, hang up.
2. **Expect**: Label becomes the currently open/selected channel name, or empty if none.

### 5. Empty label

1. Navigate to a server surface with **no** channel selected (if the app allows) and ensure **not** in a call.
2. **Expect**: Middle region between name and Settings is empty (no mandatory placeholder).

### 6. Reflow

1. With upper controls visible (two-row panel), shrink the window / note sidebar channel list.
2. **Expect**: Channel list cedes space above the panel; panel does **not** overlay the list.

## Done when

- [ ] Scenarios 1–6 pass
- [ ] `npx tsc --noEmit` clean in `frontend/`
- [ ] UPF-* and PCL-* contract rows satisfied
