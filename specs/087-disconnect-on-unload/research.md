# Research: 087-disconnect-on-unload

## R1 — Why ghosts persist today

**Decision**: Treat root cause as **unload leave not reliably completing**, not missing occupancy model.

Evidence:
- `pagehide` → `void hangup()` which `await`s `releaseLocalCapture` then `leaveVoice` (`fetch` without `keepalive`).
- Browsers often abort non-keepalive async work on tab close/refresh → occupant row remains.
- `expire_stale` (45s) exists but runs mainly when join/media/occupancy handlers run; a peer who only listens to `voice.occupancy` WS may never trigger cleanup → ghost until something else hits the API.

**Alternatives considered**: “Only improve TTL” — insufficient for SC-001/002 (10s) when leave should succeed on normal refresh.

---

## R2 — Client unload leave: keepalive first

**Decision**: On `pagehide` (and optionally `visibilitychange` → hidden as secondary), if `live()` and `channelId`:
1. Fire **`POST /api/channels/{id}/voice/leave`** with `fetch(url, { method: "POST", credentials: "include", keepalive: true })` (or equivalent helper). Cookies must be included.
2. Then best-effort local teardown (sync-ish stop tracks / `hangup` without blocking leave).
3. Guard with a flag so in-app `hangup` + unload do not double-error (leave already idempotent 204).

Prefer **not** to wait for full `releaseLocalCapture` before leave on unload (FR-007 vs unload: presence clear first).

**Rationale**: Spec FR-001/002/006; MDN keepalive for unload. Aligns with 035 best-effort unload notes.

**Alternatives considered**:
| Option | Why rejected / deferred |
|--------|-------------------------|
| Only `navigator.sendBeacon` | Cookie/session auth harder; POST body/cookies more awkward than keepalive fetch |
| `beforeunload` sync XHR | Deprecated/unreliable; stick to `pagehide` |
| Rely only on LiveKit disconnect | Occupancy is Mesa DB, not LiveKit room state |

---

## R3 — Server stale safety net + broadcast

**Decision**: Keep `OCCUPANT_STALE_SECS` ≈ 45s (already under 1 min). Add a **periodic server sweeper** (e.g. tokio interval ~15–30s) that calls the same `expire_stale` / `apply_leave` path so `voice.occupancy` is **broadcast** to server members without waiting for a peer GET/join.

Also keep expire-on-request as today (defense in depth).

**Rationale**: FR-006/008, SC-005/006; WS-only peers must see ghosts clear.

**Alternatives considered**: Force all clients to poll occupancy every 20s — works but more FE load and still slower without broadcast; sweeper is cleaner.

---

## R4 — One call per account

**Decision**: No schema change. Existing join upsert already moves/leaves other channels. Unload leave clears the single occupancy row for the account → remaining Mesa tabs must not invent presence (FR-007).

**Rationale**: Clarify Q1.

---

## R5 — Intentional leave unchanged

**Decision**: In-app Leave / `hangup` keeps current order (release local then leave). Unload path is an additional fast leave; both idempotent.

**Rationale**: US3 / FR-005.

---

## R6 — Auth session vs call session

**Decision**: Do not clear Mesa login cookies on unload. Only voice occupancy / LiveKit disconnect.

**Rationale**: Spec Assumptions.
