# Quickstart: 046-invite-5min-window

Validar TTL 5 min (default), teto 10 usos, sem permanente, legados invalidados.

## Prerequisites

- Backend com migração `0011` aplicada; `DEFAULT_INVITE_TTL_SECS` omitido (=300) ou explícito.
- Dois browsers / contas de teste; dono de um servidor.

## Setup

```bash
cd backend && cargo test --test contract invites -- --nocapture
cd backend && cargo test --test contract auth_register -- --nocapture
# opcional UI
cd frontend && npm run dev
```

## Scenarios

### A — Create uses instance TTL

1. Owner creates invite via UI (no TTL in body).
2. Expect `expires_at` ≈ now+5m; not null.
3. API `expires_in_seconds: null` → **400**.

### B — Multi-use until 10

1. Fresh invite; register/accept up to **10** distinct accounts into that server.
2. 11th attempt fails (410/403).
3. All 10 are members of **that** server only.

### C — Time expiry

1. Create invite with `expires_in_seconds: 1` (test) or mock clock in contract test.
2. After expiry, preview/register/accept fail even if `use_count < 10`.

### D — Legacy wipe

1. On DB before migration: insert permanent usable invite.
2. Run migrations.
3. That code no longer usable; new invite works.

### E — Server scope

1. Invite for server S; join succeeds only on S (regression).

## Expected outcome

- SC-001–SC-007 cobertos por contract + smoke.
- Contrato [invite-ttl-uses.md](./contracts/invite-ttl-uses.md) cumprido.
