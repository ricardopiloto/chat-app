# Tasks

## 1. Backend: persistence and API

- [x] 1.1 Add migration `account_channel_dice_appearance` (PK `account_id` + `channel_id`, appearance fields or JSON blob, `updated_at`) and db helpers. Verify: migration applies on empty and upgraded DB.
- [x] 1.2 Implement validate/normalize for colour (preset allow-list **or** `#RRGGBB` custom), material, texture allow-list (incl. empty), sound bool; product defaults. Verify: unit/contract rejects invalid values and accepts defaults.
- [x] 1.3 Expose `GET`/`PUT /api/channels/{channel_id}/dice-appearance/me` (auth + channel access). Verify: contract tests for default, put/get round-trip, isolation across channels, 401/forbidden.
- [x] 1.4 On `POST …/dice`, load author preference (or default) and embed `appearance` in the `dice_roll` cleartext payload before encrypt/persist. Verify: contract dice roll response/WS payload includes appearance; missing preference yields defaults.

## 2. Frontend: types, API, overlay

- [x] 2.1 Add API client + types for dice appearance; parse `appearance` on `dice_roll` content with fallback to defaults. Verify: `tsc --noEmit`.
- [ ] 2.2 In `diceBoxHost` / `DiceOverlay`, apply snapshot (`theme_colorset` or `theme_customColorset`, `theme_material`, `theme_texture`, `sounds`) before each live roll. Verify: two different snapshots in sequence change look/sound without breaking predetermined faces.

## 3. Frontend: Dice channel UI

- [x] 3.1 Add appearance editor in the Dados toolbar config (presets + colour picker, material, texture, sound) loading/saving via the channel API. Verify: save reloads after remount; i18n pt-BR/en present.
- [x] 3.2 Ensure Text-channel rolls still embed appearance from API even without UI in this round. Verify: rolling from Text with a stored preference (set via API or Dados) shows that snapshot on overlay when animations are enabled.

## 4. Integration check

- [ ] 4.1 Smoke: two clients in the same Dados channel — A sets custom skin + sound, rolls; B sees A’s colours and hears sound per snapshot; B’s own preference unchanged. Verify manually once.
