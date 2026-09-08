# Data Model: 050-invite-permission-ui

Sem entidades persistidas novas. Predicados de UI / autorização:

## Predicates

| Name | Meaning |
|------|---------|
| `isOwner` | `server.owner_account_id === me.id` |
| `hasInviteCap` | ∃ assigned role with `capabilities.can_create_invites === true` |
| `canCreateInvites` | `isOwner \|\| hasInviteCap` |
| `showRolesGear` | `isOwner` (unchanged this feature) |
| `showInviteButton` | `canCreateInvites` |

## Capability source

- Role list for current server (includes `member_ids` + `capabilities`)
- Aggregate = logical OR across assigned roles (same as other server caps)

## Transitions

```text
assign role with can_create_invites → after roles refresh → showInviteButton true
remove cap / unassign → after roles refresh → showInviteButton false (unless owner)
```

## Validation

- Non-owner without cap: button absent; API create remains 403.
- Non-owner with cap: button present; API create succeeds under normal TTL/uses rules.
- Owner: button always present.
