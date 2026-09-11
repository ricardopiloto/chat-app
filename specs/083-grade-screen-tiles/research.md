# Research: 083-grade-screen-tiles

## R1 — Single equal CSS grid (kill bands)

**Decision**: Replace `grade-stage-split` / `.grade-screen-band` / `.grade-camera-band` with one `.stage` grid using the same column algorithm as legacy Grade (`min(3, n)` cols, equal `1fr` tracks). Tile count `n = cameras + screens`.

**Rationale**: Spec FR-001/002/004 and user feedback — fixed screen band crushes cameras.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Keep bands but raise camera band flex | Still two regions; fails “like another camera” |
| Screen tiles larger by default (subtle priority) | Clarifications require equal share without spotlight |

---

## R2 — Tile order: cameras then screens

**Decision**: Build the Grade tile list as `[...cameraTiles, ...screenTiles]`. Camera order = existing in-call / `gradeCameraIds` order. Screen order = stable sharer order (`gradeScreenIds`).

**Rationale**: Clarify Q2 option B.

**Alternatives considered**: Per-participant cam+screen interleaved; screens first — rejected by clarify.

---

## R3 — Tile identity keys

**Decision**: Use distinct attach keys so one account can have two DOM slots: e.g. `cam:${accountId}` and `screen:${accountId}` (or separate maps keyed by account with kind). `layoutMedia` attaches Camera tracks to cam keys and ScreenShare to screen keys.

**Rationale**: FR-003 dual tiles; current separate `gradeScreenEls` / `gradeCameraEls` maps can remain if CameraGrid exposes one list of typed tiles.

**Alternatives considered**: Single identity map — cannot host cam+screen simultaneously.

---

## R4 — Spotlight inside unified grid

**Decision**: Keep local `spotlightId` = account id of a **screen** sharer only. When set, that screen tile gets larger grid area (e.g. `grid-column: span 2` / `grid-row: span 2` or temporary 2-column emphasis) while remaining siblings stay equal `1fr` — **not** a return to screen/camera bands. Clear when that account leaves `screen_on` / track ends. No spotlight control on camera chips.

**Rationale**: Clarify Q1 option A; FR-005.

**Alternatives considered**: Remove spotlight — rejected. Spotlight any tile — rejected.

---

## R5 — Screen chip labeling

**Decision**: Screen tile chip shows handle + share indicator (small `IconScreenShare` and/or short i18n string e.g. `voice.screenTile` / “Tela”). `aria-label` includes both. Camera chips unchanged (handle only).

**Rationale**: Clarify Q3 option B; FR-003a.

---

## R6 — Scope freeze from 082

**Decision**: No changes to LiveKit publish, occupancy API, Composition (no screen video + audio continues), sidebar/Grade indicators, or panel Grade-only share toggle.

**Rationale**: Spec relationship + FR-006.
