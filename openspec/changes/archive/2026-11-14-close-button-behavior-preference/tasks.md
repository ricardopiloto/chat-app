# Tasks

## 1. Desktop preference and close lifecycle

- [x] 1.1 Add a separate `mesa-app-settings.json` reader/writer in `frontend/electron/main.ts`, loaded before main-window lifecycle attachment, with validation of tray, quit, and undetermined states. Verify saved values survive relaunch and missing/invalid data stays undetermined.
- [x] 1.2 Update `attachMainWindowLifecycle` to send an IPC close-prompt to the renderer instead of calling `dialog.showMessageBox`, with a bounded response timeout, duplicate-prompt guard, explicit-choice persistence, and hide-without-save behavior on dismissal, failure, or timeout. Verify every response and the following close in Electron, including the timeout fallback when the renderer is unresponsive or not yet loaded.
- [x] 1.3 Add an in-app close-choice modal in the SolidJS renderer using the existing design-system `Dialog` and `Button` styling, with Hide to tray and Quit actions and a dismiss affordance (Escape or backdrop). Add bridge methods and types in `frontend/electron/preload.ts` and `frontend/src/env.d.ts` to receive the close-prompt event and send the person's choice or dismissal to the main process.
- [x] 1.4 Route chosen quit through `isQuitting = true` and `app.quit()` while preserving tray Fechar and `window-all-closed`; coordinate the overlapping `fix-stale-background-call-blocks-rejoin` single-instance edits. Verify X and `mesa:close` follow the choice, normal cleanup runs, and tray restore works.

## 2. Desktop Settings control

- [x] 2.1 Add validated load/save IPC in `frontend/electron/main.ts` and matching bridge methods/types in `frontend/electron/preload.ts` and `frontend/src/env.d.ts`. Verify invalid IPC values are rejected and saved changes affect the next close without restart.
- [x] 2.2 Add a `window.__MESA_NATIVE__`-gated control in `frontend/src/pages/Account.tsx` with localized copy and save-error handling. Verify tray→quit and quit→tray changes, and absence in a browser build.

## 3. Integration and spec validation

- [x] 3.1 Run the frontend type/build check and manually exercise first close, dismissal, relaunch, Settings changes, active-call hide, and normal quit in a desktop build. Confirm an explicit saved choice suppresses later prompts.
  - Smoke plan: undetermined → in-app modal (tray / quit / Esc or backdrop dismiss); relaunch keeps choice; Settings flips tray↔quit without restart; active call survives hide-to-tray; tray Fechar still quits; browser Settings has no control.
  - Verify timeout fallback hides without saving when the renderer cannot respond in time; the next close asks again.
- [x] 3.2 Run `openspec validate close-button-behavior-preference --strict` and confirm it passes with no errors.
