# Contract: Public display label

**Feature**: 099-user-display-name  
**Date**: 2026-09-11  
**Type**: UI presentation rule

## PDL-01 — Rule

```text
publicDisplayLabel(handle, display_name) =
  trimmed non-empty display_name  if present
  else handle
```

## PDL-02 — Surfaces that MUST use the rule

When showing **another** participant’s name, or the signed-in user’s **user-panel primary** name:

- User panel primary identity line (self)
- Member list / members manage rows
- Chat message authorship and reply “replying to” labels
- Voice/presence roster and Grade/Composition nameplates (handle maps)
- Welcome / system messages that substitute a member name (`{nome}`)

## PDL-03 — Surfaces that MUST stay on handle

- Account menu signed-in-as / `account-menu-handle` («Ligado como»)
- Login / register fields
- `@mention` address tokens and mention autocomplete **insertion** value

## PDL-04 — Fallback

Unset/null/whitespace display name → show handle everywhere PDL-02 applies.

## PDL-05 — Truncation

Compact chrome may ellipsize; the visible prefix must remain recognizable (same expectation as today’s handle truncation).

## Failure signals

| Symptom | Breach |
|---------|--------|
| Panel shows handle while display name set | PDL-02 |
| Signed-in-as shows display name | PDL-03 |
| Peer list shows handle while display name set | PDL-02 |
