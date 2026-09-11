# Data Model: 090-revert-mesa-vela

No database entities. Rollback targets are **design tokens** and **UI chrome roles**.

## Entities

### RestoredIdentityTokens (pre-089)

| Group | Restored target (approx.) |
|-------|---------------------------|
| Primary accent | Blurple `#9184d9` + prior `--color-accent-100..900` |
| Accent-2 | Lavender `#a7a1db` + prior ramp (not jade) |
| Surfaces/text | Cool nocturne greys (e.g. bg `#161826`, text `#e9e9ed`) + pre-089 Mesa `--panel` / `--stage` / light aliases |
| Fonts | `--font-heading` / `--font-body` → Inter; no `--font-place` |
| Radius | `--radius-sm/md/lg/pill` only; **no** `--radius-token` product requirement |

### Removed089Artifacts

| Artifact | Action |
|----------|--------|
| Manrope / Fraunces font files + `@font-face` | Remove from product load and disk |
| `.font-place` / place titles | Remove |
| Seat tones / nameplate / `seatToneFor` | Remove |
| Voice `⋯` overflow | Remove; restore inline controls |
| Pill composer + circular amber send | Restore prior composer chrome |
| Jade E2EE chip / amber speaking restyle | Restore prior treatments |

### PreservedNon089Features

Screen share occupancy/tiles, unified Grade, spotlight layout, user-panel stack, unload leave, clear ended screen tile — **unchanged** by this feature.

## State transitions

```text
[Mesa à Vela product (089)]
  → restore tokens + Inter
  → restore voice header chrome
  → strip seats/place/composer/e2ee/speaking 089 skins
  → delete unused font assets
  → regression smoke 082–088
[pre-089 visual identity + later feature behaviors]
```

## Validation rules

- Steady state must not read as amber/parchment/jade-led (SC-001).
- Header must not require `⋯` for blur / Editar cena (SC-002).
- Screen tiles keep post-085 contain behavior (SC-004).
