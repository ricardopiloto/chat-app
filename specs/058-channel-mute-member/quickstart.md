# Quickstart: 058-channel-mute-member

## Prerequisites

- Backend + frontend running; SQLite migrations applied through `0015`.
- Owner A; member B with role **Silenciar membros**; member C without it; text channel T.

## A — Kick ≠ delete account

1. As A, remove C from server (Gerir membros or panel).
2. **Expect**: confirm talks about server removal; C loses server access.
3. As C, log in again — account works; optional: create/join another server.

## B — Mute presets

1. As B (or A), open channel T, open members panel, **Silenciar** C for **5 minutes**.
2. As C on T: composer disabled with end time; cannot send.
3. As C on another channel: can send (if permitted).
4. Wait expiry or skip to C.

## C — Unmute + custom

1. Mute C with **custom** e.g. 2 minutes.
2. As A/B: menu on C → **Levantar silêncio**.
3. As C: composer works; send succeeds.

## D — Permission gate

1. As C (no mute cap), try to mute B — action absent or API 403.
2. Role permissions: enable **Silenciar membros** for a role and verify toggle saves.

## Validation commands

```bash
cd backend && cargo test --test contract kick -- --nocapture
cd backend && cargo test --test contract mute -- --nocapture
cd frontend && ./node_modules/.bin/tsc --noEmit
```

(Adjust test filter names to match files added in implement.)
