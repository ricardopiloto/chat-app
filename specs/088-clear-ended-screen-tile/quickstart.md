# Quickstart: 088-clear-ended-screen-tile

Validate that ending screen share removes Grade screen tiles and share indicators for sharer and viewers.

## Prerequisites

- Backend + frontend running (`cargo run`, `npm run dev`).
- Two browser profiles (A = sharer, B = viewer) in the same voice channel with Grade open.
- See [contracts/grade-screen-clear.md](./contracts/grade-screen-clear.md) and [contracts/share-indicators-clear.md](./contracts/share-indicators-clear.md).

## Automated smoke

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0 after implementation.

## Manual scenarios

### 1. In-app stop (sharer + viewer) — US1 / US2

1. A starts screen share; A and B see a screen tile (chip «Tela») and share indicators.
2. A stops via **in-app** control.
3. **Expect within ~3s (A) / ~5s (B)**: no screen tile for A; no empty «Tela» cell; A’s camera tile remains if cam on; sidebar/channel share indicators off for A.
4. If B had spotlight on A’s screen: spotlight does not keep an empty share stage.

### 2. Browser / OS stop — FR-008

1. A starts share again.
2. A ends via browser/OS «Stop sharing» (or equivalent track end)—not only the in-app button.
3. **Expect**: same cleanup as scenario 1 for Grade + indicators on A and B.

### 3. Re-share — US3

1. After a clean stop, A starts share again.
2. **Expect**: exactly one live screen tile; no ghost duplicate from the previous share.

### 4. Multi-sharer (optional)

1. A and C both share; B sees two screen tiles.
2. A stops.
3. **Expect**: only A’s screen tile gone; C’s remains.

## Pass criteria

Matches [spec.md](./spec.md) SC-001–SC-006: no ghost Grade screen tiles; indicators clear; camera tiles preserved; re-share clean.
