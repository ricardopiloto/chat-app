# Spec Delta

## ADDED Requirements

### Requirement: Optional audio with screen sharing

The system SHALL offer an explicit control to include system or game audio when an eligible person starts screen sharing. It SHALL pass the selected choice to screen capture and SHALL show the resulting screen-sharing state. The supported-platform behavior when audio capture is unavailable remains pending architect review; the control SHALL NOT claim that audio is being shared unless an audio track is actually captured and published.

#### Scenario: Start sharing with audio selected

- **WHEN** an eligible person selects audio and starts screen sharing in an environment that provides desktop audio capture
- **THEN** the shared screen and captured audio are published to the call

#### Scenario: Start sharing without audio selected

- **WHEN** an eligible person leaves audio unselected and starts screen sharing
- **THEN** the screen is shared without a system-audio track

#### Scenario: Stop screen sharing

- **WHEN** the person stops a screen share that includes audio
- **THEN** the screen and its associated captured audio stop publishing
