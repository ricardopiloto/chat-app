# Quickstart: 063-channel-acl-edit-parity

## Prerequisites

- Backend + frontend running; server with roles that include **Gerenciar canal** and distinct `position` values.
- Accounts: **Owner**, **Creator** (mid/high role), **ManagerHigh** (manage channels, position **above** creator), **ManagerLow** (manage channels, position **at or below** creator), **Member** (no manage).

## A — ManagerHigh: permissões + apagar

1. Sign in as ManagerHigh.
2. Open channel created by Creator → context menu.
3. **Expect**: «Permissões do canal» and delete available.
4. Open permissions → change a safe overwrite → Guardar.
5. **Expect**: success; inspect works for a member.
6. Delete a non-last channel of its type (confirm).
7. **Expect**: channel removed.

## B — ManagerLow: blocked by hierarchy

1. Sign in as ManagerLow on a channel whose creator has equal/higher position.
2. **Expect**: no permissions/delete (or API 403 if forced).
3. **Expect**: cannot save ACL / delete / inspect that channel.

## C — Creator + Owner regression

1. Creator on own channel: permissions + delete still work.
2. Owner on any channel: permissions + delete + inspect still work.
3. Member: no permissions/delete.

## D — ACL subject hierarchy

1. As ManagerHigh, try overwrite on a role/member with position ≥ ManagerHigh.
2. **Expect**: 403 / clear error; entry not saved.
3. Overwrite on lower role or «todos os membros» → allowed (if channel gate passed).

## E — Rename alignment

1. ManagerHigh can rename Creator’s channel; ManagerLow cannot (403 or no UI).

## Validation commands

```bash
cd backend && cargo test --test contract
cd frontend && ./node_modules/.bin/tsc --noEmit
```
