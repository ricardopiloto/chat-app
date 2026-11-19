# Proposal

## Why

A user reported that while screen-sharing, switching the voice call view to "Composição" and then clicking "Editar cena" freezes the entire renderer UI: clicks and keyboard input stop working, but audio keeps playing and realtime presence/speaking indicators (in the channel sidebar) keep updating — meaning the WebSocket/media pipeline is unaffected while the main UI thread is stuck. The user had to force-restart the app to recover. This is a severe reliability bug (full app hang, not a crash with an error boundary) with no safe way out for the user short of restarting.

A first read-only investigation (file/code review of `Stage.tsx`, `CompositionView.tsx`, `SceneEditor.tsx`, `view.ts`, `sceneStore.ts`, `people.ts`, and the Electron screen-share IPC path) found no confirmed smoking gun: no circular Solid.js reactive dependency between `callView()`, `editing()`, and `call.screen()`; no synchronous IPC (`ipcRenderer.sendSync`) that could block the main thread; no obvious infinite loop in the composition/scene-editor code itself. It surfaced two gaps worth checking next: (1) whether the local screen-share `<video>`/track stays attached in a hidden view (`FloatingPlayer.tsx`, `CallElsewhere.tsx`, or the popout window) while the scene editor is open, interacting with `voice.css` layout rules for `.call-editor`/`.call-composition` in a way that could cause a reflow storm; and (2) that `setScreen` (`callSession.tsx:462-473`) has no concurrency guard, unlike the camera toggle's `cameraQueue` (`callSession.tsx:442-447`), which could let overlapping `setScreenShareEnabled` calls run unserialized if anything triggers a second screen-share call while one is in flight.

Given the severity and the lack of a confirmed mechanism from static review, this change starts with a reproduction-and-instrumentation gate rather than committing to a fix.

## What Changes

- Reproduce the freeze deliberately (screen-share active, switch to Composição, click "Editar cena") while capturing a renderer profile/stack (e.g. DevTools Performance recording or a forced crash dump of the stuck process) to identify the actual blocking call or loop.
- Based on the confirmed mechanism, fix the root cause — scope to be refined once the gate passes; do not guess at a fix before reproducing with instrumentation.
- Add an explicit reliability requirement to `frontend-v2/voice-composition` that entering scene-edit mode while a screen share is active must not freeze the UI, so this combination has a standing, testable contract going forward.

## Capabilities

### Modified Capabilities
- `frontend-v2/voice-composition`: the scene editor must remain responsive when entered while a screen share is active, instead of this combination being unspecified and currently freezing the renderer.

## Impact

- Likely `frontend/src/voice/Stage.tsx`, `frontend/src/voice/CompositionView.tsx`, `frontend/src/voice/SceneEditor.tsx`, `frontend/src/voice/callSession.tsx` (`setScreen` concurrency), and possibly `frontend/src/voice/FloatingPlayer.tsx` / `CallElsewhere.tsx` / `CallPopoutWindow.tsx` and `frontend/src/voice.css`, pending the reproduction findings.
- No backend or protocol change expected; this is a renderer-side reliability bug.
