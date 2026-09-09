# Feature Specification: User Panel Discord Layout + Defer Channel Collapse + Voice Join Opt-in

**Feature Branch**: `078-user-panel-discord`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Por hora vamos remover a funcionalidade de collapse da sidebar (hide channels), voltar ao backlog até definirmos melhor como ela vai funcionar. Ajustar toda a barra do usuário (user-panel) para ficar igual ao Discord (imagem em anexo)."

**Amendment (2026-09-08)**: "Melhorar 078: camera + blur voltam a ficar visíveis apenas nos canais de voz/vídeo (onde estão os botões de join). Trocar os dois botões de join por um ícone/controlo JOIN; join por default sempre sem câmera; o utilizador opt-in para ligar a câmera no mesmo controlo de join (padrão similar a Teams / Google Meet), respeitando banco + palco."

**Reference visual**: [reference-discord-user-panel.png](./reference-discord-user-panel.png)

**Related (deferred / prior)**: Channel list hide/drawer behavior from [055-channels-rail-drawer](../055-channels-rail-drawer/); user bar foundations from [039-floating-user-bar](../039-floating-user-bar/); dual pre-join buttons from [032-voice-join-camera-choice](../032-voice-join-camera-choice/) (UI presentation superseded by this amendment; banco/palco rules retained).

## Clarifications

### Session 2026-09-08

- Q: On stage, should mic/deafen stay on the user bar? → A: Yes — keep mic + deafen + settings always on the bar (Discord-like); camera/blur live on the voice/video channel chrome (not on the user bar); leave may still appear on the bar when needed off-stage (see amendment).
- Q: Where do camera/leave sit when in a call off-stage? → A: **Superseded by amendment** — camera + blur are **not** on the user panel; they appear only on voice/video channel surfaces. Off-stage leave may remain on the user panel without camera/blur beside it.
- Q: Do mic/deafen chevrons open device menus in this feature? → A: No — chevrons are visual-only; device pickers deferred to backlog.
- Q: What are the two identity text lines? → A: Primary = handle; secondary = status (online/offline).
- Q: What does offline mean on this bar? → A: While authenticated in this app, always show online; real offline/presence is out of scope.

### Session 2026-09-08 (clarify after amendment)

- Q: Must leave appear on the user panel when off-stage in a call? → A: Yes — leave is required on the user panel when in a call and not on stage (no camera/blur on the panel).
- Q: How is camera on/off shown before JOIN? → A: Lazy preview — live self-preview only after the user opts in to camera; default off uses icon/state only (no camera permission until opt-in).
- Q: Is blur configurable on pre-join? → A: Yes — blur can be set on the pre-join surface alongside camera opt-in (not only in-call).
- Q: Where does leave sit on the user panel off-stage? → A: To the left of the Discord trio (identity | leave | mic → deafen → settings).
- Q: When is pre-join blur available if camera is off? → A: Blur on pre-join only when camera is opted in (hidden/disabled while camera off).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Channel list always visible; collapse off the product for now (Priority: P1)

As a Mesa user, I want the server channel list in the sidebar to stay fully visible and usable without a “hide channels / collapse” control, so I am not stuck with an unfinished drawer experience until the team redesigns it.

**Why this priority**: The product owner explicitly wants collapse removed from the current experience and parked in backlog; leaving a half-defined hide/peek flow confuses navigation.

**Independent Test**: Open any server with text/voice channels → confirm there is no control or gesture that collapses/hides the channel list behind the server rail; the full list remains available. After a full app reload, channels are still fully visible (no restored collapsed preference).

**Acceptance Scenarios**:

1. **Given** an authenticated member viewing a server, **When** they look at the channel sidebar, **Then** they see no “hide channels” / collapse affordance that tucks the list away.
2. **Given** a previous session had channels collapsed (saved preference), **When** they open the app after this feature ships, **Then** the channel list is fully expanded and usable; collapsed state is not re-applied.
3. **Given** desktop or stage layouts that previously supported collapse, **When** the user navigates servers and channels, **Then** the main content and server rail remain usable with the channel list always in its normal expanded place.

---

### User Story 2 - Discord-like user bar identity (Priority: P1)

As a Mesa user, I want the bottom user bar to present my avatar (with online indicator) and a clear two-line identity block on the left—matching the Discord reference—so I can recognize “this is me” and open account options from that block.

**Why this priority**: Identity is the left half of the reference layout and the persistent account entry point.

**Independent Test**: While authenticated, inspect the bottom user panel → avatar + online dot + two text lines + hoverable identity region; activating the identity opens the existing account menu / settings entry path.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they view the shell, **Then** the user panel shows a circular avatar with an online status indicator on the avatar’s corner that matches the secondary status line (**online**).
2. **Given** the user panel is visible and the user is authenticated, **When** they look at the identity text, **Then** they see two lines: a primary (stronger) line showing their handle, and a secondary muted line showing **online**.
3. **Given** the user clicks or activates the identity region (avatar/name area), **When** that action occurs, **Then** account options open (same account menu purpose as today: profile/account actions including logout as already offered).
4. **Given** the pointer hovers the identity region, **When** hover is active, **Then** that region shows a distinct rounded hover treatment similar to the reference (lighter inset behind the identity cluster), without looking like a generic full-bar highlight only.

---

### User Story 3 - Discord-like always-visible mic, deafen, and settings cluster (Priority: P1)

As a Mesa user, I want the right side of the user bar to show microphone, headphones/deafen, and settings controls in Discord’s arrangement—so mute/deafen/settings are discoverable in one familiar place.

**Why this priority**: Completes visual and interaction parity with the attached Discord user bar for the core idle controls.

**Independent Test**: Out of a call, on stage, and in a call off-stage, confirm the right-side cluster always shows mic → deafen → settings; mic/deafen work whenever in a voice session; settings opens account/settings as today.

**Acceptance Scenarios**:

1. **Given** the user is authenticated (including while viewing the voice stage), **When** they look at the user panel, **Then** they see three control affordances on the right in this order: microphone, deafen/headphones, settings (gear).
2. **Given** the user is not in a voice session, **When** they see mic and deafen, **Then** those controls remain visible but inactive (disabled), matching the prior product rule that idle mute/deafen do nothing—rather than disappearing from the bar.
3. **Given** the user is in a live voice session, **When** they use mic or deafen on the bar (including while on stage), **Then** mute/deafen behave as they do today for that session.
4. **Given** the user activates the settings (gear) control, **When** the click occurs, **Then** they reach the same account/settings entry as today’s settings control on the user panel.
5. **Given** mic and deafen in the reference show a small downward chevron beside each icon, **When** the bar is rendered, **Then** each of those two controls presents a primary icon plus a secondary chevron affordance grouped with it (device/menu split look); activating the chevron does nothing beyond visual parity in this feature (device pickers deferred).

---

### User Story 4 - User panel stays Discord-like; camera/blur only on voice channels (Priority: P1)

As a Mesa user, I want camera and blur controls only on voice/video channel surfaces (not on the bottom user panel), so the user bar matches Discord while camera choices stay where I join and run the call (banco/palco).

**Why this priority**: Product amendment — camera/blur must leave the user panel; otherwise Discord parity and voice-channel join UX conflict.

**Independent Test**: Idle and in-call: user panel never shows camera or blur. Open a voice/video channel → camera (and blur when applicable) appear only in that channel’s join/in-call chrome. Off-stage in a call → leave is on the user panel without camera/blur.

**Acceptance Scenarios**:

1. **Given** the user is idle or in a call, **When** they inspect the user panel, **Then** camera and blur controls are never present on that panel.
2. **Given** the user is viewing a voice/video channel (pre-join or in-call), **When** they need camera or blur, **Then** those controls are available on that channel’s surface (join preflight and/or stage/voice chrome as appropriate).
3. **Given** the user is in a call and not on stage, **When** they view the user panel, **Then** leave appears **to the left of** the Discord trio (order: identity | leave | mic → deafen → settings), without camera/blur on the panel.
4. **Given** the user is on stage, **When** they look at the user panel, **Then** mic, deafen, and settings remain on the bar; leave is not duplicated on the bar (stage/voice chrome owns leave); camera/blur remain only on voice/stage chrome.

---

### User Story 5 - Single JOIN with camera opt-in (Meet/Teams-style) (Priority: P1)

As a Mesa user opening a voice/video channel, I want one clear JOIN action that defaults to joining **without** camera, with an opt-in control on the same join surface that shows whether my camera will be on or off when I enter—like Teams / Google Meet—while still respecting banco (bench) vs palco (stage) rules.

**Why this priority**: Replaces the dual “Join with camera” / “Join without camera (bench)” buttons with a clearer single-path join; camera is opt-in, not a second primary join.

**Independent Test**: On a voice channel pre-join screen, find one JOIN control (icon/button), camera default off with visible state, toggle camera intent on, then JOIN → enter with camera on and stage placement rules; with camera left off, JOIN → enter without camera on the bank.

**Acceptance Scenarios**:

1. **Given** the user is not yet in the call and views a voice/video channel, **When** they look at the pre-join area, **Then** they do **not** see two separate primary actions “Join with camera” and “Join without camera (bench)”; they see a single JOIN affordance (icon-led or equivalent clear join control).
2. **Given** the pre-join surface is shown, **When** the user has not opted in to camera, **Then** the UI clearly indicates camera will be **off** for the upcoming join (default) via control state/icon only (no live video preview yet), and JOIN starts a join without camera.
3. **Given** the user opts in to camera on the same join surface (before pressing JOIN), **When** that opt-in is active, **Then** the UI shows camera will be **on** and MAY start a **lazy** local self-preview (Meet-like) only after this opt-in—not before.
4. **Given** the user JOINs with camera **off**, **When** join succeeds, **Then** they enter without camera and land on the **banco** by default (existing bank rules).
5. **Given** the user JOINs with camera **on**, **When** join succeeds, **Then** they enter with camera and stage/slot placement follows existing palco rules (auto-assign when applicable; not forced to bank solely because of this UI change).
6. **Given** the user entered without camera (banco), **When** they later turn camera on in the voice/stage chrome, **Then** existing bank→slot rules still apply (auto-slot only when automatic assignment + free slot; otherwise remain on bank).
7. **Given** blur is offered for camera and camera is **opted in** on pre-join, **When** the user configures blur, **Then** blur controls are available on the pre-join surface (and still in-call on voice/stage chrome)—never on the user panel.
8. **Given** camera is **off** on pre-join (default), **When** the user looks for blur, **Then** blur is hidden or disabled until camera opt-in.

---

### Edge Cases

- Very long handles: primary/secondary lines truncate with ellipsis; layout does not push mic/deafen/settings off-screen or wrap into a second row on typical desktop widths.
- Narrow shell / mobile-like widths: identity may compress first; core controls remain tappable; no horizontal page scroll solely because of the user panel.
- Collapsed preference left in local storage from older builds: ignored; list always expanded.
- Reduced motion: hover/press feedback still readable without relying on motion alone.
- Listen-only voice permission: mic remains non-actionable with clear disabled state; camera opt-in on join is unavailable or clearly blocked when the member cannot use video, same spirit as today.
- Authenticated self-status: secondary line and avatar dot stay **online** for this delivery; no offline state for the signed-in user on this bar.
- Camera permission denied after opt-in (lazy preview or at JOIN): user gets a clear failure/recovery path; must not silently appear as if camera joined successfully on stage when media failed.
- Default camera-off pre-join must not prompt for camera access until opt-in or an equivalent explicit user action.
- Secondary “test video” (or equivalent) pre-join helpers may remain if already productized, but must not restore a second primary “join with camera” path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST remove end-user channel-list collapse / “hide channels” from the live UI (control, peek drawer, and any gesture that hides the channel list behind the server rail).
- **FR-002**: After this feature, the channel list MUST always present in the normal expanded state for all layouts that previously supported collapse.
- **FR-003**: Any previously persisted “channels collapsed / hidden” preference MUST NOT restore a collapsed channel list (treat as deferred backlog; preference may be ignored or cleared).
- **FR-004**: Channel-list collapse / drawer redesign MUST be treated as **out of scope for this delivery** and explicitly parked for a future backlog item (no partial hide/peek left enabled).
- **FR-005**: The user panel MUST match the Discord reference composition for the idle bar: left identity cluster; right control cluster of microphone, deafen/headphones, and settings, in that order.
- **FR-006**: The identity cluster MUST include avatar, an online status indicator on the avatar, and two text lines (primary stronger + secondary muted).
- **FR-007**: The two identity text lines MUST be: primary = the user’s handle; secondary = presence status text. For this delivery, while the user is authenticated in the app the secondary line MUST show **online** and the avatar indicator MUST match (always online). True offline / presence across sessions or members is out of scope. This feature MUST NOT invent a separate display-name account field.
- **FR-008**: Activating the identity cluster MUST open the existing account menu / account entry path.
- **FR-009**: The settings (gear) control MUST remain available on the right and open the same account/settings entry path as today’s user-panel settings control.
- **FR-010**: Microphone and deafen controls MUST remain visible on the user panel whenever the user is authenticated—including while viewing the voice stage—and MUST be disabled with no effect when the user is not in a voice session.
- **FR-011**: When the user is in a voice session, mic and deafen on the user panel MUST toggle mute and deafen with existing product semantics (including deafen↔mic coupling already defined), whether or not the user is on stage.
- **FR-012**: Microphone and deafen MUST each present as an icon-plus-chevron grouped control visually aligned with the Discord reference.
- **FR-013**: Mic and deafen chevrons MUST be visual-only in this feature (no device-picker menu). Full input/output device pickers are explicitly deferred to backlog.
- **FR-014**: The user panel MUST NEVER show camera or blur controls (idle, off-stage, or on stage).
- **FR-015**: Camera and blur MUST be available only on voice/video channel surfaces. On **pre-join**, blur MUST be configurable only while camera is opted in (hidden or disabled while camera is off). Blur MUST remain available in-call on voice/stage chrome when camera is on. Neither camera nor blur may appear on the user panel.
- **FR-016**: When the user is in a call and not on stage, leave MUST appear on the user panel **to the left of** the Discord trio (mic → deafen → settings), between identity and that trio; leave MUST NOT reintroduce camera/blur onto the panel.
- **FR-017**: When the user is on stage, leave and camera/blur MUST be owned by stage/voice chrome and MUST NOT be duplicated on the user panel; mic, deafen, and settings MUST still remain on the user panel.
- **FR-018**: Settings (gear) MUST remain on the user panel in all authenticated shell states covered by this feature (idle, in-call off-stage, and on stage).
- **FR-019**: Voice/video pre-join MUST replace the two distinct primary join actions (“with camera” / “without camera · bench”) with a **single JOIN** affordance (icon-forward join control acceptable).
- **FR-020**: JOIN MUST default to **camera off**; joining with camera MUST require an explicit opt-in on the same join surface before (or as part of committing) JOIN.
- **FR-021**: The join surface MUST show the user’s camera intent (on vs off) before they enter. With camera off (default), intent MUST be clear from control state/icon without requesting camera permission or showing live preview. After camera opt-in, the product MUST show on-intent and MAY show a lazy local self-preview. Camera permission and live preview MUST NOT be requested solely because the pre-join screen is open with default camera-off.
- **FR-022**: JOIN with camera off MUST place the user on the **banco** by default after successful join (032 bank rule retained).
- **FR-023**: JOIN with camera on MUST follow existing **palco**/slot assignment rules after successful join (not forced to bank solely due to this UI).
- **FR-024**: After join, turning camera on from bank MUST keep existing auto-slot rules (automatic assignment + free slot → slot; otherwise remain on bank).
- **FR-025**: This feature MUST NOT remove listen-only / bank participation; it changes how camera intent is chosen at join time.
- **FR-026**: Pre-join blur MUST NOT be interactive while camera intent is off.

### Key Entities

- **User panel**: Persistent bottom chrome showing the signed-in member’s identity and quick mic/deafen/account controls (no camera/blur).
- **Channel sidebar**: Server channel list adjacent to the server rail; for this feature always expanded (collapse deferred).
- **Collapse preference (legacy)**: Prior saved “channels hidden/collapsed” flag that must no longer drive UI until a future redesign.
- **Join surface**: Pre-join area on a voice/video channel presenting JOIN + camera intent (default off) + optional blur configuration when camera controls apply.
- **Banco / palco**: Existing bench vs stage placement; camera-off join → bank; camera-on join → stage/slot rules as today.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 5-minute walkthrough of a typical server, reviewers find **zero** ways to collapse/hide the channel list; 100% of navigations keep the full list available.
- **SC-002**: Side-by-side with the reference image, idle user panel matches Discord’s structure (identity left with two lines + status avatar; mic, deafen, settings right) for at least 9 of 10 checklist spots on a simple visual parity checklist—accepting that Mesa’s secondary line is status text rather than a Discord-style username; camera/blur absent from the panel.
- **SC-003**: Users can open account options from the identity block or gear in under 2 seconds of seeking (no hunting in the top bar for the only account entry).
- **SC-004**: Out of call, first-time users can locate mute and deafen on the bar without entering a voice channel first (controls visible, clearly inactive until in a call).
- **SC-005**: In a 2-minute voice-channel walkthrough, reviewers find camera and blur **only** on the voice/video channel UI (not on the user panel), and can leave a call off-stage from the user panel (leave present).
- **SC-006**: On pre-join, 100% of first-time test users identify a **single** JOIN path (no dual primary join buttons) and correctly predict whether camera will be on or off before joining, based on the join-surface state.
- **SC-007**: Joining with default (camera off) places the user on the bank; joining after opt-in camera follows stage/slot rules—verified in one happy-path check each.

## Assumptions

- Collapse is intentionally deferred, not redesigned in this feature; documenting “backlog” in the spec/CHANGELOG/daily is sufficient—no separate backlog ticket system required unless the team already uses one.
- Visual reference is Discord’s dark user bar (attached image); Mesa theme tokens should feel native to Mesa while matching structure, hierarchy, and control order—not a pixel-perfect Discord skin of the whole app.
- No new display-name / nickname account field in this feature; secondary identity line is presence status text, always **online** while authenticated (clarification session 2026-09-08). True offline/presence is deferred.
- Device-picker menus behind mic/deafen chevrons are out of scope for this delivery; chevrons are decorative only (clarification session 2026-09-08).
- Mic/deafen/settings stay on the user panel always; camera/blur never on the user panel (specify amendment 2026-09-08). Leave MUST appear on the panel when in a call and off-stage; on stage, leave stays on stage/voice chrome only (clarify after amendment 2026-09-08).
- Banco/palco semantics from [032](../032-voice-join-camera-choice/) remain; only the **presentation** of camera choice at join changes (single JOIN + opt-in instead of two primary buttons).
- Exact visual of the JOIN icon and Meet/Teams-like camera toggle can follow Mesa’s existing control language. Camera intent: icon/state when off; lazy self-preview allowed only after opt-in (clarify after amendment 2026-09-08).
- i18n strings for removed “hide/show channels” and dual join labels can be cleaned or repurposed in the same delivery.
- Prefer remembering camera opt-in only for the current pre-join visit (not a lasting global preference) unless already productized otherwise—default remains camera off each new join visit.
- Pre-join blur is gated on camera opt-in (clarify after amendment 2026-09-08).
