# Design

## Context

`attachMainWindowLifecycle` always cancels close and hides (`frontend/electron/main.ts:98-103`); `window-all-closed` checks `isQuitting` (`:716-720`). Tray Fechar sets that flag and calls `app.quit()` (`:76-78`). The app close IPC calls `BrowserWindow.close()` (`:396-411`). `mesa-instance.json` stores server URL and session token under `app.getPath("userData")` (`:20,263-284`); `frontend/src/lib/localPrefs.ts` uses browser storage. The native bridge is in `frontend/electron/preload.ts:23-39` and `frontend/src/env.d.ts:13-35`. Settings is `frontend/src/pages/Account.tsx:294-314`.

## Goals / Non-Goals

**Goals:** decide closes in the Electron main process; persist an explicit choice per install; expose it in desktop Settings and apply changes on the next close.

**Non-Goals:** change tray Fechar, secondary-window close behavior, browser behavior, or server/account preferences.

## Decisions

### D1. Use a separate desktop settings JSON file

Store a validated `closeBehavior: "tray" | "quit" | null` in `mesa-app-settings.json` under `app.getPath("userData")`; null means undetermined. Load before attaching the main-window lifecycle. Missing, unreadable, or invalid data stays undetermined. Update in-memory state only after a successful write; expose narrowly scoped load/save IPC and validate writes in the main process.

*Alternative rejected:* add the field to `mesa-instance.json`. That file represents server identity, and `clear-instance` replaces it (`main.ts:653`), potentially erasing an unrelated app choice. Browser `localStorage` is likewise not native install state.

### D2. Resolve first close with an in-app modal matching the design system

Prevent the close event while undetermined. The main process sends an IPC close-prompt event to the renderer, which shows a SolidJS modal using the shared `Dialog` and `Button` components (`frontend/src/components/ui/Overlay.tsx:17-19,49-69`; `frontend/src/shell/SignOutDialog.tsx:23-48`). Offer explicit Hide to tray and Quit actions, a dismiss path through Escape, backdrop, or close button, and wording that an explicit selection is remembered. The main process holds the close request pending until the renderer responds and guards duplicate close events during the prompt. Follow the existing bridge conventions: `ipcRenderer.on` with a returned unsubscribe function for main-to-renderer events (`frontend/electron/preload.ts:55-59,72-75`), `ipcRenderer.send` or `invoke` for the renderer response (`frontend/electron/preload.ts:51-53,63-70`), and matching methods on `MesaNativeBridge` (`frontend/src/env.d.ts:27-49`). Correlate each response with its pending prompt so late responses after dismissal or timeout cannot save a choice or quit. After an explicit selection is persisted, hide or set `isQuitting = true` and call `app.quit()`. On dismissal, write failure, or no renderer response within a bounded timeout (renderer not yet loaded, unresponsive, or window destroyed), hide without saving so the next close asks again. A saved choice skips the modal. Localize labels in the pattern of tray labels (`main.ts:59-63`).

*Alternative rejected:* a native `dialog.showMessageBox` was the original approach and is simpler because it needs no renderer round trip, but its system styling breaks the app's visual immersion. A bounded timeout on the IPC round trip preserves its reliability guarantee: a close never blocks indefinitely, even when the renderer cannot respond.

### D3. Gate the Settings control on the native bridge flag

Show a dedicated Account section only when `window.__MESA_NATIVE__`, as in `frontend/src/chat/osNotify.ts:18,39`. Load and save via `window.mesaNative`; display saved or unchosen state, retain the prior value and show an error on failed save, and reflect successful edits immediately. Add localized strings. Saving in Settings is an explicit choice and suppresses the first-close prompt.

*Alternative rejected:* a browser control using `frontend/src/lib/localPrefs.ts`; browsers have no Parley tray/quit distinction and browser storage is not tied to the desktop install.

## Risks / Trade-offs

- [Overlapping lifecycle edits] → `electron-system-tray-notifications` introduced the current `close`/`window-all-closed` behavior. The in-flight `fix-stale-background-call-blocks-rejoin` also touches `frontend/electron/main.ts:98-103,716-720` and `showMainWindow()` (`:67-74`). Sequence or coordinate both edits so preference handling, tray lifecycle, and single-instance restoration all survive; this change conditionally supersedes the tray delta's unconditional hide rule.
- [Preference write fails] → keep the state undetermined, hide for that attempt, ask again on the next close, and surface errors in Settings.
