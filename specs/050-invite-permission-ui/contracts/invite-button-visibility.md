# Contract: Invite button visibility (role capability)

**Feature**: 050-invite-permission-ui  
**Surface**: Sidebar server header — Convite control  
**Related**: Backend `POST/GET /api/servers/{id}/invites` (already gated); [047 server-roles](../047-server-channel-permissions/contracts/server-roles.md)

## UI visibility matrix

| Actor | Gerir papéis | Convite |
|-------|--------------|---------|
| Server owner | **MUST** show | **MUST** show |
| Member with `can_create_invites` (any assigned role) | **MUST NOT** show (this feature) | **MUST** show |
| Member without that cap | **MUST NOT** | **MUST NOT** |

## Predicates (FE)

```text
canCreateInvites =
  isOwner
  OR any role where member_ids ∋ me AND capabilities.can_create_invites
```

## API (verify existing)

| Method | Path | Allowed when |
|--------|------|----------------|
| POST | `/api/servers/{server_id}/invites` | Owner **or** aggregated `can_create_invites` |
| GET | same collection | Owner **or** aggregated `can_create_invites` |
| POST revoke | `/api/invites/{code}/revoke` | Owner **or** aggregated `can_create_invites` |

Forbidden for members without cap: **403** with clear message (existing).

## Forbidden patterns

- Gating **both** roles gear and invite under a single `isOwner()` Show.
- Showing invite when `!canCreateInvites`.
- Showing roles gear solely because `can_create_invites` is true.

## Acceptance probes

1. Non-owner + cap: `document.querySelector('[aria-label="Convite"]')` non-null; `[aria-label="Gerir papéis"]` null.
2. Non-owner − cap: both null (invite).
3. Owner: both non-null.
4. POST invite as (1) → **201**/success body with code/URL path.
