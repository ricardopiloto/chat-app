# Research: 085-screen-share-fit

## R1 — CSS `object-fit: contain` on screen tiles only

**Decision**: Keep global `.slot-media video { object-fit: cover }` for cameras. Add a more specific rule for Grade screen tiles, e.g. `.grade-screen-tile .slot-media video { object-fit: contain; object-position: center; background: #000; }` (or existing slot dark token if one matches “neutro escuro / tipo slot”).

**Rationale**: Spec FR-001/002/007; clarify letterbox A. `contain` shows the full shared frame; dark background fills unused area. 083 already marks screen cells with `.grade-screen-tile`.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Change all `.slot-media video` to contain | Breaks webcam face fill (FR-002 / SC-002) |
| JS resize / canvas letterbox | Overkill; CSS is enough |
| User toggle crop/fit | Out of scope (Assumptions) |

---

## R2 — Scope: Grade screen tiles only

**Decision**: Apply fit only under Grade screen tiles (remote + local preview + spotlight). Do not change PiP, Composition slots, or prejoin webcam preview.

**Rationale**: Clarify Q1 option A; FR-006.

**Alternatives considered**: Align every surface that might show screen video — rejected; PiP is camera-oriented today.

---

## R3 — Local preview inherits same rule

**Decision**: Local screen `<video>` is appended into a `.grade-screen-tile .slot-media` node (`VoiceChannel` + `screen:` tile key). No separate local-only style path required if DOM structure stays as 083.

**Rationale**: FR-003 / US2. Verify in quickstart that local tile matches remotes.

**Alternatives considered**: Inline `el.style.objectFit = "contain"` on attach — fallback only if CSS miss.

---

## R4 — No webcam mirror on screen

**Decision**: Do not apply horizontal flip to screen-share videos. Confirm no `scaleX(-1)` on Grade screen videos (prejoin mirror is unrelated). If any shared video rule mirrors all slot videos, exclude `.grade-screen-tile`.

**Rationale**: Spec Assumptions; screen UI must not appear mirrored.

**Alternatives considered**: Mirror local screen for “consistency with cam” — rejected (illegible UI).

---

## R5 — Spotlight keeps contain

**Decision**: Spotlight only changes grid span/emphasis (083). Fit rule stays on `.grade-screen-tile` so enlarged cells still use `contain`.

**Rationale**: FR-004 / SC-003.

---

## R6 — No backend / media pipeline changes

**Decision**: No LiveKit publish options, occupancy, or track constraints changes for this feature. Presentation-only.

**Rationale**: Spec relationship to 082/083; FR-005.
