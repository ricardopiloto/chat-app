# Contract: TopBar notif panel — seen, 5+, Limpar, bell

**Feature**: 071-notif-seen-collapse  
**Surface**: `frontend/src/shell/TopBar.tsx` (+ session prefs, Channel viewport)

## Sections (order)

1. **Menções e respostas** — durable unread list (068 one-line labels). **Always** full rows; never 5+.
2. **Canais com mensagens novas** — session unread items aggregated **per channel**:
   - `count ≤ 5`: up to 5 detail links (channel name + optional when from item `createdAt`).
   - `count > 5`: **exactly one** row: `{channelName} · 5+ notificações pendentes` (or equivalent short PT copy).
3. Header/footer control **Limpar** when section(s) non-empty; hidden/disabled when both empty.

## Navigation

| Row | Href / action |
|-----|----------------|
| Durable item | `/channels/{id}?msg={message_id}` + mark that notif read (existing) |
| Session detail | `/channels/{id}?msg={messageId}` |
| Session 5+ | `/channels/{id}?msg={oldestMessageId}` |
| Limpar | Mark all durables read (API) + clear session map; close optional |

## Auto-dismiss

- When message `M` is ≥~50% visible in channel history scroll root: mark matching durable unread(s) with `message_id=M` read; remove session item(s) for `M`.
- Opening channel **without** `M` visible MUST NOT clear durables / session items for other messages.

## Badge & bell

- Dot when durables.length > 0 **or** session has any item; **no** numeric badge.
- Bell icon size **24** (was 20); dot remains visible/aligned.

## Non-goals

- Collapsing mention/reply rows.
- Numeric badge.
- Confirm dialog on Limpar.
- Changing 068 datetime format rules.
