# Contract: Channel mute API

**Feature**: 058-channel-mute-member

## PUT `/api/channels/{channel_id}/mutes/{account_id}`

**Body**:

```json
{ "duration_minutes": 15 }
```

**Rules**:
- `duration_minutes` ∈ {5, 10, 15, 30} or integer 1–1440
- Actor: server owner **or** `can_mute_members`
- Target: member of server, not owner, not self
- Actor can view channel
- Upserts mute; `ends_at = now + duration_minutes`

**Responses**: `200` + mute JSON `{ channel_id, account_id, muted_by_account_id, created_at, ends_at }` | `400` | `403` | `404`

## DELETE `/api/channels/{channel_id}/mutes/{account_id}`

Same authZ as PUT. `204` if removed or already absent (idempotent preferred) | `403` | `404` channel.

## GET `/api/channels/{channel_id}/mutes/me`

Auth: any member who can view channel.  
`200` `{ muted: false }` or `{ muted: true, ends_at, muted_by_account_id? }`  
Expired mutes → `{ muted: false }` (lazy expiry).

## POST `/api/channels/{channel_id}/messages` (changed)

If caller has active mute → **403** with message indicating channel mute / ends_at.  
Edit/delete own message endpoints unchanged by mute.

## Capabilities

`RoleCapabilities.can_mute_members` in role create/patch/list JSON.

## Acceptance probes

1. Moderator with cap mutes 5 min → target POST message 403; other channel OK.
2. Without cap → PUT mute 403.
3. Unmute → POST message 200.
4. Custom 120 min accepted; 0 / 1441 rejected.
5. Mute owner / self → 403/400.
