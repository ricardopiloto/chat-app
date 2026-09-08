# Contract: Channel rename API

**Feature**: 054-channel-rename  
**Endpoint**: `PATCH /api/channels/{channel_id}`

## Request

```json
{ "name": "novo-nome" }
```

Optional other existing fields (`visibility`, …) unchanged in semantics. Rename UI SHOULD send only `name`.

## AuthZ

Caller must be server member **and** satisfy:

- server owner, **or**
- channel creator, **or**
- effective `can_manage_channels`

Otherwise **403**.

## Validation

| Input | Result |
|-------|--------|
| missing `name` | No name change (other fields may still apply) |
| `name: "  "` / `""` | **400** — name required |
| `name: "avisos"` | **200** — channel with updated name |
| Duplicate of another channel’s name | **200** — allowed |

## Response

`200` + full `Channel` JSON including new `name`.

## Acceptance probes

1. Creator patches own channel name → 200.
2. Owner patches other’s channel → 200.
3. Member with `can_manage_channels` patches → 200.
4. Unrelated member → 403; name unchanged.
5. Empty name → 400.
