# Spec Delta

## MODIFIED Requirements

### Requirement: Indicadores de fala em tempo real

The system SHALL show a participant's speaking state wherever that participant appears, including composition, grid, popout, and voice roster, using LiveKit's active-speaker detection. The deployment SHALL configure a responsive speaker-update cadence and smoothing so the indicator follows speech onset promptly without excessive flicker. The system SHALL use the same detected state across all views. Call tiles SHALL show speaking through their existing visual highlight without a visible “Speaking” text chip.

#### Scenario: Indicador aparece e desaparece com a fala

- **WHEN** a participant begins speaking and then falls silent in an active call
- **THEN** the speaking indicator appears promptly after speech begins and clears after speech ends without rapid flicker between normal syllables

#### Scenario: Consistent views

- **WHEN** the same participant is shown in more than one call view
- **THEN** those views show the same LiveKit-derived speaking state

#### Scenario: Speaking tile without text chip
- **WHEN** a participant speaks in a stage, grid, or compact tile
- **THEN** the tile’s speaking highlight remains visible and no “Speaking” text chip appears

## ADDED Requirements

### Requirement: Per-participant connection quality on call tiles

During an active call, the system SHALL show each local and remote participant's own LiveKit connection quality in their stage/grid tile, using the existing accessible `ConnectionQualityGlyph` and its unchanged top-right position below the muted/you chip slot. Quality SHALL be reactive per LiveKit participant identity, initialized from connected participants, updated only for the reported participant, and cleared for disconnected participants and on leave or room replacement. Unknown SHALL remain neutral. The local-only popout owner quality relay SHALL remain tied to the owner rather than the popout viewer connection.

#### Scenario: Remote quality changes independently
- **WHEN** LiveKit reports a remote participant changing from Good to Poor
- **THEN** that remote tile updates its glyph and accessible level to Poor while the local and other remote tiles retain their own levels

#### Scenario: Existing participants have initial quality
- **WHEN** a call tile first renders for an already connected participant
- **THEN** it shows that participant's current quality or neutral Unknown, without waiting for a new quality event

#### Scenario: Quality state is removed
- **WHEN** a participant disconnects or the call leaves or replaces its LiveKit room
- **THEN** that identity's old quality cannot appear on a later tile or overwrite the new room's quality

### Requirement: Call tile information reveals on interaction

The system SHALL hide tile overlay chips/glyphs and the full caption, including name, handle, state icons, volume slider and actions, by default in composition, grid and floating-player tiles. On hover-capable devices it SHALL reveal them on tile hover or keyboard focus within. On no-hover touch devices, tapping a tile SHALL toggle its information; tapping another tile SHALL reveal that tile and close the former, and tapping outside SHALL dismiss the reveal. A reveal tap SHALL NOT also trigger tile selection. Visible nested controls SHALL remain usable. Video, figure framing and the speaking highlight SHALL remain unchanged.

#### Scenario: Desktop pointer and keyboard
- **WHEN** a pointer enters or leaves a tile, or keyboard focus enters or leaves its caption controls
- **THEN** all that tile's chips and caption appear or disappear together, and a keyboard user can reach every control

#### Scenario: Touch toggles and dismisses
- **WHEN** a touch user taps a hidden tile, taps it again, taps a different tile, or taps outside
- **THEN** the information respectively appears, hides, switches to the other tile, or closes without an accidental tile selection

#### Scenario: Revealed controls remain usable
- **WHEN** a touch or keyboard user adjusts volume or activates a caption action after revealing it
- **THEN** that action works and the camera video and tile dimensions do not shift

### Requirement: Deafened participant state is visible

The system SHALL report each occupant's `deafened_on` boolean through persisted voice occupancy, including REST snapshots and `voice.occupancy` updates, independently of microphone and camera state. New joins SHALL start false and old clients that omit the field SHALL remain valid. When a participant deafens or undeafens, other clients SHALL see the change in that participant's tile caption. A deafened talker or listener SHALL show an accessible `headset_off` icon alongside their existing state icons; an undeafened participant SHALL have no deafen icon.

#### Scenario: Remote participant deafens
- **WHEN** a participant toggles deafen on during a call
- **THEN** their occupancy changes to `deafened_on: true` and other clients reveal a `headset_off` state icon on that participant's tile

#### Scenario: Listener deafens
- **WHEN** a listen-only participant deafens
- **THEN** their tile shows the deafen icon beside the listener icon without adding microphone or camera state icons

#### Scenario: Deafen clears and rejoin defaults
- **WHEN** a participant undeafens or leaves and rejoins
- **THEN** the icon clears and the new occupancy defaults to false until that participant deafens again

