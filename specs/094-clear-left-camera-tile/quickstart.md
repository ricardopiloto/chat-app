# Quickstart: 094 Clear Left Camera Tile

**Feature**: [spec.md](./spec.md)  
**Contracts**: [stage-camera-clear-on-leave.md](./contracts/stage-camera-clear-on-leave.md), [pip-camera-clear-on-leave.md](./contracts/pip-camera-clear-on-leave.md)

## Prerequisites

- Backend + frontend running
- Two signed-in accounts (A and B) on the same voice channel
- Cameras available (or test pattern if used in your environment)

## Setup

```bash
cd backend && cargo run
cd frontend && npm run dev
cd frontend && npx tsc --noEmit
```

## Validation scenarios

### 1. Grade — peer leave clears frozen camera

1. A and B join the same voice channel; both enable camera; B uses **Grade**.
2. Confirm B sees A’s live camera tile.
3. A hangs up / leaves.
4. **Expect** (within ~2s): A’s camera tile **gone** from B’s Grade; no frozen last frame; grid reflows.

### 2. Composição — no frozen frame (empty/free OK)

1. Same setup; B uses **Composição**.
2. A leaves with camera on.
3. **Expect** (within ~2s): no frozen frame of A; seat may be empty/free without video; spotlight/hero must not keep A’s freeze.

### 3. PIP

1. A and B in call with cameras; B navigates to a **text** channel so **PIP** is visible.
2. A leaves.
3. **Expect** (within ~2s): A’s camera gone from PIP; no frozen PIP tile.

### 4. Camera off ≠ leave

1. A stays in call; turns **camera off**.
2. **Expect**: A still represented per existing in-call cam-off behavior (not full leave).
3. A then leaves → **Expect**: scenarios 1–2 cleanup (no freeze).

### 5. Rejoin clean

1. A left with cam on; B’s stage clean.
2. A rejoins and enables camera.
3. **Expect**: single fresh live tile for A; no zombie duplicate.

### 6. Unload / hard leave (optional)

1. A closes the tab while cam on (087 leave path).
2. **Expect**: B clears A’s camera within ~2s of occupancy/leave observable.

## Done when

- [ ] Scenarios 1–5 pass (6 if feasible)
- [ ] `npx tsc --noEmit` clean
- [ ] Stage + PIP contracts satisfied
