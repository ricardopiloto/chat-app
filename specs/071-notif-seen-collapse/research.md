# Research: 071-notif-seen-collapse

## 1. Auto-clear durable on message viewport

**Decision**: When a message enters the text history viewport (≥ ~50% intersection, same spirit as `highlightSeen` IO), if there is an unread durable notification with that `message_id`, call `markNotificationRead` and remove it from TopBar state (event or shared refresh).

**Rationale**: Spec/clarify require viewport (not channel open). Channel already observes `.msg-highlight-me`; extend to also clear matching durable ids (and session items) for observed message ids — including non-highlight messages that appear in session unseen.

**Alternatives considered**:
- Clear on channel enter — rejected (clarify Q2).
- Clear only on TopBar click — status quo; rejected.

## 2. Session «não lidas de canal» model for 5+

**Decision**: Replace `Set<channelId>` with per-channel ordered list of session unread items `{ messageId, createdAt }` (cap e.g. 50/channel). On `message.new` while channel not focused, append. UI: group by channel; if `count > 5` → one **5+** row; else up to 5 detail rows (channel name + `formatNotifWhen`). Click 5+ → `/channels/{id}?msg={oldestMessageId}`.

**Rationale**: Current one-id-per-channel can never show 5+; clarify requires aggregation only for channel unreads, not mentions.

**Alternatives considered**:
- Keep Set + show «5+» based on server `has_unread` — no per-message oldest link.
- Collapse durable mentions by channel — rejected (clarify).

## 3. Stop clearing session unseen on ChannelRoute enter

**Decision**: Remove `markSeen(channelId)` from `ChannelRoute` enter effect. Clear individual session items when those messages hit viewport (and `clearAllUnseen` on Limpar). Keep BE `markChannelRead` for rail unread (037) as today if already separate.

**Rationale**: Opening channel must not wipe pending items before viewport (align durable + session).

**Alternatives considered**: Clear all on enter — contradicts viewport rule.

## 4. Mentions / replies vs 5+

**Decision**: Durable list (`kind` mention|reply) always render full rows (068 labels). Never fold into 5+. Session section alone uses 5+.

**Rationale**: Clarify Q + Q5.

## 5. Limpar

**Decision**: Panel control «Limpar» when any durable unread **or** session items exist. Persist durables via new `POST /api/notifications/read-all` (mark all unread for account). Client: clear durable list + `clearAllUnseen()`. No confirm dialog.

**Rationale**: Spec FR-010–012; durables need server persistence; session is client-only.

**Alternatives considered**: Loop N× `POST …/read` — works but noisy; prefer one endpoint. Limpar only durables — weaker vs «limpar as notificações» in same panel.

## 6. Badge binário + sino maior

**Decision**: Keep existing `.topbar-notif-dot` (no numeric badge). Increase `IconBell` from `size={20}` to **24** (modest step vs search/theme).

**Rationale**: Clarify badge = binary; already implemented; polish size only.

## 7. Sync TopBar when Channel clears a notif

**Decision**: Dispatch a small window custom event (e.g. `mesa:notification-read` with `{ messageId }` / `{ notificationId }`) or export a tiny signal module; TopBar filters `durableNotifs` / session store reacts.

**Rationale**: Avoid prop-drilling through AppShell; match existing prefs pattern.

## 8. Oldest unread

**Decision**: Oldest = earliest `createdAt` (or insertion order) among session items for that channel; prefer `messageId` of that item for `?msg=`.

**Rationale**: Clarify click 5+.
