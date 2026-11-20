# Spec Delta

## ADDED Requirements

### Requirement: Call controls in rail-only navigation
When the shell hides its sidebar and leaves only the server rail, the user panel SHALL remain available for identity and account-menu access but SHALL NOT render its embedded call-control row. During a live call away from its channel route, the existing floating player SHALL provide the visible call controls. On routes where the sidebar is shown, the user panel SHALL retain its existing live-call controls.

#### Scenario: Active call on account settings
- **WHEN** a user in a live call opens `/account` and the sidebar collapses to the server rail
- **THEN** the user panel retains its identity and account-menu access without an embedded call-control row, and the floating player remains available for call control

#### Scenario: Return to full-width navigation
- **WHEN** the user leaves `/account` for a route with a visible sidebar while the call remains live
- **THEN** the user panel again renders its embedded call controls at the full navigation width

#### Scenario: No active call
- **WHEN** no call is live on the account route
- **THEN** the user panel still presents its normal identity and account-menu access
