# Feature Specification: Voice Audio & Occupant Presence

**Feature Branch**: `096-voice-audio-presence`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Audio não está sendo transmitido no navegador, ele está capturando o audio (a aura funciona) mas não há nenhum som saindo. Outro ponto um usuário novo conectou na chamada (sem camera) e ele não apareceu em lugar algum, não mostrou nem que estava no banco na composição."

## Clarifications

### Session 2026-09-11

- Q: Audio failure direction (hear others vs others hear me) → A: **C** — both directions must pass acceptance tests (I↔others)
- Q: Cam-off Composition placement + Grade visibility → A: **B** — cam-off always in Composition **bank** (even with free seats); **Grade always shows** every live occupant regardless of camera on/off
- Q: When cam-off enables camera, leave bank? → A: **A** — cam on + free seat → move to a Composition seat; otherwise stay in bank with video

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hear call audio in the browser (Priority: P1)

A member is in a voice/video call. Another participant speaks (or they speak themselves). Speaking indicators / aura may show that audio is being captured and activity is detected, but the member currently hears **no call audio** from the browser. After this fix, microphone audio from other unmuted participants is clearly audible when the listener is not deafened and the browser tab has permission to play sound.

**Why this priority**: Call audio is core product value; silent calls block collaboration even when presence UI seems partially alive.

**Independent Test**: Two browsers on the same voice channel; A hears B and B hears A when both have mic on and neither is deafened, without relying on camera. Deafen/mute still silence as designed.

**Acceptance Scenarios**:

1. **Given** two members in the same live voice channel with mics allowed and neither deafened, **When** member A speaks with mic on, **Then** B hears A’s voice from the browser within a short, human-noticeable delay; **When** B speaks with mic on, **Then** A hears B the same way.
2. **Given** speaking aura / activity is visible for a remote speaker, **When** the listener is not muted/deafened at the product level, **Then** audible playback is present (aura alone is not sufficient).
3. **Given** the listener toggles deafen on, **When** others speak, **Then** call audio is silenced; **When** deafen is turned off, **Then** remote speech is audible again.
4. **Given** a member has the browser tab open and has granted media permissions as required for the call, **When** remote audio is received, **Then** sound plays without requiring a camera to be on.
5. **Given** member A has mic on and is not deafened, **When** A speaks, **Then** other non-deafened members hear A (send path), not only local aura on A’s client.

---

### User Story 2 - Cam-off joiners appear in the call stage (Priority: P1)

A new member joins an active voice call **without camera**. Today they may not appear anywhere—including Composition’s bank—so others cannot see that they are in the call. After this fix, cam-off live occupants appear in the Composition **bank** (not primary seats, even if seats are free), and **Grade always lists/displays every live occupant** whether camera is on or off. Voice roster presence remains consistent with who is in the call.

**Why this priority**: Invisible participants break trust and make moderation, addressing, and stage awareness impossible.

**Independent Test**: Join from a second account with camera off; joiner appears in Composition bank and in Grade without enabling camera. Free Composition seats may remain empty while the joiner is banked.

**Acceptance Scenarios**:

1. **Given** an ongoing Composition call (with or without free seats), **When** a new member joins with camera off, **Then** other members see that person in the Composition **bank** (not a primary seat solely because seats are free; not a total absence).
2. **Given** the same joiner with camera off (or on), **When** others view Grade, **Then** the joiner is always shown as a Grade occupant regardless of camera state.
3. **Given** the same joiner with camera off, **When** others check the voice roster / occupancy UI for that channel, **Then** the joiner is listed as present in the call.
4. **Given** the cam-off joiner later enables camera and a primary Composition seat is free, **When** video becomes available, **Then** they move from the bank onto a free seat with video (no leave/rejoin, no duplicate identity).
5. **Given** the cam-off joiner later enables camera and **no** primary seat is free, **When** video becomes available, **Then** they remain in the bank with video (no duplicate identity).
6. **Given** the cam-off joiner leaves the call, **When** occupancy updates, **Then** they disappear from Composition bank, Grade, and roster presence for that call.

---

### Edge Cases

- Listener has system/OS mute or browser autoplay blocked: product should still attach/play when the platform allows; if the browser blocks audio until a gesture, the member can recover with a normal in-app interaction (e.g. mic/deafen toggle) without leaving the call.
- Local speaking aura works while remote hear-back fails (or the reverse): both publish path and receive/playback path must work for unmuted, non-deafened participants.
- Join with camera off: joiner appears in Composition **bank** even when primary seats are empty; they must not vanish.
- Grade must show cam-off and cam-on live occupants the same way regarding presence (camera only affects video frame content, not whether the person is listed/tiled).
- Cam-off → cam on with a free primary seat: promote from bank to a seat; if seats are full, keep bank with video.
- Self view: local cam-off member still sees themselves represented consistently with product norms (no requirement to hear own mic loopback unless already product behavior).
- Screen-share-only participants remain subject to existing screen-share rules; this feature does not redefine screen tiles, only voice occupancy + mic audio audibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While a member is live in a voice/video channel and not product-deafened, the product MUST play received remote microphone audio in the browser so that speech from other unmuted participants is audible (**receive/playback path**).
- **FR-001a**: While a member is live with mic on (not product-muted), their microphone audio MUST be audible to other non-deafened participants in the same call (**send/publish path**). Both FR-001 and FR-001a MUST pass acceptance tests.
- **FR-002**: Speaking / aura indicators MUST NOT be treated as a substitute for audible playback; when remote mic audio is active and the listener is not deafened, sound MUST be audible under normal permission conditions.
- **FR-003**: Product mute (mic off) and deafen controls MUST continue to stop sending or receiving call audio as already designed; this feature MUST NOT bypass those controls.
- **FR-004**: Every account that is live in the call with **camera off** MUST appear in the Composition **bank** (overflow), even when primary Composition seats are free. Cam-off joiners MUST NOT be omitted from Composition entirely.
- **FR-005**: **Grade MUST always display every live call occupant** regardless of camera on/off (camera state may change tile content, not presence). Cam-off occupants MUST also appear on voice roster / occupancy UI used for “who is here.”
- **FR-006**: Occupancy representation for cam-off joiners MUST appear without requiring a leave/rejoin and MUST clear when the member leaves the call.
- **FR-007**: Enabling camera later MUST attach video to the existing occupant identity (no ghost duplicate). If a primary Composition seat is free, the occupant MUST move from the bank onto a free seat; if no seat is free, they MUST remain in the bank with video.
- **FR-008**: Existing capabilities unrelated to audio playback and cam-off presence (chat, screen share rules, settings, E2EE session join) MUST remain available; this feature is a correctness fix for call media and presence.

### Key Entities

- **Call occupant**: A member currently live in the voice/video channel session (independent of camera on/off).
- **Remote mic audio**: Speech/audio from another occupant’s microphone that listeners should hear when not deafened.
- **Composition bank**: Overflow strip for cam-off (and other banked) occupants in Composition; distinct from primary seats.
- **Speaking cue**: Visual aura/indicator that audio activity was detected (must align with, not replace, audible playback).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-browser test on the same voice channel, a spoken phrase from an unmuted speaker is heard by a non-deafened listener in ≥9 of 10 consecutive attempts **in each direction** (A→B and B→A; same machine or LAN, normal volume).
- **SC-002**: Stakeholders confirm that visible speaking aura for a remote speaker coincides with audible speech for non-deafened listeners in the same test set (no “aura-only silence”).
- **SC-003**: In Composition, a cam-off joiner is visibly present in the **bank** within 3 seconds of joining in ≥9 of 10 join attempts (even when primary seats are free).
- **SC-004**: Grade shows every live occupant (cam on or off) in the same join tests with zero “invisible occupant” cases; voice roster presence agrees.
- **SC-005**: Regression checklist: mute, deafen, leave call, and cam on→off→on do not permanently hide an occupant or permanently silence the call for non-deafened listeners; cam on with a free seat promotes bank→seat without duplicates.

## Assumptions

- “Aura works but no sound” may involve broken playback and/or publish; clarification locks **both** send and receive paths as in-scope for acceptance (I↔others).
- “Banco na composição” is the Composition overflow bank; clarification locks cam-off occupants to the **bank** even when seats are free.
- Grade presence is camera-independent: every live occupant is shown.
- Cam on after cam-off promotes to a free Composition seat when available; otherwise bank keeps the video occupant.
- Listeners use a browser that has been allowed to use the microphone/speakers as required by the existing join flow; fixing OS-level mute is out of scope.
- Voice roster already exists as a presence surface; this feature restores correct occupant listing rather than inventing a new presence panel.
- Screen-share tile rules from prior features remain unchanged except where they incorrectly hide a cam-off voice occupant.
- No new user-facing settings are required for v1 of this fix.
