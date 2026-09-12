# Data Model: Voice Audio & Occupant Presence

**Feature**: 096-voice-audio-presence  
**Date**: 2026-09-11

Logical / ephemeral entities (no new DB tables expected).

## Call occupant

| Field | Notes |
|-------|--------|
| `account_id` | Stable identity in room + occupancy |
| `in_call` | Live in voice session for channel |
| `mic_on` / `cam_on` | Product media prefs / occupancy flags |
| `deafened` | Local listener: remote volumes 0 |
| Speaking | Derived from ActiveSpeakers (UI only) |

**Rules**: Presence for bank/Grade uses **in_call**, not `cam_on`. Cam-off still an occupant.

## Remote mic audio

| Field | Notes |
|-------|--------|
| Track | LiveKit remote audio publication |
| Sink | HTMLAudioElement under audio host |
| Volume | 0 if local deafened; else 1 |
| Playing | Must `play()` successfully when not deafened |

**Transitions**: Subscribe → attach → play; Undeafen/gesture → retry play; Unsubscribe → detach.

## Composition placement

| State | Meaning |
|-------|---------|
| Primary seat | `grid.slots[].account_id` assigned |
| Bank | In call ∧ not in any primary slot (`deriveBank`) |
| Absent | Not in call |

**Rules**:
- Join `cam_on: false` → **bank** (not primary seat), even if seats free.
- `cam_on: true` + free seat → **promote** to seat (server assign + FE refresh).
- `cam_on: true` + no free seat → stay **bank** with video when available.
- Leave → remove from seat and bank.

## Grade tile

| Field | Notes |
|-------|--------|
| Identity | Every live remote + local |
| Has video | Optional; tile exists without video track |
| Screen tile | Separate; unchanged rules |

**Rule**: Camera off does not omit Grade identity.

## Relationships

```text
Call occupant ──┬── Composition seat (0..1 primary)
                ├── Composition bank (if in call ∧ no seat)
                ├── Grade tile (1 while in call)
                └── Remote mic audio (0..1 published)
```
