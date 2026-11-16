# Spec Delta

## ADDED Requirements

### Requirement: Background segmentation model is self-hosted and tuned for camera video
The system SHALL perform background blur and virtual background segmentation using the MediaPipe segmentation model variant optimized for landscape-oriented video (matching typical webcam aspect ratio), instead of the square/portrait-oriented default model. The model asset SHALL be served by the instance itself as a static file, not fetched from a third-party host at runtime, so the feature does not depend on outbound internet access to initialize.

#### Scenario: Segmentation model is served by the instance, not a third party
- **WHEN** a user enables background blur or a virtual background
- **THEN** the segmentation model asset loads from the instance's own origin, with no network request to an external host for that asset

#### Scenario: Landscape-oriented model is used for camera video
- **WHEN** background blur or a virtual background is active on a camera track
- **THEN** the system uses the segmentation model variant optimized for landscape aspect ratio, not the square/portrait-oriented default
