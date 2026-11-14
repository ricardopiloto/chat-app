# Design

## Context

The main window is hidden, not destroyed, by `attachMainWindowLifecycle` (`frontend/electron/main.ts:98-103`). In the current session, `join()` waits indefinitely for `activeJoin` (`callSession.tsx:498-507`), while `joinOnce()` waits for `activeLeave` and may call `leave()` (`:511-515`). `leaveOnce()` sets idle signals before awaiting `teardown()`'s `room.disconnect(true)` and the server leave (`:341-356`). A disconnect that never settles can therefore keep `activeLeave` and `activeJoin` pending. This is a concrete unbounded-wait path; the reported sequence alone does not prove that Chromium throttling is its trigger. Independently, `onPageHide` calls `teardown()` without resetting `status` or `channel` (`:713-717`), creating a roomless, non-idle state after a page lifecycle event.

The same tray sequence admits another plausible cause: the hidden window remains alive, but every new Electron launch reaches `app.whenReady()` and creates its own main window (`frontend/electron/main.ts:675-693`). Tray open and dock activation already restore the existing window through `showMainWindow()` (`:67-74,86-94,701-709`). A desktop shortcut relaunch can therefore create a second renderer with an independent call session; the report alone does not establish whether this occurred.

## Goals / Non-Goals

**Goals:** a new user initiated join settles and can acquire a fresh seat after an old session stalls; stale work cannot tear down the replacement room; ordinary hide to tray keeps the current call; relaunching desktop Parley returns to its existing main window and call.

**Non-Goals:** change the intended tray lifecycle; automatically rejoin after reload; modify the Windows popout join fix.

## Decisions

### D1. Bound old-session cleanup and guard waits

Use one finite cleanup deadline for `disconnect(true)` and the server leave, and an operation generation for ownership. On deadline, clear the guard and advance the generation before permitting a new join; any late resolution or callback must fail its generation check. Keep local track release and room detachment synchronous. A replacement join must reserve the new seat only after the old leave has settled or timed out; server occupancy's account upsert can replace a stale seat (`backend/src/api/voice.rs:202-237`).

*Alternative rejected:* clearing `activeLeave` alone. That lets a late old leave remove the new server seat, so both server cleanup ordering and generation checks are required.

### D2. Make page lifecycle cleanup atomic

Route `pagehide` through a synchronous state reset that invalidates the epoch, sets idle/null, and schedules best-effort server leave. Do not await work in the page event. Keep tray hide separate: it does not fire `pagehide` and must not hang up.

*Alternative rejected:* relying on status checks in `joinOnce` to repair a roomless state. The UI can remain misleading before a join is attempted.

### D3. Preserve the desktop renderer's call timers while hidden

Set `backgroundThrottling: false` for the main call-owning BrowserWindow and verify heartbeat and LiveKit behavior in a packaged desktop build. This reduces the suspected trigger, while D1 still guarantees recovery if a promise stalls for any reason.

*Alternative rejected:* using Electron's preference alone. It cannot guarantee a network operation settles.

### D4. Enforce one desktop app instance and restore the existing window

Acquire Electron's single-instance lock before the `whenReady()` startup path (`frontend/electron/main.ts:675-693`); if it fails, quit the new process before it creates a window. Handle `second-instance` in the lock-owning process by calling `showMainWindow()` (`:67-74`), which already restores minimized windows, shows hidden windows, and focuses them. This belongs in the same change because a shortcut relaunch while the call-owning window is hidden can present as a failed rejoin or conflicting call session; keeping one renderer closes that path alongside recovery from stale session work.

*Alternative rejected:* allow multiple app instances and coordinate their call sessions through IPC. That adds cross-process ownership and cleanup complexity when a second launch only needs to reopen the first window.

## Risks / Trade-offs

- [A timed-out disconnect might finish late] → epoch and room-identity checks prevent it from touching the replacement session; server leave is ordered or bounded before new join.
- [Turning off background throttling uses more resources] → limit it to the main window and verify idle resource use.
- [A second launch arrives before the main window is ready] → keep the lock and `second-instance` handler available during startup; restore the main window once it exists.
