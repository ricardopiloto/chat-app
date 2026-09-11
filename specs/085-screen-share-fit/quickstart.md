# Quickstart: 085-screen-share-fit

Validate Grade screen tiles show the full shared frame (letterbox OK) while cameras stay fill/crop.

## Prerequisites

- App running (`cargo run` + `npm run dev`)
- ≥2 browsers in the same voice channel, **Grade** mode
- Ability to share a screen/window with content to the edges (desktop wallpaper, browser UI chrome, or a known full-bleed image)

## 1 — Screen tile shows all (SF-01, SF-02)

1. User A starts screen share in Grade.
2. User B looks at A’s **screen** tile (chip with share affordance).
3. **Expect**: Entire shared frame visible; if tile ratio differs, dark/slot-like bars — **no** cropped edges of the shared UI.
4. Compare to a **camera** tile: cameras may still crop faces to fill (SF-03).

## 2 — Local preview matches (SF-04)

1. As User A (sharer), inspect your own screen tile.
2. **Expect**: Same show-all / letterbox behavior as User B sees (not webcam crop).

## 3 — Spotlight keeps show-all (SF-05)

1. On a screen tile, enable spotlight.
2. **Expect**: Tile enlarges (083 behavior) but content remains fully visible (still contain/letterbox, not cover).

## 4 — Multi-share / dual tiles

1. Two sharers, and at least one with cam + screen.
2. **Expect**: Every screen tile uses show-all; every camera tile keeps fill; order still cams then screens (083).

## 5 — Out of scope regression

1. Switch to **Composition** while someone shares.
2. **Expect**: No screen video tiles (082/083); cameras still fill.
3. PiP (if used): no requirement to change screen fit in this feature (SF-06).

## Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```
