# Design

## Context

See proposal.md - Why for the read-only investigation already done and its two open leads. Key facts established so far:
- `callView` (`frontend/src/voice/view.ts`) and `editing` (local signal in `Stage.tsx`) are independent, non-cyclic signals; `canEdit()`/`layoutClass` are plain functions, not `createEffect`/`createMemo`, so no circular reactive dependency was found between composition/edit state and `call.screen()`.
- No synchronous IPC (`ipcRenderer.sendSync`) exists anywhere in `frontend/electron` or `frontend/src`; the screen-share picker (`frontend/electron/main.ts:578-662`) is fully promise-based.
- `setScreen` (`frontend/src/voice/callSession.tsx:462-473`) has no concurrency guard, unlike the camera toggle's `cameraQueue` (`callSession.tsx:442-447`); no caller was found today that double-fires it, but it's a latent gap.
- `CompositionView.tsx` only renders camera tracks, never the screen-share track directly; whether a local screen-share `<video>`/track stays attached in a hidden `FloatingPlayer.tsx`/`CallElsewhere.tsx`/popout view while `SceneEditor` is mounted was not fully traced.

## Goals / Non-Goals

**Goals:**
- Reproduce the freeze with instrumentation that captures the actual blocking mechanism (a stuck call stack, a reflow storm, or a genuine infinite loop), rather than fixing a guessed cause.
- Once confirmed, fix the root cause with the narrowest change that restores responsiveness, and add the regression scenario above to prevent a silent recurrence.

**Non-Goals:**
- Any screen-share or composition-view redesign. This targets a specific freeze, not a broader refactor.
- Fixing the latent `setScreen` concurrency gap unless the reproduction confirms it's actually involved; if it's a latent-but-uninvolved gap, note it separately rather than bundling an unrelated fix into this change.

## Decisions

**Gate implementation on a confirmed reproduction with instrumentation, following the same feasibility-gate pattern used by `add-linux-screen-share-system-audio` for an unconfirmed mechanism.**

Static code review by a dedicated investigation pass did not find a smoking gun despite reasonably thorough coverage (reactive graph, IPC, known loops, recent git history). Guessing at a fix for a full-UI-freeze bug risks shipping a change that doesn't address the real cause while appearing to under light testing (the same failure mode already seen twice in this session's other changes — shipped-but-unverified assumptions). The next step is reproducing live with a DevTools Performance recording (or, if the renderer is fully frozen and DevTools itself becomes unresponsive, an Electron/V8 heap+CPU profile taken via `--inspect` before reproducing, or a forced minidump) to capture the actual stuck call stack.

**Priority order for the reproduction pass** — revised after both review passes (`review-architect.md`, `review-fullstack.md`, Dimension 3) independently verified the originally-listed priority 1 against the actual code and found it does not hold up:
1. **(Revised top priority) Check whether anything in the edit-scene entry path indirectly calls `setScreen` a second time while a prior call is in flight** (the unserialized `setScreenShareEnabled` gap). Both reviews flag this as more plausible than the original top candidate, partly because the same `call.setScreen(on).then(started => { if (on && started) setCallView("grid") })` logic exists duplicated in two independent call sites — `frontend/src/voice/Stage.tsx:64` and `frontend/src/voice/CallControls.tsx:132` — two distinct entry points for the same action increase the chance of an overlapping call somewhere not yet mapped.
2. **(Demoted, was priority 1) Check whether a local screen-share video/track element stays mounted** (in `FloatingPlayer.tsx`, `CallElsewhere.tsx`, or the popout) while `SceneEditor` renders, causing a layout thrash. Both reviews re-read these three files directly and found this does not hold: `FloatingPlayer.tsx` never references screen-share (only the camera icon state); `CallElsewhere.tsx` is a plain text-and-button banner with no video track; and the call popout (`CallPopoutWindow`) is confirmed (`frontend/electron/main.ts:757-770`, `contextIsolation: true`, its own route) to run in a separate Electron `BrowserWindow`/renderer process from the main window — a reflow or loop inside it structurally cannot freeze the main window's UI thread, which is where the freeze was reported. Keep this step in the plan only as a fallback if priority 1 and a reactive-effect check (below) are both ruled out, not as the first thing to chase.
3. Re-check for a reactive cycle (SolidJS effects triggered by `editing()` becoming `true` while a screen share is already active) only if 1 and 2 are both ruled out, since the initial pass already looked broadly and found no circular dependency — but a narrower check scoped specifically to this transition was not yet done.

## Risks / Trade-offs

- [The freeze may not reproduce reliably on a dev machine if it depends on timing, hardware (e.g. GPU-accelerated screen capture), or OS specifics the original report's machine has] → Capture the original user's OS/GPU/Electron version alongside the repro attempt; if it doesn't reproduce locally, ask the reporting user to capture a DevTools Performance recording or Electron crash/hang dump themselves next time it happens, rather than closing the investigation on a non-repro.
- [A full UI freeze may make DevTools itself unresponsive, preventing an in-the-moment Performance recording] → Start the Performance recording *before* triggering the repro steps, so capture doesn't depend on DevTools remaining interactive afterward; fall back to an external profiler/minidump only if that's insufficient.
- [No crash/hang reporting exists in the Electron client today (`review-fullstack.md`, Dimension 3) — if this freeze recurs for another user before a fix ships, the team has no automated signal and depends entirely on the user noticing and reporting it manually, exactly as happened here] → Out of scope for this change (adding crash/hang reporting is an infrastructure investment, not a targeted bug fix); noted here so it can be picked up as a separate change rather than forgotten.
- [The root cause gate (tasks 1.1-1.4) may take more than one cycle to confirm, leaving users exposed to a severe, restart-requiring freeze in the meantime] → Ship a low-risk temporary mitigation in parallel (see `tasks.md` 1.5): disable or warn on "Editar cena" while a local screen share is active, independent of and not blocking the root-cause investigation.
