# Quickstart: User Display Name

**Feature**: 099-user-display-name  
**Date**: 2026-09-11

Manual validation for [spec.md](./spec.md) SC-001–SC-006. See [contracts/](./contracts/).

## Prerequisites

- App running (FE + BE).
- Two accounts (A and B) on the same server when testing peers.

## Build / backend checks

```bash
cd frontend && npm run build
cargo test -p chat-backend --lib  # or project’s usual account/API test target
```

## US1 — Set / clear in account menu

1. Sign in as A; open account menu from the user panel.
2. Set a **display name** (e.g. `Alice Mesa`) and save.
3. Reopen menu — value persists; **no** editable username field.
4. Confirm «Ligado como» / signed-in-as still shows A’s **handle**.
5. Clear display name and save — treated as unset.

**Pass**: SC-001, SC-004, SC-005 (also re-login once with a saved name).

## US2 / US3 — User panel vs signed-in-as

1. With display name set: user panel **primary** line = display name.
2. Account menu signed-in-as = **handle**.
3. Clear display name: panel primary = handle again.

**Pass**: SC-002, SC-003.

## US4 — Peers

1. A sets display name; B refreshes/opens members and a text channel.
2. B sees A’s **display name** on member list and chat authorship (not handle).
3. Optional: both in voice — B’s roster/nameplate shows A’s display name.
4. A’s own signed-in-as still shows handle.

**Pass**: SC-006.

## Regression

- [ ] Login still uses handle
- [ ] `@handle` mentions still insert/resolve by handle
- [ ] Avatar upload/delete still works in account menu
- [ ] Empty/whitespace display name falls back to handle for peers

## Failure signals

| Symptom | See |
|---------|-----|
| Peers stuck on handle | [ADN-04](./contracts/account-display-name.md) / member payloads |
| Panel wrong label | [PDL](./contracts/public-display-label.md) |
| Can edit username | FR-002 |
