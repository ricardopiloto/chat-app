# Contract: Notification list labels (TopBar)

**Feature**: 068-notif-channel-datetime  
**Surface**: `frontend/src/shell/TopBar.tsx` notif panel lists

## Durable item (Menções e respostas)

**Before**: `{Menção|Resposta} · canal {uuid8}…`  
**After** (one line):

```text
{channelName}  {whenLabel}
```

- `channelName`: resolved channel name, or «Canal indisponível»
- `whenLabel`: `Hoje HH:MM` | `Ontem HH:MM` | `DD mmm HH:MM` (local)
- MUST NOT include Menção/Resposta or truncated channel id on the item line
- Click / `markNotificationRead` / href: **unchanged** from 062

## Session item (Canais com mensagens novas)

**Before**: `Canal {uuid8}…`  
**After**: `{channelName}` only (same fallback if needed)  
MUST NOT show day/time

## Name resolution

- Input: set of `channel_id` from durable notifs ∪ unseen session ids
- Output: map id → name
- Failure: fallback string; no long UUID as sole visible label

## CSS

- Optional `.topbar-notif-when` for secondary emphasis on time
- Truncation: prefer ellipsis on name, keep time readable

## Non-goals

- New notification API fields
- Changing section titles
- Badge / unread rules
