# Design

## Context

See proposal.md for why. `icon-map.ts` maps the Material name `group` to Lucide `Users`: one full figure and a second figure behind it, to the right. The shell mockup's members button (`code.html`, channel header, glyph `group`) is the three-figure symbol. Lucide already ships that composition as `UserRoundGroup` (centre figure, two smaller figures beside it, rounded shoulders). `UserGroup` is the same layout with angular shoulders. `groups` stays `UsersRound`; that name means several clusters and is used elsewhere.

## Goals / Non-Goals

**Goals:**

- The members toggle draws three people, matching the mockup's `group` as closely as the Lucide set allows.

**Non-Goals:**

- Replacing Lucide with Material Symbols, or redrawing the glyph by hand.
- Changing the size, position or pressed state of the button. The mockup draws it at 19px in the channel header; the app keeps the sizes it already uses.
- Changing the `groups` mapping.

## Decisions

1. **Map `group` to `UserRoundGroup`.** Rounded shoulders are closer to Material Symbols Outlined than `UserGroup`. `Users` stays available for other names that already mean two people, such as `switch_account`.

2. **One map entry, both buttons.** The top bar and the channel header already pass `name="group"`. The settings entry that lists members does too. Changing the map fixes all of them without editing each button.

## Risks / Trade-offs

- [The Lucide drawing is still a stroke icon, not the Material ligature] → Accepted. The count and arrangement of figures is what was wrong. The general rule that stroke versus ligature does not, by itself, fail a fidelity grade stays in place.

## Migration Plan

No data change. The next paint of any `group` icon uses the new glyph.

## Open Questions

None.
