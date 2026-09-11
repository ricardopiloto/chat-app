# Contract: User panel stack layout (084)

**Feature**: [084-user-panel-stack](../spec.md)  
**Scope**: Frontend shell `UserPanel` + CSS. No HTTP API.  
**Extends**: Idle Discord-style single-row from [078](../../078-user-panel-discord/contracts/user-panel-discord.md); call icons present on the panel today (leave/cam/screen) remain in product — only placement changes when stacked.

## Layout — single-row (default when name fits)

```text
[ identity: avatar+dot | handle / online ]  [ leave? mic deafen cam screen? ]  [ settings ]
```

(Exact idle/in-call icon set follows current product rules; Settings remains at the trailing edge of the bar.)

## Layout — stacked (name would fall below min readable width)

```text
              [ leave? mic deafen cam screen? ]     ← centered on panel width
[ identity: avatar+dot | handle / online ]  [ settings ]
```

## MUST

| ID | Rule |
|----|------|
| UPS-01 | Stack MUST activate when single-row would leave the handle below `--user-panel-name-min` (default `6ch`), not solely by icon count or “always in call” |
| UPS-02 | When stacked, call/action controls (leave, mic, deafen, cam, screen) MUST sit on an **upper** row, **horizontally centered** within `.user-panel` |
| UPS-03 | When stacked, **Settings** MUST remain on the **lower** row with identity; MUST NOT move to the upper row |
| UPS-04 | When stacked, identity MUST retain enough width that the handle stays recognizable (ellipsis OK above the min floor) |
| UPS-05 | Control behaviors MUST be unchanged vs pre-084; only arrangement may change |
| UPS-06 | When the name fits again on a single row (with hysteresis), layout SHOULD return to single-row (no permanent empty upper row) |
| UPS-07 | Increasing panel height MUST **reflow** `.shell-nav` (channel list / row above cedes space); absolute overlay over the channel list is forbidden |
| UPS-08 | Account menu via identity and via Settings MUST work in both layouts |
| UPS-09 | Prefer one centered icon row at existing compact control sizes; avoid wrapping icons to a second icon line unless unavoidable |

## Non-goals

- Backend / LiveKit / occupancy API changes
- Redesign of which call actions exist
- Pixel-perfect Discord theming
- Moving Settings into the centered upper strip
