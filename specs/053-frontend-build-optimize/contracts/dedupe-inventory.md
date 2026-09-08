# Contract: Dedupe inventory

**Feature**: 053-frontend-build-optimize  
**Surface**: `specs/053-frontend-build-optimize/inventory.md` (+ helpers em `frontend/src/lib/` ou equivalente)

## Inventory document (normative)

MUST list every JS duplication cluster found in the review with:

```text
### <id> — <title>
- Files: …
- Target helper: … | n/a
- Status: unified | false-positive | intentional-divergence
- Notes: …
```

## Status rules

| Status | Meaning |
|--------|---------|
| `unified` | Call sites use the shared helper; no unjustified divergent copies remain |
| `false-positive` | Looked alike; not the same intent |
| `intentional-divergence` | Same family but different product behaviour (e.g. auth vs voice join messages) — document why |

No cluster may remain without one of the three terminal statuses at feature completion.

## Minimum unified clusters

Regardless of inventory length, these MUST be `unified`:

1. Generic API/unknown error → user-facing string
2. Server role/capability gates used by primary UI decisions

## Helper documentation (FR-007)

Each new shared helper module MUST include a short file-level comment: purpose + list of migrated surfaces (or link to inventory id).
