# Data Model: 061-channel-day-separators

No server entities. Client-derived presentation model over existing message rows.

## MessageRow (existing)

| Field | Type | Notes |
|-------|------|--------|
| id | string | Message id |
| createdAt | string \| undefined | ISO timestamp; if missing, treat as unknown — do not invent a day separator for that row alone without a parseable time (prefer skip day change vs inventing “today”) |
| sender | string | Account id (grouping) |
| text / attachmentIds | … | Unchanged |

## CivilDayKey

| Field | Type | Notes |
|-------|------|--------|
| value | string | `YYYY-MM-DD` in **local** timezone |

**Derivation**: from `createdAt` via local Y/M/D. Adjacent messages with the same key → no new separator between them. Missing/invalid `createdAt` → no day-key change (implementation SHOULD document: attach to previous day’s group or omit separator emission for that boundary).

## DayLabel

| Field | Type | Notes |
|-------|------|--------|
| text | string | `Hoje` \| `Ontem` \| `DD Mês AAAA` |
| dayKey | CivilDayKey | Source day |

**Resolution** (relative to local “now”):

```text
if dayKey == todayKey     → Hoje
else if dayKey == yesterdayKey → Ontem
else → padded day + PT month name + year
```

## TimelineItem

Discriminated union used for render:

| kind | Fields | Notes |
|------|--------|--------|
| `day-separator` | `dayKey`, `label` | One per distinct day present in loaded messages; emitted **before** first message of that day |
| `msg-group` | `sender`, `items: MessageRow[]` | Consecutive same-sender rows **within the same dayKey** |

**Invariants**:

- Number of `day-separator` items = number of distinct civil days among loaded messages with valid timestamps (SC-001).
- No `day-separator` for calendar days with zero messages in the loaded list (FR-003).
- Empty message list → zero timeline items (no sticky).

## StickyDayState

| Field | Type | Notes |
|-------|------|--------|
| dayKey | CivilDayKey \| null | Day currently in view, or null if empty |
| label | string \| null | `formatDayLabel(dayKey)` |
| visible | boolean | `true` only when there are messages **and** inline separator for `dayKey` is **not** visible at top of scrollport |

## State transitions

```text
messages load / paginate / WS append / delete
  → rebuild timeline (separators + groups)
  → re-bind observers → refresh StickyDayState

scroll / intersection change
  → update dayKey in view
  → visible = !(inline sep for dayKey visible at top)

local midnight / focus after sleep
  → recompute labels (Hoje/Ontem) on separators + sticky
```

## Validation

- Separators MUST NOT be persisted or sent as messages.
- Labels MUST match [contracts/day-label-format.md](./contracts/day-label-format.md).
- Sticky MUST NOT count toward SC-001 inline separator count.
