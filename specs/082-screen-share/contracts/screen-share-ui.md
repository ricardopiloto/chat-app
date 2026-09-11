# Contract: Screen share UI

## UserPanel — toggle (Grade + live only)

| ID | Rule |
|----|------|
| UP-SS-01 | Show screen-share control only when `voice.live()` and view mode is **Grade** (`grid`). |
| UP-SS-02 | Hide control in **Composição**; do not auto-stop share when hiding. |
| UP-SS-03 | Toggle ON: `getDisplayMedia` / LiveKit screen enable (prefer system audio if offered) → on success call server start + set local `screenOn`. On cancel/failure: no server start. |
| UP-SS-04 | Toggle OFF / track ended (OS): LiveKit disable + server stop. |
| UP-SS-05 | Camera toggle remains independent (081 behaviour). |
| UP-SS-06 | Listen-only permission: screen share disabled (same class as cam if applicable). |
| UP-SS-07 | i18n labels for on/off + aria; catalogs `en` + `pt-BR`. |

## VoiceChannel — Grade seg indicator

| ID | Rule |
|----|------|
| VC-SS-01 | On Grade `.seg-opt`, show share-active indicator iff current channel occupancy has any `screen_on`. |
| VC-SS-02 | Indicator clears when no sharers. |
| VC-SS-03 | Accessible name (e.g. aria-label) when active. |
| VC-SS-04 | Selecting Grade/Composição does not call screen start/stop. |

## Sidebar — channel item

| ID | Rule |
|----|------|
| SB-SS-01 | Voice `a.channel-item` shows share-active indicator when that channel’s occupants include `screen_on`. |
| SB-SS-02 | Visible even if user is on another channel or in Composição. |
| SB-SS-03 | Clears when last share stops / occupancy empty of screen. |

## Composition vs Grade media

| ID | Rule |
|----|------|
| LY-SS-01 | Grade: render ScreenShare video tiles (self + remote); priority over cameras; optional spotlight. |
| LY-SS-02 | Composição: do **not** render ScreenShare video tiles in scene/bank. |
| LY-SS-03 | Composição: continue playing ScreenShareAudio (and other call audio) when present. |
| LY-SS-04 | PiP: camera-only (unchanged filter). |
