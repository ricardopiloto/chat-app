# Tasks

## 1. Recoverable session cleanup

- [x] 1.1 Make teardown's `disconnect(true)` wait finite in `frontend/src/voice/callSession.tsx`; release tracks and clear room state immediately, and ignore late completion from an old room.
- [x] 1.2 Bound `activeJoin`/`activeLeave` waits and server leave in the same file; use epoch or equivalent ownership so a stale completion cannot clear new guards or remove a newly reserved seat. Verify with a deliberately never-resolving disconnect and a subsequent join.
- [x] 1.3 Make `pagehide` clear `status` and `channel` alongside teardown, without waiting for async work. Verify a simulated pagehide followed by fresh entry does not show a phantom live call.

## 2. Desktop background behavior

- [x] 2.1 Set the main BrowserWindow's `backgroundThrottling` preference in `frontend/electron/main.ts`; confirm hiding to tray keeps the call live and restoring after a prolonged hide permits rejoin after an explicit leave.
- [x] 2.2 Exercise a two-client desktop call: hide one window, use an unrelated app, restore Parley, leave/rejoin, and verify no stuck connecting state or duplicate seat; include forced disconnect stall coverage.
  - Smoke plan (desktop build): A+B in same voice channel → A hide-to-tray → use another app ≥1 min → restore A → leave → rejoin same channel. Expect: no stuck “connecting”, one seat for A. Optional: stub `Room.disconnect` to never resolve before leave/rejoin; join must settle within ~8s.
- [x] 2.3 Acquire the Electron single-instance lock before main-window startup in `frontend/electron/main.ts`; quit a second launch without creating a window and route `second-instance` to the existing `showMainWindow()` path, including a launch during startup.
- [x] 2.4 In a desktop build, launch Parley, join a call, hide the main window to tray, and attempt another launch through the desktop shortcut/icon. Confirm the existing window is restored and focused, no second app process or call-owning renderer starts, and the call is unaffected. Also verify a second launch restores an already visible or minimized window.
  - Smoke plan: join call → hide to tray → launch via desktop icon → existing window shows/focuses, single process, call continues. Repeat with window visible and minimized.

## 3. Spec validation

- [x] 3.1 Run `openspec validate fix-stale-background-call-blocks-rejoin --strict` and confirm it passes with no errors.
