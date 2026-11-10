# Proposal

## Why

Dice rolls already animate for everyone watching a channel, but every roller looks the same. Players expect to personalise colour, material, texture, and whether their rolls make sound — and those choices must travel with the roll so everyone sees (and hears) the same presentation.

## What Changes

- Per-account, **per-channel** preference for dice appearance: colour (named presets **or** custom colour picker), material, texture, and sound on/off.
- UI in the Dice channel (toolbar/config area) to edit and preview that preference for the open channel.
- When the user rolls, the server persists a **snapshot** of their appearance for that channel on the `dice_roll` payload so every live viewer renders the same look/sound; other members’ preferences do not override the roller’s snapshot.
- Defaults when unset: current library defaults (white / glass / no texture / sound off), matching today’s behaviour.
- No change to RNG, notation, toolbar face checklist, or when the overlay is allowed (Texto + `dice_animations_enabled` / Dados).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `frontend-v2/text-messaging`: dice appearance preference (per user per channel), UI to edit it, and live overlay that applies the roller’s snapshot (colour, material, texture, sound) from the `dice_roll` message.

## Impact

- **Backend:** new table (account + channel preference), `GET`/`PUT` for the current member’s appearance in a channel, embed validated appearance on `POST …/dice` / `dice_roll` content; contract tests.
- **Frontend:** preference form in Dice channel chrome; `diceBoxHost` / `DiceOverlay` apply theme (`theme_colorset` / `theme_customColorset`, `theme_material`, `theme_texture`, `sounds`) from the roll payload; i18n.
- **Library:** `@3d-dice/dice-box-threejs` already supports these config keys; assets for textures already shipped under `public/dice-box-threejs/`.
