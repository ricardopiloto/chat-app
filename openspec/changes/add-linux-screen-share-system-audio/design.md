# Design

## Context

`frontend/electron/main.ts:615` supplies `audio: "loopback"` only when `request.audioRequested && process.platform === "win32"`. Its video path uses `desktopCapturer.getSources({ types: ["screen", "window"] })`; on Wayland the portal supplies the picker and usually one source, while X11 uses the app picker. `frontend/package.json` requests Electron `^38.1.0`; `frontend/package-lock.json` and the installed package resolve to 38.8.6. The installed `electron.d.ts` defines `Streams.audio` as `loopback`, `loopbackWithMute`, or `WebFrameMain`, and says loopback is supported only on Windows. The frame option captures an Electron page, not host system output. `desktopCapturer` has no audio source option. Electron's API documentation confirms the Windows limitation: https://www.electronjs.org/docs/latest/api/session/ .

The published ScreenCast portal interface version 6 does **not** define an audio flag for `SelectSources`. Its `types` are MONITOR, WINDOW and VIRTUAL video source types; `persist_mode` controls permission persistence. `Start` returns screen streams, not a documented system-audio stream. See https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.ScreenCast.html . Therefore requesting portal audio alongside video through current Electron APIs is not an available implementation. PipeWire can expose system output monitors through host audio services, but availability to Chromium and safe publication have not been demonstrated in this app.

The earlier change's D1 accepts whole-desktop system audio even when video is a window. Its spec delta is still in `openspec/changes/add-screen-share-audio-and-popout-controls/specs/frontend-v2/voice-session/spec.md`; this change modifies that requirement. The current main spec has not yet incorporated it.

`frontend/electron-builder.yml` ships Linux as AppImage. Frontend build uses TypeScript, Vite, and electron-builder with no current app-owned native addon or `libpipewire` build path.

## Goals / Non-Goals

**Goals:** establish a Linux system-output capture route that produces a LiveKit audio publication during screen share; retain the current video selection on X11 and Wayland; preserve video-only fallback and accurate audio-active state.

**Non-Goals:** per-window audio isolation, replacing the video picker, changing browser screen sharing, or changing the LiveKit/backend protocol.

## Decisions

### D1. Gate implementation on a real end-to-end capture spike

First test whether PipeWire's system-output monitor can be enumerated and acquired as a Chromium/Electron audio input on representative X11 and Wayland PipeWire hosts, then published as a distinct LiveKit screen-audio track without disturbing microphone capture. Verify stop, cancellation, and device removal. This is the preferred route because it avoids native code and helper process transport. The gate passes only with an audible remote-client result, track lifecycle evidence, and a documented detection rule. If it fails, stop implementation under this proposal and revise its design/spec/tasks from the evidence before choosing a different route. An API type check or an observed monitor name alone is insufficient.

*Alternative rejected for immediate implementation:* pass `audio: "loopback"` on Linux or add an assumed ScreenCast `SelectSources` audio option. Neither is supported by the installed Electron contract or documented portal interface.

### D2. Publish a proven monitor track alongside existing video

If D1 passes, obtain the selected host output monitor through the renderer's media-device capture, publish it as the screen-share audio track in the owning LiveKit session, and bind its teardown to screen-share stop. Request the monitor only when the audio choice is on. Keep `fulfillScreenShare`'s video source selection and Windows loopback handling intact. Detect the monitor at runtime rather than inferring support from X11/Wayland or a PipeWire version. Show audio active only after LiveKit confirms publication. When capture or publication fails, continue video-only without a blocking error. System audio remains whole-desktop regardless of the selected video source.

*Alternative rejected:* spawn `pw-record` or another CLI and bridge its PCM output into a browser track. It depends on host tools and introduces a fragile local transport, clocking, and cleanup path. A native PipeWire addon is a fallback candidate only after D1 fails and a new design review establishes its packaging and publication route.

### D3. Native fallback requires a separate build decision

Do not add a native dependency in this change's initial implementation. If D1 fails, evaluate an addon separately, including `libpipewire` development headers, Electron ABI rebuilds, architecture coverage, AppImage library/runtime compatibility, and Linux CI toolchain. A native capture result still needs a concrete conversion to a `MediaStreamTrack` or equivalent LiveKit-publishable source; successful PCM capture alone does not satisfy the gate. This is the first app-owned native frontend dependency and a meaningful packaging change, so no addon is authorized by an unproven assumption.

## Risks / Trade-offs

- [PipeWire monitor devices may be absent or hidden from Chromium, especially with different portal/audio backend setups] → D1 tests actual capture on X11 and Wayland and records a runtime detection rule; unsupported hosts retain video-only sharing.
- [A separate audio track may duplicate microphone or feed remote audio back into the call] → test remote audibility, echo behavior, track naming, and teardown in the spike before implementation.
- [The portal may not expose audio even on a modern compositor] → do not use portal version, `types`, or `persist_mode` as an audio-support proxy; test output capture independently.
- [A native fallback would require the first native dependency and cross-architecture AppImage/CI support] → require a separate reviewed design with a compile and packaging proof before adding one.
- [The upstream audio requirement has not yet been synced into the main capability spec] → reconcile the pending change before archiving this delta; preserve the complete requirement block here.
