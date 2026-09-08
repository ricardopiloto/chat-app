# Quickstart: 059-server-owner-role

## Prerequisites

- Backend with migration `0016` applied (`cargo run` / test app migrate).
- Frontend `npm run dev`.
- Two accounts optional for assign-reject probes.

## A — New server bootstrap

1. Log in as A; create a server.
2. Open **Definições → Perfis** (or roles list).
3. **Expect**: role **Dono** exists; open permissions → all toggles on and **not** editable; no delete on Dono.
4. Open members panel / Gerir membros → A under **Dono**, assignment locked.

## B — Protection API / UI

1. Try delete Dono → fails.
2. Try create another role named `Dono` → fails.
3. As owner, try assign another member to Dono (API or if option leaked) → fails; picker for B has no Dono.
4. Try change owner’s role away from Dono → fails / control locked.

## C — Migration (existing DB)

1. Use DB with a server created before feature (or insert fixture without Dono).
2. Run migrate / restart.
3. **Expect**: Dono present; owner assigned; if owner had another role, that role remains in catalog without the owner.

## D — Automated

```bash
cd backend && cargo test --test contract owner_role
cd frontend && ./node_modules/.bin/tsc --noEmit
```

(Filter name may match `owner_role_*` tests added in implement.)
