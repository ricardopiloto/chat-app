# Tasks

## 1. Border chrome

- [x] 1.1 Add a desktop-only window edge style (CSS variable or theme token) on the native root / `TitleBar` wrapper, gated by `__MESA_NATIVE__` (or equivalent). Verify: web build has no extra border; `electron:dev` restored window shows a continuous edge.
- [x] 1.2 Wire maximized state on all platforms that use custom chrome (reuse/extend `mesa:window-maximized`) to remove the border while maximized. Verify: maximize hides border; restore brings it back (at least Linux + one of win32/darwin available).

## 2. Check

- [x] 2.1 Smoke against a dark OS theme (or dark wallpaper): window silhouette remains visible; light and dark app themes both acceptable. Verify manually once on the primary Linux desktop environment used for release.
