# Spec Delta

## ADDED Requirements

### Requirement: Popout screen-share control acts on the owning call

While the desktop popout is open for a live call, it SHALL offer an accessible screen-share start/stop control in its existing revealed control strip. The control SHALL reflect the owning call's authoritative screen-share state. Starting or stopping capture SHALL act on the owning session; the popout's viewer connection SHALL remain receive-only. A stale channel command or unavailable owner SHALL NOT change another call.

#### Scenario: Start sharing from popout

- **WHEN** an eligible person starts screen sharing from the popout
- **THEN** the owning call starts the normal screen-source selection flow and the popout reflects the resulting owner state

#### Scenario: Stop sharing from popout

- **WHEN** the person stops an active screen share from the popout
- **THEN** the owning call stops sharing and the popout control reflects the resulting owner state

#### Scenario: Owner unavailable or channel changed

- **WHEN** the owner is unavailable or the popout's channel is no longer the owning live call
- **THEN** the screen-share command is disabled or rejected without changing another session
