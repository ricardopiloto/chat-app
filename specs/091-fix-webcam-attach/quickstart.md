# Quickstart: 091-fix-webcam-attach

Validate that webcams appear reliably in **Composition and Grade** without leave/rejoin or starting screen share.

## Prerequisites

- Backend + frontend running (`cargo run`, `npm run dev`).
- Two browser profiles (A, B) in the same voice channel when testing peers.
- Prefer camera permission already granted (cam-on means capture OK).
- See [contracts/local-preview-coherence.md](./contracts/local-preview-coherence.md) and [contracts/host-mount-rebind.md](./contracts/host-mount-rebind.md).

## Automated smoke

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0 after implementation.

## Manual scenarios

### 1. Local join + cam — Composition (SC-001)

1. Join call; enable camera (or join with cam preferred on).
2. Stay in **Composition**.
3. **Expect within ~2 s**: self webcam visible; no leave/rejoin; **no** screen share.
4. Repeat to **10/10** consecutive trials.

### 2. Local join + cam — Grade (SC-001)

1. Same as (1) in **Grade**.
2. **Expect within ~2 s**: self camera tile shows video (not empty while cam-on).
3. Repeat to **10/10**.

### 3. Mid-call cam on (SC-006 / FR-008)

1. Join with camera **off**.
2. Enable camera from UserPanel while already live.
3. Check **Composition** and **Grade**.
4. **Expect within ~2 s**: self-view in both; no rejoin/share. **5/5** trials.

### 4. Two users, no share (SC-002 / SC-003)

1. A and B both cam on; nobody shares.
2. **Expect**: each sees local + remote cams; remote within ~2 s after track + host ready.
3. No leave/rejoin or share-start.

### 5. Share is not a wake ritual (SC-004 / SC-007 / FR-002)

1. With cams already showing, A starts then stops screen share.
2. **Expect**: cams remain (or recover within **~1 s** after remount); share tiles behave; after stop no ghost screen tile (088).
3. Confirm you never *needed* share to make cams appear in scenarios 1–4.

### 6. Mode switch (FR-004)

1. Cams on in Composition → switch to Grade → back.
2. **Expect**: no permanent blank; any flash recovers ≤ ~1 s.

### 7. PiP regression (FR-012)

1. With call live and cam on, leave the voice page so Floating PiP shows (if applicable).
2. **Expect**: PiP still shows camera as before (no new blank PiP).

## Pass criteria

Matches [spec.md](./spec.md) SC-001–SC-007 and FR-001–FR-015: cams bind without share/rejoin catalysts; budgets met; PiP unchanged.
