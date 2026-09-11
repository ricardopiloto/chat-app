# Feature Specification: Restore Reliable Webcam Display After Screen-Share Work

**Feature Branch**: `091-fix-webcam-attach`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Alguma alteração que fizemos para implementação do screen-share ([082](../082-screen-share/)) quebrou o fluxo de visualização da webcam. Por vezes quando eu abro a chamada e abro a camera, não aparece nada na visualização. Se eu saio da chamada e volto ambas as cameras volta a funcionar, se eu inicio um compartilhamento de tela as cameras voltam a funcionar também."

**Related**: [082-screen-share](../082-screen-share/), [083-grade-screen-tiles](../083-grade-screen-tiles/), [085-screen-share-fit](../085-screen-share-fit/), [086-fix-spotlight-layout](../086-fix-spotlight-layout/), [088-clear-ended-screen-tile](../088-clear-ended-screen-tile/).

---

## Engineering diagnosis (screen-share era → blank webcams)

### How screen share works today (product + wiring)

| Layer | Behavior |
|-------|----------|
| **Product (082)** | Start/stop share only in **Grade**; Composition shows **cameras only** (share audio may still play); no auto mode switch; camera state independent of share; multi-share allowed; local self screen tile in Grade. |
| **Capture / publish** | `VoiceSession.toggleScreenShare` → LiveKit `setScreenShareEnabled`; local preview element `localScreenVideoEl`; occupancy `screen_on`. |
| **Grade model (083)** | Unified tiles: cameras then screens (`cam:{id}` / `screen:{id}`). Spotlight (086) can restructure Grade DOM. |
| **Layout bind** | `VoiceChannel.layoutMedia()` places remote cam/screen tracks into Grade tile or Composition slot DOM nodes; local camera uses a **page-owned** `localVideoEl` preview element. |
| **Teardown (088)** | Track unsubscribe / participant leave clears screen maps so empty «Tela» tiles should disappear. |

Screen share intentionally **forked** the media layout path: separate maps for `remotesCam` vs `remotesScreen`, Grade tile keys, and a second local preview (`localScreenVideoEl`). Camera display now depends on that same `layoutMedia` + tile-ref pipeline.

### Symptom ↔ mechanism (why the workarounds “fix” it)

| Observed workaround | What it likely forces | Implication |
|---------------------|----------------------|-------------|
| **Leave + rejoin** | Full reconnect: new room join, `onLocalTrack` for camera, remote resubscribe, fresh Grade/Composition DOM | Capture often works; **first-time / mid-session bind** is broken or raced |
| **Start screen share** | `screenOn` flips → `refreshGradeLists()` → Grade tile list changes → `CameraGrid` remounts tile nodes → `attachGradeTile` refills the tile element map → `layoutMedia()` runs again | Remotes and local bind **succeed on a later layout pass**; share is an accidental **rebind catalyst**, not a camera requirement |

So the defect is **not** “camera hardware fails until share.” It is **scene attach / rebind flakiness** introduced while evolving layout for screen tiles.

### Likely defect classes (for planning; verify in implement)

1. **Split brain for local camera preview**  
   Session layer can create/attach a local camera element when toggling camera mid-call, while the voice page keeps its **own** `localVideoEl` used by `layoutMedia`. If the page copy is never updated (e.g. mid-call enable does not notify the page the way join’s `onLocalTrack` does), layout will never mount self-view—until a full rejoin recreates both.

2. **Race: layout before Grade/Composition DOM refs exist**  
   Track subscribe / local track callbacks call `layoutMedia()` immediately. Grade tile hosts are registered asynchronously via `attachGradeTile` / `attachSlot`. If layout runs when the host map is empty, video is skipped (`node` missing). Without a **guaranteed re-layout when hosts mount**, video stays blank until something remounts tiles (screen share start is one such remount).

3. **Tile-list / spotlight remounts change hosts without always rebinding cameras**  
   Screen share, spotlight, and screen-tile clear (088) change the Grade tree. Camera bind must be **idempotent and re-run** whenever hosts appear or move—not only when tracks first arrive.

4. **Composition vs Grade**  
   Same `layoutMedia` serves both modes with different host maps (`slotEls` vs `gradeTileEls`). A mode switch or delayed grid occupancy can hit the same “layout once, hosts later” gap.

These align with 082’s clarifications (camera independent of share; screens Grade-only) while explaining why share start still “wakes” cameras as a side effect of Grade remount/rebind.

### What 091 must fix (outcome)

- Cameras MUST bind reliably on join and when camera is turned on **mid-call**.
- Layout MUST re-run when camera/screen **hosts become available** (not only when tracks arrive).
- Local preview used for display MUST stay **coherent** between session controls and the voice page layout.
- Screen share MUST remain a **non-required** path for camera visibility; share start/stop MUST NOT be the recovery ritual.

---

## Problem / Goal

**Problem**: After screen-share related work, **webcam video sometimes never appears** in the call view even when camera is **on**. Leave/rejoin or starting screen share restores video (often for **both** participants’ cameras).

**Goal**: Webcam video MUST appear reliably when the camera is on—on first join and mid-call toggle—**without** leave/rejoin or starting screen share. Screen share and Grade screen tiles MUST keep working.

## Clarifications

### Session 2026-09-10

- Q: How does the failure present relative to screen-share work? → A: Intermittent blank webcam while cam-on; **leave/rejoin** or **start screen share** restores cameras (including “both cameras”); treat as **attach/rebind regression** from screen-share layout wiring, not dead capture.
- Q: Spec posture after engineering review? → A: Keep product FRs; add diagnosis above; strengthen requirements so mid-call cam enable, host-mount rebind, and local/remote coherence are explicit acceptance targets.
- Q: Em que modo o ecrã fica em branco com câmara ligada? → A: Em **ambos** — Composition e Grade; aceitação e SC devem validar os dois modos (não Composition-only nem Grade-only).
- Q: Superfícies fora de Composition/Grade (PiP / flutuante)? → A: **PiP funciona**; problema é só Composition e Grade — PiP / pré-visualização flutuante **fora de âmbito** desta feature.
- Q: Blank momentâneo ao remount (spotlight / share)? → A: Blank **breve (≤ ~1 s)** aceitável se o vídeo recuperar **sem** acção do utilizador; blank permanente ou que exija rejoin/share continua a falhar.
- Q: Tempo até o vídeo aparecer após cam-on / join live? → A: **≤ ~2 s** após cam-on / call live em Composition e Grade (primeira ligação / toggle; remount continua ≤ ~1 s).
- Q: Limiar de 2 s também para câmara remota? → A: Local **≤ ~2 s**; remoto **≤ ~2 s após** track disponível **e** host (tile/slot) montado (latência de rede/SFU fora desse orçamento local).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Camera shows on open without workarounds (Priority: P1)

As a participant who joins a call and turns the camera on, I want my webcam (and peers’ webcams) to appear in the call view the first time—without leaving/rejoining or starting a screen share to “kick” the video.

**Why this priority**: Core regression; leave/rejoin and share-start are unacceptable as normal recovery.

**Independent Test**: Join call → enable camera (or join with camera on) **repeatedly**; confirm video in **both** Composition **and** Grade (PO-confirmed: blank occurs in both) with **no** leave/rejoin and **no** screen share.

**Acceptance Scenarios**:

1. **Given** I join a voice/video call and turn camera **on**, **When** I look at Composition or Grade, **Then** my webcam video is visible in the expected camera surface within **~2 s** (not an empty tile/slot while cam-on is true).
2. **Given** I joined with camera already preferred on, **When** the call becomes live, **Then** webcam video appears within **~2 s** without an extra leave/rejoin.
3. **Given** the camera was on but video was missing (pre-fix failure mode), **When** the fix is in place, **Then** I never need to start screen share solely to make cameras appear.
4. **Given** I joined with camera **off**, **When** I turn camera **on mid-call** from the user panel, **Then** self-view appears within **~2 s** without leave/rejoin or starting share.

---

### User Story 2 - Peer cameras and both sides stay reliable (Priority: P1)

As a participant in a two-person call, I want **both** my camera and the other person’s camera to show consistently when each has camera on—matching the report that leave/rejoin restores “ambas as cameras.”

**Why this priority**: Failure is not only self-view.

**Independent Test**: Two users with cameras on; both show without rejoin or share-start.

**Acceptance Scenarios**:

1. **Given** two participants both have camera on, **When** either opens the call view under normal conditions, **Then** both webcams are visible without leave/rejoin.
2. **Given** a peer turns camera on while I am already in the call, **When** their camera track is available and their camera surface host is mounted, **Then** their camera surface shows video within **~2 s** without me starting a screen share.
3. **Given** Grade tiles appear or change (e.g. after layout settle), **When** remote camera tracks were already subscribed, **Then** remote video still ends up visible (no permanent miss if layout ran before the tile host existed).

---

### User Story 3 - Screen share still works and is not required for cameras (Priority: P2)

As a participant, I want screen share to remain usable, and cameras to work **independently** of whether anyone is sharing.

**Why this priority**: Guard against fixing cameras only by piggybacking on share remounts, or breaking share.

**Independent Test**: Cameras with zero shares; start/stop share; cameras stay; no ghost screen tile ([088](../088-clear-ended-screen-tile/)).

**Acceptance Scenarios**:

1. **Given** no screen share is active, **When** cameras are on, **Then** webcam video still appears.
2. **Given** cameras are showing, **When** I start and later stop screen share, **Then** cameras remain visible and share tiles behave correctly.
3. **Given** I start screen share, **When** share begins, **Then** share still works; cameras already on stay visible (share must not be the only wake path).
4. **Given** Composition with an active remote share, **When** I stay in Composition, **Then** I still see **camera** video (no screen tiles required); switching to Grade can show screens without blanking cameras.

---

### Edge Cases

- Intermittent failure (“por vezes”): acceptance uses **repeated** trials (SC-001).
- Composition ↔ Grade with cameras on: no permanent blank surfaces.
- Spotlight / screen-tile add/remove: camera hosts may move; video must rebind.
- Brief blank (≤ ~1 s) during Grade remount is acceptable **if** video restores without user action; longer or permanent blank is a failure.
- Listen-only / camera off: no camera surface required; must not break others.
- Rapid cam toggle: video returns when turned on again without rejoin.
- Local screen preview and local camera preview: both may exist in Grade; camera must not be orphaned when screen mounts.
- Floating PiP / out-of-scene camera preview: **out of scope** (PO: PiP already works; defect is Composition and Grade only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a participant’s camera is **on**, the product MUST show their **webcam video** in **Composition and in Grade** (blank failure reported in both modes) without requiring leave/rejoin.
- **FR-002**: Webcam display MUST succeed **without** starting screen share; screen share MUST NOT be a required catalyst for camera visibility.
- **FR-003**: In multi-participant calls, **local and remote** webcams that are on MUST both be displayable under normal conditions.
- **FR-004**: Switching Composition ↔ Grade with cameras on MUST keep or restore webcam video without leave/rejoin.
- **FR-005**: Screen-share start/stop MUST continue to work; fixing cameras MUST NOT remove Grade screen-share behavior from 082/083.
- **FR-006**: Camera on/off controls MUST continue to reflect and control camera state; the defect is **missing scene video while cam-on**.
- **FR-007**: Intermittent blank-on-first-open MUST be eliminated in acceptance trials (SC-001)—not merely documented as rare.
- **FR-008**: Turning camera **on mid-call** MUST result in self-view appearing in the scene (same as join-with-camera), without depending on share start or rejoin.
- **FR-009**: Whenever a camera (or screen) **display host** becomes available in the DOM (tile/slot mount), the product MUST **re-attempt** placing any already-known local/remote camera video into that host—layout MUST NOT be one-shot at track-arrival only.
- **FR-010**: Local camera preview used for on-stage display MUST stay **consistent** with the session’s enabled camera track (no permanent split where session thinks cam is on / has a preview but the voice view never mounts it).
- **FR-011**: Starting or stopping screen share MUST NOT be required to refresh camera binds; if share remounts Grade, cameras MUST still remain correct afterward (including after share ends per 088).
- **FR-012**: Scope of display surfaces for this fix is **Composition and Grade only**. Floating PiP (or equivalent out-of-scene preview) MUST NOT be required to change for acceptance; regressions to a working PiP MUST be avoided if touched incidentally.
- **FR-013**: After a Grade remount catalyst (e.g. start/stop share, spotlight toggle), a **transient** blank of at most **~1 second** is acceptable if webcam video returns **without** leave/rejoin or starting share; blank that persists beyond that or needs a user workaround MUST be treated as failure.
- **FR-014**: After camera is **on** and the call is live, local webcam video MUST appear in Composition and Grade within **~2 seconds** under normal conditions (permission already granted / cam-on shown)—not only “eventually” after a remount catalyst.
- **FR-015**: For a **remote** participant’s camera, once their video track is available to the viewer **and** the corresponding Composition/Grade host is mounted, video MUST appear within **~2 seconds**. Network/SFU delay before the track is available is **outside** that local attach budget; permanent blank after track+host ready remains a failure.

### Key Entities

- **Webcam / camera surface**: Composition slot or Grade camera tile showing face video.
- **Cam-on state**: Camera enabled (may be true while video is still blank—today’s bug).
- **Display host**: DOM mount point for a tile/slot (`attach` target).
- **Forced refresh catalysts (today)**: Leave/rejoin and screen-share start—must become unnecessary for cameras.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In **10** consecutive manual trials of join + camera on (no screen share, no leave/rejoin mid-trial), webcam video appears within **~2 s** in **10/10** runs for the local user in **Composition**, and separately in **10/10** runs in **Grade** (both modes required).
- **SC-002**: In a two-user call with both cameras on, both webcams are visible to each participant in **100%** of quickstart runs without leave/rejoin and without starting screen share; remote attach meets FR-015 (≤ ~2 s after track + host ready).
- **SC-003**: With zero screen shares, cameras still work in **100%** of SC-001/SC-002 runs.
- **SC-004**: Start then stop screen share does not blank cameras afterward in **100%** of checks; share itself still works.
- **SC-005**: No reviewer relies on “leave and rejoin” or “start screen share” as the normal way to make cameras appear.
- **SC-006**: In **5** trials of join with camera **off** then enable mid-call from the panel, self-view appears within **~2 s** in **5/5** without rejoin or share.
- **SC-007**: After Grade remount catalysts (start share, toggle spotlight if available), cameras that were on remain visible in **100%** of checks—allowing at most a **~1 s** transient blank that self-recovers (FR-013).

## Assumptions

- Root cause is a **regression** from screen-share layout/bind wiring (082+), not a product decision to hide cameras.
- Workarounds are **rebind catalysts**; the fix makes the normal cam-on / join / host-mount paths equally reliable.
- Composition and Grade are both in scope; blank webcam was observed in **both** (PO confirmation 2026-09-10).
- Floating PiP is **out of scope** (PO: already works correctly).
- Capture permission success is assumed when UI shows cam-on; blank tiles with cam-on remain in scope.
- Planning should verify the defect classes in the diagnosis section (split local preview, host-mount race, remount rebind) and fix without removing 082 product rules.

## Comparison note (pre- vs post-complement)

| Topic | Original 091 | After engineering review |
|-------|--------------|---------------------------|
| Symptom + workarounds | Yes | Yes (unchanged product intent) |
| Why share-start helps | Implied | Explicit: Grade remount → re-layout |
| Mid-call cam enable | Implicit | **FR-008 / SC-006** |
| Layout vs DOM host timing | Deferred to plan | **FR-009** as requirement |
| Local preview coherence | Soft assumption | **FR-010** |
| Screen-share feature integrity | FR-005 | Plus FR-011 / diagnosis of forked layout path |
