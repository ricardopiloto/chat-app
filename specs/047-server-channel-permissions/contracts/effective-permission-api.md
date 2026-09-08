# Contract: Effective permission enforcement

**Feature**: 047-server-channel-permissions  
**Surfaces**: messages, voice, channel get

## Helpers (domain)

| Helper | Meaning |
|--------|---------|
| `can_view_channel` | List/get/history/join room |
| `can_write_text` | POST message (text channels) |
| `can_speak_voice` | Publish mic/cam (voice channels) |
| `can_listen_voice` | Join as subscriber (view + listen level) |
| `can_create_channel` | POST create channel |
| `can_manage_channel_acl` | Owner or channel creator |
| `can_manage_roles` | Owner |

## HTTP mapping

| Action | Required | Failure |
|--------|----------|---------|
| GET channel / list includes | `can_view` | 404 (not 403) for hidden — avoid leaking existence |
| GET messages | `can_view` | 404 |
| POST message | `can_write_text` | 403 with clear PT message |
| Voice join | `can_listen_voice` (⊂ view) | 404/403 |
| Enable mic/cam / publish | `can_speak_voice` | 403; UI disables controls |
| Create channel | `can_create_channel` | 403 |
| Delete channel | existing creator\|owner | unchanged |

## Owner bypass

`server.owner_account_id` always passes view + max level on every channel in that server.

## Invite accept

After membership insert: no private grants; public channels with `visible_to_new_members` appear on next list (implicit rule).

## FE mirroring

- Composer hidden/disabled when `my_permission == read`
- Mic/cam disabled when `my_permission == listen`
- Trust BE; show PT errors from API
