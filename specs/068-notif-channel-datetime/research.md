# Research: 068-notif-channel-datetime

## R1 — Where labels are built today

**Decision**: Change only the **link text** in `frontend/src/shell/TopBar.tsx` for:

1. Durable rows: today `{Menção|Resposta} · canal {id.slice(0,8)}…`
2. Session unseen: today `Canal {id.slice(0,8)}…`

Section headings («Menções e respostas», «Canais com mensagens novas») stay — they are not per-item type labels.

**Rationale**: Spec FR-003 targets the **item line**, not removing section context.

**Alternatives considered**: Remove section titles — rejected (still useful grouping).

## R2 — Resolving channel names

**Decision**:

- Maintain a `Record<channelId, string | null>` cache in TopBar (or small helper module).
- On durable list load / unseen ids change / panel open: for each unique `channel_id`, if missing from cache, `GET /api/channels/{id}` (existing route used by ChannelRoute) and store `name`.
- On 404 / error: store sentinel / use fallback label «Canal indisponível» (FR-005).
- Do **not** require a new batch API for MVP; dedupe parallel fetches with an in-flight map.
- Optional later: reuse sidebar channel list if already in memory — not required if GET is cheap.

**Rationale**: Notifications already carry `channel_id`; product already exposes channel by id; current name satisfies «nome actual» after rename.

**Alternatives considered**: Embed `channel_name` on notification API — out of scope (no BE change). Show name only when channel is in sidebar cache — fails for muted/hidden edge cases.

## R3 — Day/time formatting

**Decision**: Add `formatNotifWhen(iso: string, now = new Date()): string` in `frontend/src/lib/notifFormat.ts`:

- Parse `created_at` as Date (local).
- Civil day via same idea as `civilDayKey` in `daySeparators.ts` (reuse import if clean).
- Today → `Hoje HH:MM` (24h, zero-padded minutes).
- Yesterday → `Ontem HH:MM`.
- Else → `DD mmm HH:MM` with short PT month abbrev (`set`, `jan`, …) lowercase, matching product language (spec example «08 set 14:32»).
- Invalid date → empty string or «—» (do not show raw ISO).

**Rationale**: Clarify Q1; align with 061 Hoje/Ontem vocabulary without full «08 Setembro 2026» (too long for one-line panel).

**Alternatives considered**: `toLocaleString` only — less consistent Hoje/Ontem. Absolute always — rejected by clarify.

## R4 — One-line layout

**Decision**: Single `<A>` child text or inline spans:  
`<span class="topbar-notif-channel">{name}</span> <span class="topbar-notif-when">{when}</span>`  
CSS: when muted/smaller; flex/nowrap with ellipsis on name if needed so time stays visible.

**Rationale**: Clarify Q3; FR-002a.

**Alternatives considered**: Two-line block — rejected. Tooltip-only time — rejected.

## R5 — Session unseen section

**Decision**: Same name resolution cache; label = channel name only; **no** `formatNotifWhen` (clarify Q2). Click stays `/channels/{id}`.

**Rationale**: Session Set has no timestamp.

## R6 — Out of scope

**Decision**: No changes to notification creation, WS payload, mark-read, badge logic, or panel overflow (066).
