# Contract: UI shell — rail, context delete, media

## Server rail

- Vertical list of member servers; icon = initials (2 chars) from name.
- Active server visually distinct.
- Click selects server; channel list refreshes.
- Hidden in stage-mode with channel column.
- **No** server switcher in channel-column header (name only).

## Context menu

- Targets: channel row (text/voice), server rail item (and optional header name for server delete only).
- Desktop: `contextmenu`; narrow: long-press (~500ms).
- Items: **Apagar** if permitted (channel: owner|creator; server: owner only).
- Confirm dialog required; cancel no-op.
- Last channel: Apagar disabled or confirm shows error from API 409.

## Voice media

- After `grid.updated` / layout change: reattach all tracks; no leave/rejoin.
- Tile videos: `object-fit: cover; object-position: center`.

## Gravar UI

- Button “Gravar cena…” / “Parar gravação…” per prototype.
- Dialog copy ≈ prototype (Egress vs E2EE).
- Banner when `e2ee_enabled=false` with actor + time + Religar.
- Create voice dialog: key display + copy + custody checkbox gating create.
