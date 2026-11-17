# Spec Delta

## MODIFIED Requirements

### Requirement: Per-participant volume control
During an active call, the system SHALL let a person adjust each remote participant's playback volume individually, from 0% to 200%, where 100% is unchanged from today's behavior. The system SHALL NOT present this control for the local participant's own tile. The displayed percentage SHALL correspond to the audible level of the remote audio on the current client, including after a track reconnects. The adjustment SHALL apply only to what that person locally hears; it SHALL NOT affect what any other participant in the call hears.

#### Scenario: Turning one participant up
- **WHEN** a person sets another remote participant's volume above 100%
- **THEN** that participant's audio plays locally louder than the unmodified track, while every other participant's audio is unaffected

#### Scenario: Turning one participant down
- **WHEN** a person sets another remote participant's volume below 100%, including to 0%
- **THEN** that participant's audio plays locally quieter (or silent at 0%), while every other participant's audio is unaffected

#### Scenario: No control on your own tile
- **WHEN** a person looks at their own tile during a call
- **THEN** there is no volume control there

#### Scenario: Remote track reconnects
- **WHEN** a remote participant’s audio track is replaced or reconnects after a volume change
- **THEN** the saved volume applies to the new track and the slider reflects that value
