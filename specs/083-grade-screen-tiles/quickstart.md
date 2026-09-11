# Quickstart: 083-grade-screen-tiles

Manual check after implementation (2 browsers recommended). Assumes 082 screen share already works.

## Prerequisites

```bash
cd backend && cargo run   # existing voice stack
cd frontend && npm run dev
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### 1. Unified equal grid (P1)

1. A and B in call, both on **Grade**; A shares screen (cams on).
2. **Expect**: One grid — camera tiles and A’s screen tile with **similar** sizes (no fat top screen band + tiny camera strip).
3. **Expect**: Camera tiles appear **before** the screen tile(s).

### 2. Multi-share + dual tiles

1. A and B both share; both have cameras.
2. **Expect**: Cameras first, then two screen tiles; all equal without spotlight.
3. A has cam+screen → two tiles; screen chip shows handle + share indicator.

### 3. Spotlight

1. Spotlight A’s screen.
2. **Expect**: Only local layout changes; A’s screen tile larger; still one grid (not bands).
3. Camera tiles have no spotlight control.
4. A stops share → spotlight clears; grid rebalances.

### 4. Composition regression

1. With share active, switch to **Composição**.
2. **Expect**: No screen video tiles; share audio still if present; indicators still on.
3. Back to Grade → unified grid again.

### 5. CSS cleanup

1. Inspect DOM/CSS: no active `.grade-screen-band` / `.grade-camera-band` split layout for Grade with shares.

## Done when

- Scenarios 1–5 pass; `tsc --noEmit` clean.
