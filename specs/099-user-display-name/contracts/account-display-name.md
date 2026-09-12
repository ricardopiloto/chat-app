# Contract: Account display name API

**Feature**: 099-user-display-name  
**Date**: 2026-09-11  
**Type**: HTTP / auth account

## ADN-01 — Read

Authenticated `GET /api/auth/me` (and login/register `AuthAccount` responses) MUST include `display_name` as a nullable string.

## ADN-02 — Write

Authenticated update (e.g. `PATCH /api/auth/display-name` or equivalent profile field update) MUST accept a display name string or null/empty-to-clear, apply validation from [data-model.md](../data-model.md), and return the updated `AuthAccount`.

## ADN-03 — Immutable handle

The update MUST NOT change `handle`. No new username-edit endpoint is introduced.

## ADN-04 — Peer payloads

`MemberView`, channel mentionables, and voice `OccupantView` MUST include nullable `display_name` alongside `handle` so peers can apply the public label rule without a separate profile fetch.

## ADN-05 — Errors

Invalid length / control characters → 4xx with a clear message; unauthorized → 401 as usual.

## Failure signals

| Symptom | Likely breach |
|---------|----------------|
| Peers never see new name | ADN-04 missing on list endpoints |
| Handle changed | ADN-03 |
| Empty string stored vs NULL inconsistently | ADN-02 / data-model trim rules |
