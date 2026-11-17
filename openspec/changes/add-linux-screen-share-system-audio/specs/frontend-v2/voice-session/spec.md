# Spec Delta

## MODIFIED Requirements

### Requirement: Optional audio with screen sharing

The system SHALL offer an explicit control to include system or game audio when an eligible person starts screen sharing. It SHALL pass the selected choice to screen capture and SHALL show the resulting screen-sharing state. The audio choice SHALL remain available on all platforms. On Linux, when a supported system-output capture route is available and audio is selected, the system SHALL attempt to capture and publish whole-desktop audio alongside the selected screen or window video. If audio capture is unavailable or fails on any platform, screen sharing SHALL continue as video-only without a blocking error. The control SHALL NOT claim that audio is being shared unless an audio track is actually captured and published.

#### Scenario: Start sharing with audio selected

- **WHEN** an eligible person selects audio and starts screen sharing in an environment that provides desktop audio capture
- **THEN** the shared screen and captured audio are published to the call

#### Scenario: Linux output capture is supported

- **WHEN** an eligible person selects audio on Linux with a supported system-output capture route and starts sharing a screen or window
- **THEN** the system attempts whole-desktop audio capture and publishes the captured audio with the screen video

#### Scenario: Linux output capture is unavailable or fails

- **WHEN** an eligible person selects audio on Linux without a supported system-output capture route, or capture fails
- **THEN** the screen video continues without a system-audio track and the control does not show audio as active

#### Scenario: Start sharing without audio selected

- **WHEN** an eligible person leaves audio unselected and starts screen sharing
- **THEN** the screen is shared without a system-audio track

#### Scenario: Stop screen sharing

- **WHEN** the person stops a screen share that includes audio
- **THEN** the screen and its associated captured audio stop publishing
