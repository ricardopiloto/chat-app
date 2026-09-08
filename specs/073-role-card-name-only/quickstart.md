# Quickstart: 073-role-card-name-only

## Prerequisites

- App running; account that can open server settings → **Perfis** / papéis (`/servers/:id/settings/roles`).
- At least one system role (e.g. Dono) and ideally one custom role.

## A — Heading shows name only

1. Open roles manage list.
2. For each card, `.permission-card-heading` shows **only** the role name (e.g. «Dono»).
3. Confirm no «posição …» and no «(sistema)» in that heading.

## B — Actions still work

1. Reorder a custom role with ↑/↓ (if available) → list order updates.
2. Open **Permissões** → detail page loads as before.
3. System role still cannot be deleted; custom deletable role still can.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Pass criteria

A–B match [spec.md](./spec.md) SC-001–SC-003.
