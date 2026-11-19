# Spec Delta

## ADDED Requirements

### Requirement: Scene editor stays responsive during an active screen share
Entering scene-edit mode ("Editar cena") while a screen share is active SHALL NOT make the application UI unresponsive. The renderer SHALL continue to accept clicks and keyboard input, and the editor SHALL remain usable, for the entire time a screen share is active and the creator is editing the scene.

#### Scenario: Edit scene while screen-sharing
- **WHEN** a call participant is screen-sharing, the channel creator switches the call view to Composição, and then clicks "Editar cena"
- **THEN** the scene editor opens and remains interactive (drag/click assignment, layout and position controls, save/discard) without the UI becoming unresponsive, for as long as the screen share stays active
