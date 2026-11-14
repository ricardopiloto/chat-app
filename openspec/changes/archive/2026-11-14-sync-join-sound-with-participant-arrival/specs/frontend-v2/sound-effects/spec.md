# Spec Delta

## MODIFIED Requirements

### Requirement: Som de chegada a uma chamada em andamento

The system SHALL play the remote arrival effect for a person already connected to a call only after another remote LiveKit participant first appears in that call's participant view, including as an avatar without published tracks. It SHALL NOT sound merely because HTTP occupancy was reserved, or for a call the listener has not joined. The system SHALL play the same effect for the local user's successful entry, except for an internal reconnection without user action.

#### Scenario: Outra pessoa entra na minha chamada

- **WHEN** another person connects to the LiveKit room and first appears as a tile or avatar in the current call
- **THEN** the arrival effect plays once after that visible arrival

#### Scenario: Occupancy before media connection

- **WHEN** HTTP occupancy lists a person whose LiveKit connection has not completed
- **THEN** no remote arrival effect plays yet

#### Scenario: Listener without published tracks

- **WHEN** a listen-only participant connects and appears as an avatar without publishing a track
- **THEN** the arrival effect plays once

#### Scenario: A minha própria entrada

- **WHEN** the local user successfully joins a call
- **THEN** the local entry effect plays once

#### Scenario: Reconexão interna não conta como entrada

- **WHEN** the same participant reconnects as part of an internal session recovery
- **THEN** no duplicate remote arrival effect plays

#### Scenario: Chamada em que não estou

- **WHEN** another person joins a call that the user is not connected to
- **THEN** no arrival effect plays for the user

#### Scenario: Reconexão não repete

- **WHEN** realtime connectivity returns and the roster contains the same participants
- **THEN** no duplicate arrival effect plays
