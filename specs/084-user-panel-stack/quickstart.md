# Quickstart: 084-user-panel-stack

Validate stacked user-panel layout and shell reflow. See [contracts/user-panel-stack.md](./contracts/user-panel-stack.md) and [data-model.md](./data-model.md).

## Prerequisites

- Frontend + backend running (typical: `npm run dev` + `cargo run`)
- Authenticated user with a **medium/long handle** (or temporarily set a long handle if the product allows)
- Access to a voice/video channel so leave / cam / screen share can appear

## Build check

```bash
cd frontend && npx tsc --noEmit
```

## Manual scenarios

### Q1 — Idle stays single-row

1. Open the shell **not** in a call (mic/deafen idle + settings only, or minimal set).
2. **Expect**: One row; handle readable; **no** upper centered strip.

### Q2 — Crowded → stack + readable name

1. Join a call so leave + mic + deafen + cam show; if grid view, enable screen-share control too.
2. Use a long enough handle (or narrow the window / panel) until single-row would crush the name.
3. **Expect**: Upper **centered** call icons; lower row = identity + **Settings**; handle still recognizable (not a near-empty ellipsis).

### Q3 — Settings stays on identity row

1. In stacked mode, confirm Settings is beside identity (lower row), not in the centered upper group.
2. Click Settings and identity → account menu still opens.

### Q4 — Reflow (push up)

1. While stacked, note the channel list bottom edge above the panel.
2. **Expect**: Taller panel; list/scroll area **above** the panel remains visible (not covered). Panel must not float over channels.

### Q5 — Return to single-row

1. Leave the call (or hide screen share) so fewer icons show.
2. **Expect**: Panel returns to single-row when the name fits again; height reclaims; no empty upper row stuck on.

## Pass criteria

- [x] UPS-01…09 satisfied in review (implement checklist; confirm visually in Q1–Q5)
- [x] `tsc --noEmit` clean
- [ ] SC-001…006 from [spec.md](./spec.md) acceptable in manual pass
