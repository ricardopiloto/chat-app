# Feature Specification: Clear Left Participant Camera from Stage

**Feature Branch**: `094-clear-left-camera-tile`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Outro comportamento que gostaria de corrigir. Atualmente quando um usuário sai da chamada e ele estava com a camera aberta, nós guardamos o estado do ultimo frame da camera e ele fica congelado na posição, eu quero que quando essa situação aconteça, a imagem/camera do usuário seja removida da composição/grade."

**Problem**: When a participant **leaves the call** while their **camera was on**, other people (and sometimes the local stage) keep seeing that person’s **camera tile with the last video frame frozen**—as if they were still seated. The stage behaves as if the camera seat still exists.

**Goal**: Leaving the call MUST **clear** that participant’s camera image (no frozen last frame) from **Composição**, **Grade**, and the **floating voice PIP / mini camera chrome**. Grade and PIP drop the tile and reflow; Composição may show an empty/free seat **without** video.

**Related**: Voice occupancy / unload leave ([087](../087-disconnect-on-unload/)); webcam attach ([091](../091-fix-webcam-attach/)); parallel cleanup for ended **screen** tiles ([088](../088-clear-ended-screen-tile/)).

## Clarifications

### Session 2026-09-11

- Q: Which surfaces must clear the departed camera? → A: **Composição + Grade + floating PIP / mini camera chrome** (not stage-only).
- Q: How soon must the frozen camera disappear after leave? → A: **Within ~2 seconds** after leave is observable to the viewer.
- Q: After leave, what replaces the departed camera cell? → A: **Grade + PIP**: tile gone + reflow; **Composição**: seat may become empty/free with **no frozen video**.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Peer leave clears their frozen camera (Priority: P1)

As someone watching Composição, Grade, or PIP, when a participant who had their camera on **leaves the call**, I want their **live/frozen camera image gone**—not a last frame stuck in place.

**Why this priority**: Core reported bug—ghost frozen camera after leave.

**Independent Test**: Two users in a voice channel; A enables camera; B sees A’s live camera; A leaves; within ~2s B sees no frozen frame of A on Composição/Grade/PIP (Grade/PIP tile gone; Composição at most empty/free seat).

**Acceptance Scenarios**:

1. **Given** peer A is in the call with camera on and I see A’s live camera in Composição, Grade, or the floating PIP, **When** A leaves the call, **Then** A’s camera video is **cleared** within ~2 seconds (no frozen last frame).
2. **Given** A left and I am in **Grade** or viewing **PIP**, **When** the UI updates, **Then** A’s camera tile is **gone** and the layout reflows—no empty video cell for A.
3. **Given** A left and I am in **Composição**, **When** the UI updates, **Then** A’s seat shows **no video** (may become empty/free); it MUST NOT keep A’s last frame or imply A is still on camera.
4. **Given** A leaves via hang-up / leave control **or** by disconnecting (including closing the tab / unload paths already covered by leave semantics), **When** occupancy shows A gone, **Then** the above clears happen without requiring my refresh or rejoin.

---

### User Story 2 - My own leave does not leave a ghost for others (Priority: P1)

As a caller with camera on, when I leave the call, I want everyone else to stop seeing my camera—including any last frame—so I am fully gone from Grade/PIP tiles and not frozen on Composição.

**Why this priority**: Same outcome from the leaver’s path; must work for peers.

**Independent Test**: A has camera on; A hangs up; B confirms A’s camera is cleared (not frozen) within ~2s.

**Acceptance Scenarios**:

1. **Given** I am in the call with camera on, **When** I leave the call, **Then** other participants no longer see my camera video in Composição, Grade, or the floating PIP.
2. **Given** I left while camera was on, **When** I rejoin later and turn the camera on again, **Then** a **new** live camera tile appears—no duplicate or leftover frozen tile from the previous session.

---

### User Story 3 - Camera off while still in call is not confused with leave (Priority: P2)

As a participant who only **turns the camera off** but stays in the call, I want the usual “camera off / avatar seat” behavior—not the same removal rules as **leaving** the call—while leave still clears frozen camera video.

**Why this priority**: Avoid regressing mute-camera UX while fixing leave ghosts.

**Independent Test**: A stays in call, turns camera off → seat may show avatar/off state as today; A then leaves → no frozen frame; Grade/PIP drop A; Composição at most empty/free.

**Acceptance Scenarios**:

1. **Given** I stay in the call and turn my camera off, **When** the stage updates, **Then** I am still represented according to existing in-call camera-off behavior (not treated as having left).
2. **Given** my camera was on and I then leave, **When** the leave completes, **Then** my camera video is gone from Composição/Grade/PIP (Grade/PIP: tile removed; Composição: no frozen frame / empty-free OK).

---

### Edge Cases

- Leave while spotlighted / hero seat in Composição: no frozen frame; seat may become empty/free; spotlight must not keep a frozen hero of the departed user.
- Leave with both camera and screen share active: camera clears per this feature; screen tile clears per [088](../088-clear-ended-screen-tile/).
- Rapid leave/rejoin: at most brief flicker; no permanent frozen tile from the prior stay.
- Multiple remotes: one person leaving clears **only** that person’s camera presence; others unchanged.
- Local preview: when I leave, my local camera preview must not remain stuck as a frozen frame on stage or PIP.
- Floating PIP open while browsing another channel: peer leave still clears that peer’s camera from the PIP within ~2s.
- Participant disconnect without graceful hang-up (network drop / unload): same removal once they are no longer in the call.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a participant **leaves the voice call** (graceful hang-up/leave or disconnect that ends occupancy), Composição, Grade, and the **floating voice PIP / mini camera chrome** MUST **clear** that participant’s **camera** video so no last-frame freeze remains visible.
- **FR-002**: **Grade** and **PIP** MUST **remove** that participant’s camera tile and reflow—no blank/frozen video cell for the departed user.
- **FR-003**: **Composição** MUST NOT keep the departed user’s frozen last frame; the seat MAY become an **empty/free** seat with no video (and must not imply they are still on camera).
- **FR-004**: Other participants’ views MUST clear the departed user’s camera without requiring refresh or rejoin.
- **FR-005**: Turning the camera **off** while remaining in the call MUST continue to follow existing in-call camera-off behavior and MUST NOT be treated as leave.
- **FR-006**: Rejoining and enabling camera again MUST show a fresh live camera tile with no zombie/frozen tile from the previous call.
- **FR-007**: If Composição spotlight/hero layout referenced the departed user’s camera, that emphasis MUST clear with the video—no frozen hero frame of someone who left.
- **FR-008**: Cleanup MUST apply in **Composição**, **Grade**, and **floating PIP / mini camera chrome**.
- **FR-009**: After leave is observable to a viewer (peer gone from the call), that peer’s camera MUST clear from those surfaces within **about 2 seconds**—no lasting frozen frame beyond that window.

### Key Entities

- **Camera tile / seat**: Stage or PIP cell showing a participant’s camera (or last attached video).
- **Frozen last frame**: Stale video still shown after the participant or track is gone—must not remain after leave.
- **Empty/free Composição seat**: Allowed after leave in Composição only—no video, no identity as “still on camera.”
- **Leave**: Participant no longer in the call; occupancy and camera video on stage/PIP must end together.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of leave-with-camera-on tests (leaver + viewer), the departed user’s camera video is gone from Composição, Grade, and floating PIP within **~2 seconds** after leave is observable—no frozen last frame remains.
- **SC-002**: In 100% of Grade/PIP checks after peer leave, that peer’s camera tile is removed and layout reflows (no empty video slot for them).
- **SC-003**: In 100% of Composição checks after peer leave, any former seat shows no frozen frame (empty/free seat without video is OK).
- **SC-004**: Camera-off-while-still-in-call checks still show in-call presence (not full leave); leave checks clear camera video—100% distinction in review.
- **SC-005**: Leave → rejoin → camera on shows a single live tile with no leftover ghost from before—100% of retry checks.
- **SC-006**: Spotlight/hero on a user who then leaves does not keep their frozen frame—100% of checks.

## Assumptions

- “Sai da chamada” includes hang-up/leave controls and disconnect paths that already end voice occupancy (including unload/leave behavior from prior work).
- Screen-share tile cleanup when share ends or user leaves remains as specified in [088](../088-clear-ended-screen-tile/); this feature focuses on **camera** ghosts after leave.
- No new product surface or settings toggle is required—correct default behavior only.
- Backend/API changes are not required unless planning finds the client lacks a reliable “participant left / track gone” signal (existing occupancy and media events are assumed sufficient).

## Out of scope

- Redesigning Composição or Grade layout aesthetics (Mesa à Vela / other visual programs).
- Changing what “camera off while still connected” looks like beyond ensuring it is not confused with leave cleanup.
- New notifications or history for who left the call.
- Forcing Composição to always shrink/reflow like Grade (empty/free seats remain allowed).
