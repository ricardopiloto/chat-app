# Spec Delta

## ADDED Requirements

### Requirement: Temporary mobile backgrounding preserves call intent

On mobile web, temporarily hiding the browser while an active call is in progress SHALL NOT itself trigger an explicit server leave or local hangup. When the same document returns to view, the system SHALL retain a healthy LiveKit connection or attempt bounded recovery and show the connection state. An explicit user Leave SHALL end the call immediately. The system MAY have interrupted background audio or capture when the mobile browser or OS suspends media.

#### Scenario: Return from another app

- **WHEN** a mobile web user switches to another app and returns to the same surviving browser document
- **THEN** the call is still connected or visibly reconnecting, without requiring a new user initiated join solely because the page was hidden

#### Scenario: Mobile media suspension

- **WHEN** the mobile OS pauses the room or microphone while the page is backgrounded
- **THEN** the app attempts recovery on return and shows a failure state if media cannot resume

#### Scenario: Explicit leave while mobile

- **WHEN** the user chooses Leave while in a mobile call
- **THEN** the call and server seat end immediately

#### Scenario: Document was discarded

- **WHEN** the browser discards and reloads the call document after backgrounding
- **THEN** the existing explicit join-consent flow applies before a new LiveKit connection

#### Scenario: Hidden tab never returns

- **WHEN** a hidden mobile tab is killed without a reliable unload event
- **THEN** server heartbeat expiry eventually removes its stale occupancy
