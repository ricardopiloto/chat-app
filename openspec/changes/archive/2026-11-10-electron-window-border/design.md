# Design

## Context

See `proposal.md` — Why. Current chrome:

- Linux: `frame: false` in `createWindow` — no OS border.
- Windows/macOS: `titleBarStyle: "hidden"` (+ overlay / traffic lights) — system edge is thin or blends with dark DE themes.
- Renderer already wraps the main UI in `TitleBar` when `__MESA_NATIVE__` (`frontend/src/index.tsx`); Linux listens to `mesa:window-maximized`.

## Goals / Non-Goals

**Goals:**
- CSS (or equivalent) hairline around the main native window; theme-token colour; off when maximized.

**Non-Goals:**
- Restoring native `frame: true` / OS decorations.
- Rounded corners / shadow stacks that fight Wayland compositors.
- Borders on popout / screen-picker windows.
- User preference to toggle the border (fixed product default).

## Decisions

### D1. Draw in the renderer, not Electron `BrowserWindow` background tricks

Use a CSS border (or `outline` / `box-shadow: inset`) on the native root wrapper (`html`/`body` class when `__MESA_NATIVE__`, or the `TitleBar` outer shell). Colour from design tokens (e.g. `outline` / `outline-variant`, or a dedicated `--mesa-window-edge` if tokens are too low-contrast on both themes — pick the token that passes a quick light/dark check).

Alternative rejected: re-enable OS frame — undoes custom title bar. Alternative rejected: main-process only — harder to theme with app light/dark.

### D2. Maximized → no border

Toggle a class (e.g. `mesa-window-maximized`) from the existing maximize IPC on **all** platforms that use the custom chrome (extend the Linux-only listener in `TitleBar` if Windows/macOS do not yet subscribe). When maximized, `border-width: 0` (or remove the class that applies the border).

### D3. Scope to main window only

`TitleBar` / native root already excludes call-popout; keep that gate.

## Risks / Trade-offs

- [1px eats content / resize hit-target on Linux frameless] → Keep border inside the window; confirm resize still works at edges.
- [Token too subtle on both themes] → Fall back to a fixed mid-grey / primary-mix edge variable.
- [Double edge on Windows if OS still draws a frame] → Prefer subtle token; verify on win32 once.

## Migration Plan

1. Add CSS + maximized class wiring.
2. Smoke Linux (frameless + dark DE), Windows, macOS restored vs maximized; web unchanged.
3. Rollback: remove class/CSS only.

## Open Questions

None blocking; exact token vs custom CSS variable chosen during implement with a quick contrast check.
