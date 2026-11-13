# Spec Delta

## ADDED Requirements

### Requirement: Terms acceptance links to public documents

In the open-registration email verification request flow, the terms acceptance control SHALL include navigable links to the same instance's `/terms` and `/privacy`, so a person can read the documents before accepting. Existing API behavior (`terms_accepted`, `terms_required`, generic `202` response) SHALL remain unchanged.

#### Scenario: Checkbox has links

- **WHEN** a person views the email request form during open registration
- **THEN** the acceptance text links to the instance's terms and privacy policy

#### Scenario: Missing acceptance still fails

- **WHEN** a person submits without checking acceptance
- **THEN** the client blocks submission or the API responds with `terms_required`, as it does today
