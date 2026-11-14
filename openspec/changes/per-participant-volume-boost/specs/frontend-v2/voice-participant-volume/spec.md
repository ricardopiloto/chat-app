# Spec Delta

## Purpose

Lets a person locally turn one specific remote participant's audio up or down during a call, independent of every other participant's volume, without affecting what anyone else hears.

## ADDED Requirements

### Requirement: Per-participant volume control
During an active call, the system SHALL let a person adjust each remote participant's playback volume individually, from 0% to 200%, where 100% is unchanged from today's behavior. The system SHALL NOT present this control for the local participant's own tile. The adjustment SHALL apply only to what that person locally hears; it SHALL NOT affect what any other participant in the call hears.

#### Scenario: Turning one participant up
- **WHEN** a person sets another remote participant's volume above 100%
- **THEN** that participant's audio plays locally louder than the unmodified track, while every other participant's audio is unaffected

#### Scenario: Turning one participant down
- **WHEN** a person sets another remote participant's volume below 100%, including to 0%
- **THEN** that participant's audio plays locally quieter (or silent at 0%), while every other participant's audio is unaffected

#### Scenario: No control on your own tile
- **WHEN** a person looks at their own tile during a call
- **THEN** there is no volume control there

### Requirement: Volume preference persists locally by account handle
The system SHALL remember each remote participant's chosen volume on the person's own device, keyed by that participant's account handle, and SHALL apply it automatically the next time that same participant is seen in a call on that device. The system SHALL NOT offer this control, and SHALL NOT attempt to persist a preference, for a participant whose account handle has not resolved.

#### Scenario: Preference remembered on the same device
- **WHEN** a person sets a participant's volume, leaves the call, and later joins another call that includes the same participant (resolved to the same account handle), on the same device
- **THEN** the previously chosen volume is applied automatically, without the person setting it again

#### Scenario: Preference does not follow to another device
- **WHEN** a person who set a volume preference on one device joins a call on a different device
- **THEN** that participant plays at the default 100% on the new device, since the preference is local to the device where it was set

### Requirement: Chosen output device is preserved where supported
For a participant set to 100% or below, the system SHALL continue to route their audio through the already-chosen output device exactly as it does today. For a participant boosted above 100%, the system SHALL attempt to route their audio through the already-chosen output device using the browser's audio-context output-routing API where available, and MAY fall back to the system's default output device when that API is not available, without failing or muting that participant's audio.

#### Scenario: Boosted participant follows the chosen output device when supported
- **WHEN** a person has chosen a specific audio output device and boosts a participant above 100%, on a browser that supports routing an audio graph's output to a chosen device
- **THEN** that participant's boosted audio plays on the chosen output device

#### Scenario: Boosted participant degrades gracefully when unsupported
- **WHEN** a person boosts a participant above 100% on a browser that does not support routing an audio graph's output to a chosen device
- **THEN** that participant's boosted audio still plays, on the system's default output device, without an error or silence
