# Contract: Invite welcome channel (per-invite)

**Feature**: 077-member-join-welcome  
**API**: `POST /api/servers/{server_id}/invites`

## Request body (additive)

| Field | Required | Notes |
|-------|----------|--------|
| `welcome_channel_id` | Conditionally | Required when server has no `welcome_channel_id` **and** no text channel named `geral`; must be a text channel on the server |
| existing fields | unchanged | `expires_in_seconds`, `include_history`, … |

## Behavior

- Stored on the **invite row only**; does **not** update server welcome settings.
- On accept of **this** invite: used only if owner destination and `geral` do not apply (FR-004).
- Missing when required → **400** with clear error.

## Response

Include `welcome_channel_id` on invite DTO when present (optional for clients).
