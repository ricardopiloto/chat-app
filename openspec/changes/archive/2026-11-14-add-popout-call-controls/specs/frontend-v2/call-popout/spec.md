# Spec Delta

## MODIFIED Requirements

### Requirement: O popout liga-se à chamada de forma independente, só para visualizar

The popout window SHALL establish its own view-only LiveKit room using the `voice/popout-viewer-token`, and SHALL display participants, cameras, and shared screens as the main grid would. Its viewer room SHALL NOT publish microphone or camera media. The popout MAY present controls for the owning main window's microphone, camera, deafen, and call leave; those actions SHALL execute in the owning session rather than the viewer room.

#### Scenario: Popout mostra os participantes em tempo real

- **WHEN** a participant changes camera state while the popout is open
- **THEN** the popout grid updates as the main grid would

#### Scenario: Popout microphone control

- **WHEN** an eligible user toggles the microphone in the popout
- **THEN** the owning main call changes microphone state and the viewer room remains receive-only

#### Scenario: Popout não tem controlos de mic/câmara

- **WHEN** the user looks at the popout controls
- **THEN** microphone and camera controls target the owner call, while the separate viewer LiveKit connection publishes no local microphone or camera track

## ADDED Requirements

### Requirement: Popout controls reveal within reserved window edges

The desktop popout SHALL place its microphone, camera, deafen, and Hang Up controls in a fixed bottom-edge overlay, with a small empty top inset and no top information bar. The grid and spotlight layout SHALL reserve both edge insets while controls are hidden or visible. Controls SHALL be hidden by default, visible while the pointer hovers anywhere within the popout or keyboard focus is within the controls, and hidden again after the pointer leaves and focus is outside the controls. Revealing controls SHALL NOT cover tiles or shift their layout. At the 240×180 minimum window size, all four controls SHALL fit in one row and at least 80px of tile area SHALL remain below the native title bar.

#### Scenario: Reveal and hide controls

- **WHEN** the popout is idle, then the pointer enters anywhere in the popout and later leaves without control focus
- **THEN** the controls are initially hidden, appear on entry, and hide again on leave

#### Scenario: Keyboard access

- **WHEN** keyboard focus enters a popout control while the pointer is outside the window
- **THEN** the controls remain visible until focus leaves them

#### Scenario: Stable grid at minimum size

- **WHEN** controls are revealed in a 240×180 popout with a grid or spotlight layout
- **THEN** the controls occupy their reserved bottom strip without covering or shifting tiles, and at least 80px of tile area remains

### Requirement: Popout controls act on the owning call

While the desktop popout is open for a live call, it SHALL provide accessible microphone, camera, deafen, and Hang Up controls with authoritative state from the owning session. Mic and camera controls SHALL be disabled for listen-only users. Hang Up SHALL end the whole call; closing the popout window SHALL only close that view. Commands for a stale channel or unavailable owner SHALL NOT change another call.

#### Scenario: Toggle and state feedback

- **WHEN** a user toggles mic, camera, or deafen in the popout
- **THEN** the real call changes and the popout button reflects the owner's resulting state

#### Scenario: Listen-only call

- **WHEN** a listen-only user views the popout controls
- **THEN** microphone and camera controls are disabled with an explanation

#### Scenario: Hang up versus close

- **WHEN** the user selects Hang Up in the popout
- **THEN** the owning call ends; when the user only closes the popout window, the call remains active

#### Scenario: Owner unavailable

- **WHEN** the owning main renderer is gone or has moved to a different call
- **THEN** popout commands are disabled or rejected and do not affect any other session
