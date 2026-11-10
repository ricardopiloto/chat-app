# Proposal

## Why

With the custom title bar / frameless Linux window, the main Electron window has little or no OS-drawn edge. Against a dark desktop theme (or dark wallpaper), the app surface blends into the background and the window boundary is hard to see. A deliberate, theme-aware border restores a clear silhouette without bringing back full native chrome.

## What Changes

- Draw a **1px (or equivalent hairline) window border** around the main Electron window content, using a colour that stays visible in both light and dark **app** themes and against dark **OS** themes.
- Apply only in the native desktop shell (not the web build); only the **main** window (same scope as the custom title bar — not call popout / screen picker).
- When the window is **maximized**, hide or suppress the border so it does not leave a dead strip at the screen edge.
- No change to drag regions, window controls, tray, or hide-on-close behaviour.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `desktop/shell`: main window chrome includes a visible edge/border in the desktop client when not maximized.

## Impact

- Renderer CSS (and possibly a small class on `documentElement` / shell root gated by `__MESA_NATIVE__`).
- May reuse existing `mesa:window-maximized` IPC (already used by `TitleBar` on Linux) so all platforms that need it hide the border when maximized.
- Coordinates with `electron-custom-title-bar` / current `frame: false` (Linux) and hidden title bar (Windows/macOS); does not restore OS frame.
