# Spec Delta

## ADDED Requirements

### Requirement: Rejoining recovers from stale background call work

A user initiated call join SHALL settle even when an earlier join, leave, or LiveKit disconnect never settles. The system SHALL release the old local room and tracks, bound cleanup, and prevent late work from an old session from ending or changing the replacement session. Hiding the desktop window to tray SHALL keep a healthy active call running.

#### Scenario: Stalled disconnect before rejoin

- **WHEN** a prior call's LiveKit disconnect remains pending and the person requests another join
- **THEN** the request reaches a successful new connection or a visible failure in finite time, without waiting forever for the old disconnect

#### Scenario: Old completion arrives late

- **WHEN** cleanup from an old session finishes after a replacement call has connected
- **THEN** it does not clear the new call, its state, or its server seat

#### Scenario: Desktop window hides to tray

- **WHEN** a healthy call is active and the desktop main window is hidden and later restored
- **THEN** the call remains active and can still be explicitly left and rejoined

### Requirement: Page lifecycle teardown clears call state

When page lifecycle teardown ends a call, the local call status and channel SHALL be reset with the room and tracks, without waiting for asynchronous disconnect.

#### Scenario: Pagehide after active call

- **WHEN** the call page receives `pagehide` while its session is active
- **THEN** the local session is idle with no selected call channel or room, and a later user initiated join can start cleanly

### Requirement: Desktop relaunch reopens the existing call-owning window

The desktop Electron app SHALL allow only one running app instance. A second launch attempt SHALL exit without creating another main window or call session and SHALL cause the running instance to restore and focus its existing main window. The active call SHALL remain unaffected.

#### Scenario: Relaunch while hidden in an active call

- **WHEN** the desktop main window is hidden to tray during an active call and the person launches Parley again
- **THEN** the running instance shows and focuses its existing main window, no second call-owning renderer starts, and the call remains active

#### Scenario: Relaunch while visible or minimized

- **WHEN** Parley is already running with its main window visible or minimized and the person launches it again
- **THEN** the existing main window is focused and restored if minimized, without starting a second app instance
