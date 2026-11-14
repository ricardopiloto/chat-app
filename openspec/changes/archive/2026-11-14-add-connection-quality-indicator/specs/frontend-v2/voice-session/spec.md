# Spec Delta

## Purpose

Shows the local user's estimated LiveKit connection health during an active call.

## ADDED Requirements

### Requirement: Local call connection quality is visible

During an active call, the system SHALL show the local participant's LiveKit connection quality as Excellent, Good, Poor, Lost, or Unknown using a compact multi-bar signal-strength indicator. Its fill level and color SHALL convey quality from green for Excellent/Good to red for Poor/Lost; Unknown SHALL remain neutral, neither green nor red. The system SHALL expose the textual level through an accessible label for assistive technology and a tooltip, even though the chip has no visible text label. It SHALL update from LiveKit's connection-quality events, SHALL clear stale values on leave or room replacement, and SHALL NOT present these levels as numeric ping, latency, or jitter measurements. Remote participants' quality and a separate popout viewer connection SHALL NOT be presented as the local publishing connection's quality.

#### Scenario: Local quality changes

- **WHEN** LiveKit reports the local participant's quality changing from Good to Poor
- **THEN** the local quality indicator updates to Poor with an accessible label

#### Scenario: Unknown before measurement

- **WHEN** a call is connecting and no quality sample has been reported
- **THEN** the indicator shows Unknown or a neutral pending state instead of claiming a good connection

#### Scenario: Leave and replace room

- **WHEN** the user leaves a call or joins a replacement room
- **THEN** quality from the old room is cleared and cannot overwrite the new room's value

#### Scenario: Remote participant quality event

- **WHEN** LiveKit reports a quality change for a remote participant
- **THEN** the local user's quality indicator does not change because of that event

#### Scenario: Bars and color encode the level

- **WHEN** the local quality is Excellent or Good
- **THEN** the indicator renders green bars, fully filled for Excellent and mostly filled for Good
- **WHEN** the local quality is Poor or Lost
- **THEN** the indicator renders red bars, mostly empty for Poor and empty or as a no-signal glyph for Lost
- **WHEN** the local quality is Unknown
- **THEN** the indicator renders a neutral gray dashed or pending state, neither green nor red

### Requirement: Desktop popout shows the owning session's connection quality

When the desktop popout is open for an active call, the system SHALL show the relayed owning session's local connection quality using the same bar-and-color encoding inside the popout's existing hover/focus-revealed control strip. It SHALL NOT read or substitute the popout's own separate viewer-room connection quality for this purpose. It SHALL NOT add any new always-visible indicator chrome over the popout's grid. The indicator SHALL be absent when the owner is unavailable, using the same readiness and owner-availability gating as the existing mic/cam controls.

#### Scenario: Relayed owner quality appears on hover

- **WHEN** the desktop popout has a live, available owner state with a relayed local quality level and the user hovers over or focuses the control strip
- **THEN** the popout shows that quality as the same compact bar-and-color glyph in the revealed control strip, without a permanent grid badge

#### Scenario: Viewer-room quality is never substituted

- **WHEN** the popout's separate LiveKit viewer room reports a connection quality different from the owning session's relayed local quality
- **THEN** the popout indicator reflects only the relayed owning session's quality and never the viewer room's quality

#### Scenario: Owner is unavailable

- **WHEN** the popout has not yet received a live, available owner state, or the owner becomes unavailable after the popout closes and reopens
- **THEN** the quality indicator is absent, consistent with the existing mic/cam control gating, and no stale quality is shown
