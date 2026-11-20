# Tasks

## 1. Rail-only call controls

- [x] 1.1 Gate `UserPanel`'s embedded `CallControls` with the shell's sidebar visibility condition. Keep the identity card and account menu mounted, and preserve embedded controls on full-width sidebar routes.
- [x] 1.2 Verify from the route and call mounting conditions that a live call on `/account` uses the floating player without a squeezed embedded row, while normal routes retain their current controls.

## 2. Validation

- [x] 2.1 Run `openspec validate fix-account-settings-call-controls-overlap --strict` and resolve errors.
- [x] 2.2 Run the frontend lint and build scripts and resolve failures introduced by this change.
