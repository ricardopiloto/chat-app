# Spec Delta

## ADDED Requirements

### Requirement: Desktop main-window close behavior is a remembered choice

On the desktop client, closing the main window through X or the app close control SHALL use a per-install choice of hide to tray or quit. With no saved choice, the system SHALL ask on the first close attempt, apply an explicit selection to that attempt, and save it. Later close attempts SHALL follow the saved choice silently. Dismissing the prompt without choosing SHALL hide to tray for that attempt and SHALL NOT save a choice, so the next close asks again. Hiding SHALL keep the app and active call running; quitting SHALL use normal application shutdown.

#### Scenario: First close selects hide

- **WHEN** no choice is saved and the person selects hide to tray
- **THEN** the window hides, the app stays running, and later closes hide without a prompt

#### Scenario: First close selects quit

- **WHEN** no choice is saved and the person selects quit
- **THEN** the app quits normally and later closes after relaunch quit without a prompt

#### Scenario: Prompt dismissed

- **WHEN** no choice is saved and the person dismisses the prompt without choosing
- **THEN** the window hides to tray, no choice is saved, and the next close presents the prompt again

#### Scenario: Saved quit choice

- **WHEN** quit is saved and the person closes the main window
- **THEN** the app quits normally without showing the choice prompt

### Requirement: Desktop Settings can change the close choice

The desktop Settings screen SHALL show the current close behavior and SHALL allow a person to change it between hide to tray and quit at any time. An explicit saved change SHALL take effect on the next close without restart. The browser build SHALL NOT show this setting. Once a choice is saved, the first-close prompt SHALL NOT reappear; subsequent changes SHALL be made through Settings.

#### Scenario: Change from tray to quit

- **WHEN** a person changes the Settings choice from hide to tray to quit
- **THEN** the next close quits normally, without prompt or restart

#### Scenario: Change from quit to tray

- **WHEN** a person changes the Settings choice from quit to hide to tray
- **THEN** the next close hides to tray, without prompt or restart

#### Scenario: Browser Settings

- **WHEN** a person opens Settings in a browser
- **THEN** no close-behavior control is shown
