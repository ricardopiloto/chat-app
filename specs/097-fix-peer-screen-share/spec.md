# Feature Specification: Fix Peer Screen Share Visibility

**Feature Branch**: `097-fix-peer-screen-share`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "O compartilhamento de tela não está funcionando corretamente. Eu vejo o meu compartilhamento, mas os usuários não conseguem ver o meu e vice-versa."

**Problem**: Screen share appears to work for the **sharer** (self-preview / own tile), but **other participants do not receive a usable view or hear** that share. Observed peer failure mode: a **screen tile/chip is present**, but its content stays **blank/black** (not live), and **share/system audio** from the share also fails for peers. The failure is **symmetric**: when someone else shares, the local user also gets a blank peer screen tile and no share audio. That breaks the core value of screen share in a multi-person call.

**Goal**: When a participant shares their screen in Grade, **every other participant in the same call** who is viewing Grade MUST see that share’s **live content** inside the peer screen tile (not a blank/black cell) **and** hear share/system audio when the share includes it. Stopping share MUST clear video and audio for everyone as already required by prior features.

**Related**: [082-screen-share](../082-screen-share/), [083-grade-screen-tiles](../083-grade-screen-tiles/), [085-screen-share-fit](../085-screen-share-fit/), [086-fix-spotlight-layout](../086-fix-spotlight-layout/), [088-clear-ended-screen-tile](../088-clear-ended-screen-tile/), [091-fix-webcam-attach](../091-fix-webcam-attach/).

## Clarifications

### Session 2026-09-11

- Q: What does the peer see when share “fails”? → A: **Screen tile/chip appears, but content is blank/black** (not live)—not “no tile at all.”
- Q: Is peer share audio also broken? → A: **Yes — peer video and share/system audio both fail**; both MUST be fixed for acceptance.
- Q: Does any workaround temporarily restore peer share? → A: **No reliable workaround** — stays blank/silent until this fix (leave/rejoin or restart share do not restore peer media).
- Q: How much indicator work is in this fix? → A: **MVP = peer video + share audio**; indicators only smoke/regression (no redesign).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Peers see my live screen share (Priority: P1)

As a participant sharing my screen in Grade, I want **everyone else in the call** to see my shared screen content (live) **and hear share/system audio** when I share with audio, not only my own preview, so the share is useful for the table.

**Why this priority**: Reported defect; without peer visibility, screen share has no multi-user value.

**Independent Test**: Two browsers in the same voice call, both in Grade. A starts screen share (with system/tab audio when the browser allows). A sees own share. B must see A’s live share video and hear share audio without leave/rejoin.

**Acceptance Scenarios**:

1. **Given** A and B are in the same voice call in **Grade**, **When** A starts screen share and capture is allowed, **Then** B’s Grade shows A’s screen tile with **live content** (not a blank/black video cell while A still sees self-share).
2. **Given** A starts share **with** system/tab audio (when the browser supports it), **When** the share is active, **Then** B hears that share audio (not silence while A’s share is clearly producing audio locally).
3. **Given** A is sharing and B sees A’s share live, **When** A’s shared content changes (e.g. window/desktop updates), **Then** B’s tile keeps updating as live video (not stuck blank or permanently frozen).
4. **Given** A is sharing successfully for B (video + audio as applicable), **When** neither party leaves or refreshes, **Then** B’s screen tile stays live and share audio continues for the duration of the share (no need to leave/rejoin or toggle unrelated controls to “unlock” media).
5. **Given** peers currently see blank tiles / silence, **When** they try leave/rejoin or stop/start share as a workaround, **Then** those actions are **not** relied on as a fix—peer live media MUST work on first successful share without those steps.

---

### User Story 2 - I see peers’ live screen shares (Priority: P1)

As a participant in Grade, when someone else starts sharing, I want to **see their live shared screen**, just as they see mine when I share—so the bug is fixed in both directions.

**Why this priority**: User reports the failure is mutual (“vice-versa”).

**Independent Test**: Same two-browser setup; B starts share; A must see B’s live share.

**Acceptance Scenarios**:

1. **Given** A and B are in the same call in Grade, **When** B starts screen share (with share audio when supported), **Then** A’s Grade shows B’s screen tile with **live** content (not blank/black) **and** A hears B’s share audio when that audio was included.
2. **Given** A sees/hears B’s share, **When** B stops sharing, **Then** A’s Grade no longer shows B’s screen share tile/content and share audio from that share stops (consistent with existing stop-share behavior).
3. **Given** cameras work between A and B, **When** only screen share is started, **Then** fixing peer screen visibility/audio MUST NOT require breaking peer camera video or call mic audio to “make share work.”

---

### User Story 3 - Share indicators smoke / no regression (Priority: P3)

As a participant, after peer video/audio work again, I still want existing channel/Grade **“someone is sharing”** indicators to behave no worse than today (smoke check)—this feature does **not** redesign indicators.

**Why this priority**: Clarified as non-MVP; peer live video + share audio are the DoD. Indicators are regression-only.

**Independent Test**: After peer media works, start/stop share and confirm indicators still toggle on/off without new indicator work.

**Acceptance Scenarios**:

1. **Given** peer live video/audio already work for a share, **When** share is active, **Then** existing share indicators still show active sharing (smoke; no new indicator UX required).
2. **Given** A stops sharing, **When** B’s view updates, **Then** share indicators clear along with the screen content as they do today (no lingering empty share cell—088 regression).

---

### Edge Cases

- **Multiple simultaneous sharers**: Each peer must see every *other* participant’s active share(s) and hear their share audio when included; self-preview alone is not enough.
- **Join mid-share**: A participant who joins (or switches to Grade) while someone is already sharing MUST see that existing live share and hear share audio (when present) without requiring the sharer to stop and start again.
- **Composition mode**: Screen **video tiles** remain Grade-only per product rules; this fix does not require showing screen video in Composition. Share **audio**, when present, MUST still be heard by peers in Composition as already specified in 082—and that peer audio path is in scope for this bug because peer share audio currently fails.
- **Blank peer tile**: A present Grade screen cell/chip for the peer without live frames is the reported video defect; success requires that same cell to show live shared content **and** peers to hear share/system audio when the share includes it.
- **Spotlight on a peer’s screen**: If spotlight targets a remote screen share, the spotlighted content MUST be the peer’s live share, not an empty/frozen cell.
- **Camera independence**: Starting/stopping screen share MUST NOT flip camera on/off as a side effect (existing 082 rule).
- **Stop paths**: In-app stop and browser/OS “Stop sharing” still remove the share video **and** share audio for peers (088).
- **Permission denied / capture fail**: If the sharer never successfully starts capture, peers correctly see/hear no share; that is not this bug. This feature addresses cases where the **sharer has a working local share** but peers get blank video and no share audio.
- **No reliable workaround**: Leave/rejoin, full refresh, or stop/start share do **not** restore peer live video/audio today; the product fix MUST make first-share peer media work without those steps.
- **Share without system audio**: If the browser cannot capture system/tab audio, peer **video** must still work; audio acceptance applies only when share audio was successfully included in the share.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a participant successfully starts screen share, **other participants** in the same call who view **Grade** MUST see that participant’s screen tile with **live** shared content (not a blank/black cell).
- **FR-002**: Peer **video and share audio** visibility MUST work **in both directions** (A→B and B→A) under the same conditions, without requiring leave/rejoin, page refresh, or stop/start share as a workaround.
- **FR-003**: A sharer’s ability to see **their own** share MUST NOT be treated as sufficient success; peer visibility **and** peer share audio (when included) are required for the feature to be considered working.
- **FR-004**: Remote screen **video** (and share audio when included) MUST be usable for peers within a short observable wait after share start (typically a few seconds on a normal connection), on the **first** successful share—not only after leave/rejoin or unrelated toggles.
- **FR-005**: Ending screen share MUST remove that share’s content/tile from **peers’** Grade views (not only from the sharer’s self-view), consistent with [088](../088-clear-ended-screen-tile/), and MUST stop peer share audio from that share.
- **FR-006**: Screen **video** presentation remains **Grade-only**; this fix MUST NOT require Composition to show screen video tiles.
- **FR-007**: Peer camera video and normal call mic audio that already work MUST remain usable; the screen-share fix MUST NOT regress those as the cost of fixing share.
- **FR-008**: A participant who enters Grade (or joins the call) while a peer is already sharing MUST see that active share’s live content (and hear share audio when present) without the sharer needing to restart share solely for the newcomer.
- **FR-009**: Existing active-share indicators (Grade / channel) MUST **not regress** after the media fix (smoke: still indicate active share while sharing and clear on stop). Indicator **redesign** or strict “indicators prove peer-usable media” alignment is **out of MVP scope** for this feature.
- **FR-010**: When a share includes system/tab audio (browser-supported path), **peers MUST hear that share audio** while the share is active (including in Composition, per 082); silence for peers while the sharer’s share is producing audio is a failure for this feature.

### Key Entities

- **Screen share session**: One participant’s active desktop/window/tab capture published into the call (video plus optional system/tab audio); audible/visible to self and to peers while active.
- **Peer viewer**: Another participant in the same call expecting live shared-screen **video** in Grade and share **audio** when included.
- **Self-preview**: The sharer’s local view of their own share (currently works for video; insufficient alone).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-person Grade call, after either party starts screen share, the **other** party sees live shared **video** in **under ~5 seconds** on a normal local/dev setup (no leave/rejoin).
- **SC-002**: In a bidirectional check (A shares then stops; B shares then stops), **both** directions show live peer video while sharing and clear when stopped—**100%** of those four phases pass in a manual two-browser run.
- **SC-003**: A third participant joining mid-share (or switching to Grade mid-share) sees the active peer share without the sharer restarting, in the same ~5s observable window.
- **SC-004**: After the fix, mutual **camera** video and normal call mic audio in the same call still work in a smoke check (no regression to “make share work”).
- **SC-005**: Stop-share still leaves **no** ghost empty screen tile for peers (regression guard vs 088).
- **SC-006**: When share includes system/tab audio, peers hear that audio within the same ~5s window after share start (Grade; Composition still hears share audio with no screen tile), and audio stops when share ends—verified in the bidirectional manual run.

## Assumptions

- Screen share product rules from [082](../082-screen-share/) still apply (Grade-only start/stop and screen tiles; multi-share allowed; camera independent of share; no auto mode switch; share audio may play in Composition).
- The reported defect is about **peer reception of an already-successful local share** (blank peer video tile **and** missing peer share audio), not about browser permission denial or unsupported capture.
- Observed “cannot see” means a **present** peer screen tile/chip that stays **blank/black**; success requires **usable live content in that tile**. Peer share/system audio failure is co-equal acceptance, when audio was included in the share.
- Floating PIP / non-Grade surfaces are out of scope unless they already show screen share today; Grade is the primary surface for this bug (Composition remains in scope only for **hearing** share audio).
- E2EE / media encryption remains enabled as in the current product; the fix must work in the same security posture users already use for voice/video.
- Manual two-browser verification is the primary acceptance method for this defect (consistent with prior media layout fixes).
- Unlike some prior media bugs (e.g. 091), **leave/rejoin or restart share is not a temporary unlock** for peer screen media; planning should not assume a “rebind on remount” workaround path is already working for peers.
- **MVP DoD** for 097 is peer **live screen video** + peer **share/system audio** (when included). Share **indicators** are smoke/regression only—no redesign in this feature.
