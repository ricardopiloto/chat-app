# Spec Delta

> This delta modifies the "Optional audio with screen sharing" requirement as proposed by `add-screen-share-audio-and-popout-controls` (ADDED, not yet synced into the main spec at the time of writing). It supersedes the same-named MODIFIED delta left by the now-closed `add-linux-screen-share-system-audio` (its feasibility gate for an API-only route failed; see that change's `design.md`), replacing "a supported system-output capture route" with the native-addon route this change actually implements.

## MODIFIED Requirements

### Requirement: Optional audio with screen sharing

The system SHALL offer an explicit control to include system or game audio when an eligible person starts screen sharing. It SHALL pass the selected choice to screen capture and SHALL show the resulting screen-sharing state. The audio choice SHALL remain available on all platforms. On Linux, when the native PipeWire capture addon is available and loads successfully and audio is selected, the system SHALL attempt to capture and publish whole-desktop audio alongside the selected screen or window video. If audio capture is unavailable or fails on any platform, screen sharing SHALL continue as video-only without a blocking error. The control SHALL NOT claim that audio is being shared unless an audio track is actually captured and published.

#### Scenario: Start sharing with audio selected

- **WHEN** an eligible person selects audio and starts screen sharing in an environment that provides desktop audio capture
- **THEN** the shared screen and captured audio are published to the call

#### Scenario: Linux native capture is available

- **WHEN** an eligible person selects audio on Linux with the native PipeWire addon loaded and a capturable whole-desktop output, and starts sharing a screen or window
- **THEN** the system captures whole-desktop audio through the addon and publishes it alongside the screen video

#### Scenario: Linux native capture is unavailable or fails

- **WHEN** an eligible person selects audio on Linux and the native addon fails to load, fails to build for the running platform/architecture, or fails to capture at runtime
- **THEN** the screen video continues without a system-audio track and the control does not show audio as active

#### Scenario: Start sharing without audio selected

- **WHEN** an eligible person leaves audio unselected and starts screen sharing
- **THEN** the screen is shared without a system-audio track

#### Scenario: Stop screen sharing

- **WHEN** the person stops a screen share that includes audio
- **THEN** the screen and its associated captured audio stop publishing, and the native capture session is released
