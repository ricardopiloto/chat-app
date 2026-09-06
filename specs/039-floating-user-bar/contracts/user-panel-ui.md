# Contract: User panel UI

## Placement

- Fixed strip at the **bottom of the sidebar column** (Discord-like user area).
- Visible on all authenticated shell screens where the sidebar (or mobile drawer containing it) is available.

## Contents (always)

| Element | Behavior |
|---------|----------|
| Avatar | Current user; online indicator (always online this release) |
| Handle | Display name |
| Click avatar/name | Opens existing account menu (avatar upload, logout) |
| Settings control | Same account menu until dedicated settings exist |

## Call control group

| Mode | Visibility |
|------|------------|
| Not in call | Mic, deafen, camera (+blur), leave — **visible, disabled** |
| In call + viewing active voice stage | Call group **hidden**; only identity + settings |
| In call + elsewhere | Call group **visible, enabled**, mirrors live state |

## Account duplication

- TopBar MUST NOT retain a second account entry point after this feature.
