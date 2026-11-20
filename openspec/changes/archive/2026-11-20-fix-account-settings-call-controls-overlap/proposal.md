# Proposal

## Why

On `/account`, `AppShell` removes the sidebar but keeps `UserPanel` mounted across the remaining server rail. Its live-call controls therefore squeeze into the rail. `Hosts` also displays the floating call player when the call's channel is not the current route, leaving two sets of controls near the same area.

## What Changes

- Suppress the embedded `UserPanel` call controls whenever the shell collapses its sidebar to rail-only width, currently the account route.
- Keep the identity card and account menu mounted; use the existing floating player as the call interface while away from the call channel.
- Preserve embedded controls on routes with a full-width sidebar.

## Capabilities

### Modified Capabilities

- `frontend-v2/app-shell`: keep call controls out of the rail-only navigation layout.

## Impact

Changes only `frontend/src/shell/AppShell.tsx` and `frontend/src/shell/UserPanel.tsx`. No backend, CSS, or localization changes. The floating player remembers `mesa.pip.corner`; a saved bottom-left corner can still place the player over the server rail and account card. Adjusting its placement is a separate follow-up.
