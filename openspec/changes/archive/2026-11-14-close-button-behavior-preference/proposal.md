# Proposal

## Why

Clicking X always hides the desktop main window to the tray (`frontend/electron/main.ts:98-103`), even when the person intends to quit. The unarchived `electron-system-tray-notifications` change introduced this unconditional behavior; it needs a remembered per-install choice.

## What Changes

- On the first close with no saved choice, ask whether X should hide to tray or quit; apply and persist an explicit choice. Dismissal hides without saving and asks again next time.
- Apply saved choices silently on later closes, including `mesa:close` (`main.ts:411`); quit via the existing `isQuitting`/`app.quit()` sequence (`:76-78`).
- Add a desktop-only Settings control in `frontend/src/pages/Account.tsx:294-314` to change the choice in either direction, effective on the next close without restart.

## Capabilities

### Modified Capabilities

- `desktop/shell`: add remembered close behavior, first-close choice, and desktop Settings control. This makes the unarchived tray change's hide-on-close rule conditional while retaining its tray menu.

## Impact

- `frontend/electron/main.ts` lifecycle, persistence, and IPC; `frontend/electron/preload.ts` and `frontend/src/env.d.ts` bridge; `frontend/src/pages/Account.tsx` and localization.
- Native per-install state only. No Rust backend, server API, browser control, or new dependency.
