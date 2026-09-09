# Research: 078-user-panel-discord

## R1 — Defer channel collapse without leaving half-broken drawer

**Decision**: Force **always expanded** channel list: remove toggle UI (`sidebar-channels-toggle`), peek strip, and `channels-collapsed` shell class from live paths; stop applying `mesa.channelsListExpanded === false`. Prefer **ignore** legacy pref (optionally clear on write of other prefs); do not ship a partial drawer.

**Rationale**: Spec FR-001–004 / US1 — collapse is backlog until redesigned; leaving peek/hover would reintroduce the unfinished 055 UX.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Keep collapse code behind a feature flag | Still discoverable/maintenance cost; PO wants it out of product |
| Soft-disable toggle but keep CSS | Risk of accidental re-enable via class leftovers |
| Redesign drawer in this feature | Explicitly out of scope |

---

## R2 — Discord user panel composition vs Mesa call extras

**Decision**:

- **Always** render identity + mic + deafen (icon+visual chevron) + settings.
- Mic/deafen **disabled** when `!voice.live()`; **active** when live (including on stage).
- **Never** render camera/blur on `UserPanel`.
- When `voice.live()` and **not** stage-mode (off-stage): show **leave** between identity and Discord trio.
- When on stage: leave + cam/blur only on stage/voice chrome (existing ownership).

**Rationale**: Clarifications — Discord trio always; cam/blur amendment; leave required off-stage left of trio.

**Alternatives considered**: Hide mic/deafen on stage (039) — superseded. Cam/blur left of trio off-stage — superseded by amendment.

---

## R3 — Decorative chevrons

**Decision**: Mic and deafen use a split-looking control (icon + chevron) with **no menu** on chevron click (or chevron non-interactive / `aria-hidden` decorative). Do not invent device pickers.

**Rationale**: FR-012/013; no device UI in codebase today.

**Alternatives considered**: Wire `enumerateDevices` pickers — out of scope / backlog. Omit chevrons — rejected by clarify (keep visual parity).

---

## R4 — Identity two-line copy

**Decision**: Primary = `me.handle`; secondary = localized **online** status string; avatar green online dot remains. No `_handle` / `@handle` secondary.

**Rationale**: Clarify Q4–Q5 — status line; always online while authenticated.

**Alternatives considered**: Prefixed handle secondary — rejected by PO. Real presence/offline — deferred.

---

## R5 — Single JOIN + camera opt-in (supersedes 032 dual-button UI)

**Decision**: On `VoiceChannel` pre-join (`!live()`):

1. Replace the two primary buttons (`joinCamera` / `joinAudio`) with:
   - Camera **opt-in toggle** (default off)
   - **Blur** control enabled **only when** camera opted in (reuse `CameraBlurMenu` / blur preference)
   - Single primary **JOIN** (icon-forward OK) → `connect(cameraOptIn ? "camera" : "audio")`
2. Keep secondary **test video** as non-primary.
3. Listen-only members: single listen join (no camera opt-in), unchanged spirit.
4. **Lazy preview**: after camera opt-in, optionally start local `getUserMedia` preview; **must not** request camera while default off.
5. On JOIN with camera on: existing `connect("camera")` path (`cam_on: true`, stage rules). Camera off: `connect("audio")` (`cam_on: false`, banco).

**Rationale**: Spec US5 / FR-019–026; 032 **semantics** kept, **presentation** replaced. Contracts in [voice-join-optin.md](./contracts/voice-join-optin.md) supersede [032 prejoin-ui](../032-voice-join-camera-choice/contracts/prejoin-ui.md) for button layout only.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Keep two join buttons | Explicitly replaced |
| Always show Meet-style live preview | Clarify: lazy after opt-in only |
| Blur always on pre-join | Clarify: gate on camera opt-in |

---

## R6 — Backend / API

**Decision**: **No backend changes** required if FE continues to POST join with `cam_on` true/false as today. Reuse 032 auto-assign rules.

**Rationale**: Feature is shell + pre-join UI.

**Alternatives considered**: New join endpoint fields — unnecessary.

---

## R7 — CSS / 075 collapse coupling

**Decision**: After removing `channels-collapsed`, drop or leave inert CSS that only applied under `.shell.channels-collapsed` (including 075 narrow-column centering for cam split on panel—cam leave the panel anyway). Prefer deleting dead collapse selectors when touching the file to avoid zombie UX.

**Rationale**: Collapse deferral + cam off panel makes those rules obsolete for product paths.

**Alternatives considered**: Keep all collapse CSS forever — noise/risk of reintroduction.
