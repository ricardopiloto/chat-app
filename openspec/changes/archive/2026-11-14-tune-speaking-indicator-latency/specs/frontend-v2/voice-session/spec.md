# Spec Delta

## MODIFIED Requirements

### Requirement: Indicadores de fala em tempo real

The system SHALL show a participant's speaking state wherever that participant appears, including composition, grid, popout, and voice roster, using LiveKit's active-speaker detection. The deployment SHALL configure a responsive speaker-update cadence and smoothing so the indicator follows speech onset promptly without excessive flicker. The system SHALL use the same detected state across all views.

#### Scenario: Indicador aparece e desaparece com a fala

- **WHEN** a participant begins speaking and then falls silent in an active call
- **THEN** the speaking indicator appears promptly after speech begins and clears after speech ends without rapid flicker between normal syllables

#### Scenario: Consistent views

- **WHEN** the same participant is shown in more than one call view
- **THEN** those views show the same LiveKit-derived speaking state
