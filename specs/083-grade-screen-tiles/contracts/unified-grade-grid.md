# Contract: Unified Grade grid

## Layout

| ID | Rule |
|----|------|
| UG-01 | Grade with shares uses **one** CSS grid of tiles (cameras + screens), not `grade-stage-split` bands. |
| UG-02 | Without spotlight, every tile has equal track sizing (comparable area). |
| UG-03 | Tile order: all camera tiles, then all screen tiles. |
| UG-04 | Account with cam + screen → two tiles (cam in camera block, screen in screen block). |
| UG-05 | Zero screens → same Grade behavior as pre-082 share (cameras only). |
| UG-06 | Zero cameras + screens only → single equal grid of screen tiles. |
| UG-07 | Composition mode unchanged (no screen video tiles). |

## Attach

| ID | Rule |
|----|------|
| UG-08 | Camera/source Camera (+ local cam) attach only to camera tiles. |
| UG-09 | ScreenShare video (+ local screen) attach only to screen tiles. |
| UG-10 | ScreenShareAudio continues via existing audio host (including in Composition). |

## Retirement

| ID | Rule |
|----|------|
| UG-11 | Remove or inert `.grade-screen-band` / `.grade-camera-band` / fixed flex split that crushed cameras. |
