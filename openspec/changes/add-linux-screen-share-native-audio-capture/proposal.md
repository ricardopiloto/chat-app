# Proposal

## Why

`add-linux-screen-share-system-audio` proved, with a live gate on a representative Wayland/PipeWire host, that no Electron/Chromium API route can capture Linux system audio during screen share: `getDisplayMedia({video, audio:true})` returns zero audio tracks with no error, and Chromium's own native picker UI restricts "share audio" to Chrome Tab only on Linux — an engine-level limitation, not a portal-version or compositor quirk. Discord's Linux client ships whole-desktop system audio during screen share in production today by bypassing this limitation entirely: it captures system audio directly against PipeWire through its own native integration, not through Electron/Chromium's screen-share APIs. A native PipeWire addon is therefore the only remaining viable route to deliver the same capability here.

## What Changes

- Add a native Node addon (N-API, built against the project's installed Electron ABI) that opens a PipeWire connection, enumerates the whole-desktop system-output stream, and captures it as PCM.
- Convert that PCM capture into a `MediaStreamTrack` (or an equivalent LiveKit-publishable source) and wire it into the existing screen-share lifecycle in `frontend/src/voice/callSession.tsx` and `frontend/electron/main.ts`, publishing and tearing it down alongside the screen-share video track the same way the existing Windows `audio: "loopback"` path already does.
- Add the Electron ABI rebuild tooling (e.g. `prebuildify`/`node-gyp` with Electron's `--runtime=electron` target) needed to produce a usable native binary for the project's installed Electron version.
- Extend `frontend/electron-builder.yml`'s Linux AppImage packaging so the addon (and any `libpipewire` runtime dependency it needs) ships correctly for the architecture(s) the AppImage already targets.
- Keep the existing whole-desktop audio scope (not per-window/per-app) and the existing video source picker (screen or window) untouched — this only adds the audio leg, exactly matching the capability `add-screen-share-audio-and-popout-controls` already proposed for all platforms.
- Preserve silent video-only fallback when the addon is unavailable, fails to build for a given platform/architecture, or fails to capture at runtime — screen sharing SHALL NOT break or block on this.
- **Out of scope**: X11 (no support planned for now except via an eventual X11 bridge/XWayland — not part of this change), and per-window/per-app audio isolation (not even Discord ships this yet; it requires a portal extension that doesn't exist).

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: strengthens the "Optional audio with screen sharing" requirement (proposed by `add-screen-share-audio-and-popout-controls`, not yet synced into the main spec) with a real Linux capture route via a native PipeWire addon, replacing the investigation-only language left by the now-closed `add-linux-screen-share-system-audio`.

## Impact

- New: a native Node addon package/build step under `frontend/` (exact location decided in `design.md`), linked against `libpipewire`.
- Modified: `frontend/electron/main.ts` (screen-share fulfillment), `frontend/src/voice/callSession.tsx` (audio track publish/teardown), `frontend/electron-builder.yml` (Linux packaging), `frontend/package.json` (new native build script/dependency).
- This is the project's first native frontend dependency: it introduces an Electron-ABI-specific build step and a runtime library dependency (`libpipewire`) that the current Linux AppImage build does not have today.
- No backend or LiveKit protocol change.
