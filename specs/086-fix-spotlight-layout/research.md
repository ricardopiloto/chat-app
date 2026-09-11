# Research: 086-fix-spotlight-layout

## R1 — Root cause: span into missing rows

**Decision**: Stop using `grid-column: span 2` / `grid-row: span 2` for spotlight. That style runs against `grid-template-rows: repeat(N, …)` where `N` is often `1`, so the spotlight cell is placed outside usable tracks and collapses (~8px).

**Rationale**: Matches reported DOM (`grid-area: span 2 / span 2` + `repeat(1, …)` rows; tile at bottom with height ~8px).

**Alternatives considered**: Dynamically add rows to accommodate span — fragile with tile order (cams first); still fights “main + strip” clarify.

---

## R2 — Spotlight-on layout: main stage + bottom filmstrip

**Decision**: When `spotlightId` is set to a screen sharer’s account id, Grade renders:
1. **Main**: that screen tile (flex grow / majority height)
2. **Strip**: remaining tiles (all cameras + other screens), horizontal compact row at **bottom**

When spotlight is null/cleared → restore unified equal CSS grid (083).

**Rationale**: Clarify Q1=A, Q2=A; FR-001–005, FR-009.

**Alternatives considered**: Enlarge cell in same grid; side strip; overlays — rejected by clarify.

---

## R3 — Tile lists while spotlighted

**Decision**:
- `mainTile` = screen tile where `accountId === spotlightId` (if missing, treat as no spotlight / clear)
- `stripTiles` = all other tiles in stable order: cameras first, then remaining screens (083 order within strip)

Spotlight control stays on screen chips (main + strip screens).

**Rationale**: FR-004, FR-006; keep attach keys unchanged (`cam:` / `screen:`).

---

## R4 — CSS structure

**Decision**: Prefer a wrapper e.g. `.grade-stage-spotlight` (`display: flex; flex-direction: column; height: 100%; min-height: 0`) containing `.grade-spotlight-main` (`flex: 1 1 auto; min-height: 0`) and `.grade-spotlight-strip` (`flex: 0 0 auto` with fixed/max height, horizontal grid/flex of small slots). Screen videos keep 085 `.grade-screen-tile` contain rules in both regions.

**Rationale**: Predictable viewport fill; main cannot be crushed by strip.

**Alternatives considered**: CSS grid `1fr auto` on same stage — also fine; flex column is explicit.

---

## R5 — Solo screen / no cameras

**Decision**: If only the spotlighted screen exists (no strip tiles), show main full-height (strip omitted). Spotlight may remain toggled for consistency.

**Rationale**: Edge case in spec; avoid empty strip chrome.

---

## R6 — Scope freeze

**Decision**: No LiveKit/occupancy/Composition/PiP changes. Local `spotlightId` clear-on-stop behavior in VoiceChannel stays.

**Rationale**: FR-008; regression guard US3.
