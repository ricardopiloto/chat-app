# Data Model: 054-channel-rename

## Channel (existing)

| Field | Rename relevance |
|-------|------------------|
| `id` | Target of PATCH |
| `server_id` | Membership / owner check |
| `name` | **Mutable** via rename |
| `created_by_account_id` | Creator may rename |
| `type` | Text and voice both allowed |
| `visibility` / ACL | Must still **see** channel to rename in UI |

No new tables or columns.

## Validation (name)

| Rule | Behaviour |
|------|------------|
| Trim | Leading/trailing whitespace removed |
| Non-empty after trim | Required |
| Max length | Match create if any exists; else reasonable product max (document in implement if create has none beyond non-empty) |
| Uniqueness per server | **Not** required |

## Authorization (logical)

```text
can_rename(caller, channel, server) =
  caller == server.owner
  OR caller == channel.created_by
  OR aggregated_caps(caller, server).can_manage_channels
```

## State (UI)

```text
idle --dblclick/dbltap (if can_rename)--> editing
editing --Enter / valid blur--> idle (saved)
editing --Escape / invalid--> idle (restored)
```
