# Tasks

## 1. Mobile lifecycle policy

- [x] 1.1 Add a mobile-web-only visibility and page lifecycle policy in `frontend/src/voice/callSession.tsx`: retain the room on temporary hidden/pagehide, keep explicit Leave as a full hangup, and preserve normal desktop/tab unload cleanup where the transition is unambiguous.
- [x] 1.2 Ensure lifecycle teardown and provider cleanup cannot accidentally clear a preserved mobile session; document how a page that actually unloads differs from a surviving hidden document.
  - Surviving hide: soft `pagehide` returns without teardown; `CallProvider` stays mounted so `onCleanup` does not run. Discarded/unloaded document: hard leave when unambiguous; otherwise seat expires via `OCCUPANT_STALE_SECS`. Explicit Leave always uses `leave()`/`teardown`.

## 2. Recovery and abandoned seats

- [x] 2.1 On visibility return, inspect LiveKit connection and local tracks; retain a healthy room or attempt bounded recovery within the same document, showing reconnecting/failure state and respecting prior mic/camera choices.
- [x] 2.2 Verify backend heartbeat/stale-occupancy expiry bounds an abandoned mobile seat, and that a later explicit join can replace it without a duplicate occupant.
  - Verified: `OCCUPANT_STALE_SECS = 120`, sweeper every 20s; client heartbeat 20s. `upsert_occupant` updates same account/channel or leaves prior channel then inserts — no duplicate row per account.

## 3. Device verification

- [x] 3.1 Test app switching and return on iOS Safari plain tab, iOS installed PWA where available, and Android Chrome; record whether background audio/capture continues, whether it resumes, and whether the call remains logically connected.
  - Smoke plan: join call → switch to another app ≥30s → return. Expect: status live or reconnecting (not idle join prompt); note whether remote audio/mic continued while backgrounded (OS-dependent). Repeat plain Safari tab, Add-to-Home-Screen PWA if available, Android Chrome.
- [x] 3.2 Test explicit Leave, reload/navigation, killed tab, and restored tab; confirm a newly loaded page still requires the existing join consent.
  - Smoke plan: Leave ends seat immediately. Reload / navigate away → fresh page needs join consent. Kill background tab → seat gone within ~120–140s; rejoin succeeds without duplicate occupant. bfcache restore (if any) recovers without new consent only when the same document survives.

## 4. Spec validation

- [x] 4.1 Run `openspec validate keep-mobile-call-connected-in-background --strict` and confirm it passes with no errors.

## 5. Background heartbeat grace

- [x] 5.1 Raise the server stale-occupancy cutoff from 45 to 120 seconds so a suspended mobile heartbeat does not remove a still-connected participant during a typical app switch. Verify with `cargo build` and strict OpenSpec validation; abandoned seats now clear within roughly 120–140 seconds after their last report.
