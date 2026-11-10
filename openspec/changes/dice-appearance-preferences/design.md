# Design

## Context

See `proposal.md` — Why. Current state:

- Rolls: `POST /api/channels/{id}/dice` builds encrypted `dice_roll` content (`notation`, `rolls`, optional `faces`, etc.) and broadcasts `message.new`.
- Overlay: `DiceOverlay` + singleton `diceBoxHost` (`@3d-dice/dice-box-threejs`) with `{ assetPath, sounds: false }` only.
- Account preference pattern already exists for toolbar faces (`account_dice_toolbar` + `/api/auth/dice-toolbar`); this feature is **per channel**, so a different key and API shape.

Library config already supports `theme_colorset`, `theme_customColorset`, `theme_texture`, `theme_material`, `sounds`.

## Goals / Non-Goals

**Goals:**
- Persist appearance per `(account_id, channel_id)`; embed snapshot on each roll; apply on live overlay for all viewers.
- UI in Dice channel config to edit preset/custom colour, material, texture, sound.

**Non-Goals:**
- Viewer-local mute that overrides the roller’s snapshot (follow-up).
- Editing appearance from Text channel composer popover in this round (API still works for Text channels when rolling; UI primary surface is Dados).
- Replaying 3D overlay from history.
- Per-die colours within one roll; surface felt theme (`theme_surface`).
- Changing RNG or toolbar checklist behaviour.

## Decisions

### D1. Table `account_channel_dice_appearance`

Columns: `account_id`, `channel_id` (composite PK), JSON or typed columns for appearance, `updated_at`. Cascade with account/channel delete like other membership-scoped rows.

Alternative rejected: global account preference only — user asked per channel. Alternative rejected: channel-wide shared skin — user asked per user.

### D2. API on the channel

- `GET /api/channels/{channel_id}/dice-appearance/me` → current user’s preference or defaults.
- `PUT /api/channels/{channel_id}/dice-appearance/me` → upsert after validation; requires membership + ability to use the channel (same bar as reading the channel / rolling).

Shape (illustrative):

```json
{
  "color": { "mode": "preset", "preset": "white" },
  "material": "glass",
  "texture": "",
  "sound": false
}
```

or `{ "mode": "custom", "foreground": "#…", "background": "#…" }` for colour (hex `#RRGGBB`). Curate allow-lists for presets/textures from the library’s known sets (product subset, not every community skin).

Alternative rejected: stuffing this into `/api/auth/dice-toolbar` — wrong scope (account-global, different concern).

### D3. Snapshot on roll, not live lookup by viewers

On `POST …/dice`, load the author’s preference for that channel (or default), validate again, and include `appearance` inside the cleartext JSON that becomes the encrypted `dice_roll` body (same path as today). Viewers decrypt the message and pass `appearance` into the box config before `roll`.

Why: works offline of preference API, stays consistent if the author changes skin later, no N+1 fetches on `message.new`.

### D4. Applying theme in the singleton box

Before each animated roll, set library options from the snapshot (`theme_colorset` **or** `theme_customColorset`, `theme_material`, `theme_texture`, `sounds`). If the box API requires recreate for some keys, document in implementation; prefer update-in-place if the library allows.

### D5. UI placement

Extend the Dice toolbar config panel (gear / checklist area) with an “Aparência” section: preset chips + colour inputs when custom, material select, texture select, sound toggle, save. Load preference when opening a Dados channel.

## Risks / Trade-offs

- [Library recreate cost when switching themes mid-session] → Mitigate: apply config only when snapshot differs from last applied; measure once.
- [Large allow-list of presets/textures] → Ship a curated subset; reject unknown server-side.
- [Encrypted payload size] → Snapshot is small JSON; acceptable.
- [Sound playing for all viewers] → By design; document; viewer mute is a follow-up.

## Migration Plan

1. Migration + API + contracts.
2. Embed `appearance` on new rolls (old messages without field → clients use product default for overlay if somehow animated — live path always gets new field).
3. Frontend preference UI + overlay wiring.
4. Rollback: ignore `appearance` client-side and stop writing preference rows.

## Open Questions

None blocking; exact curated preset/texture lists chosen at implementation from library constants.
