# Tasks

## 1. Toolchain and addon scaffold

- [ ] 1.1 Document and verify the new Linux build-time toolchain requirement (Rust/`cargo`, `napi-rs` CLI, `pipewire-devel` — not installed on this project's own dev machine today per `design.md` Context) and add a minimal `napi-rs` addon skeleton with no PipeWire logic yet. Verify: a new build script compiles the skeleton addon, and a one-line main-process smoke script loads it inside Electron (not plain Node) without crashing.
- [ ] 1.2 Decide and document the compiled addon's output location and how it's kept out of/handled by version control. Verify: a clean build reliably produces the compiled `.node` binary at the documented path.

## 2. Native PipeWire capture (main process)

- [ ] 2.1 Using `pipewire-rs`, implement whole-desktop monitor enumeration and a Capture-role stream (`STREAM_CAPTURE_SINK` on the default sink's monitor) yielding raw PCM frames via a callback into the addon's JS-facing API. Load PipeWire as a soft runtime dependency (D2): a host without a usable session returns a clear "unavailable" result instead of throwing or crashing anything. Verify: a standalone main-process script run inside Electron starts capture on this project's dev host and logs received frame sizes/rates for several seconds, then stops cleanly.
- [ ] 2.2 Implement stop/cleanup of the native capture stream. Verify: 10 consecutive start/stop cycles in the same process show no growth in open PipeWire objects/threads or memory.

## 3. IPC bridge and renderer audio graph

- [ ] 3.1 Expose a main↔renderer channel using `ipcRenderer.postMessage`/`MessagePort` with transferable `ArrayBuffer`s (not the plain `ipcRenderer.send`/`.invoke` structured-clone pattern `frontend/electron/preload.ts`'s existing channels use, which isn't suited to continuous high-frequency binary data) that streams captured PCM frames from 2.1, with explicit start/stop control initiated from the renderer. Verify: a smoke test transfers a sequence of buffers end-to-end without copy-related errors and confirms the renderer receives them in order.
- [ ] 3.2 In the renderer, implement an `AudioWorkletNode`-based consumer that reads frames from the IPC-fed port and writes them into a `MediaStreamAudioDestinationNode`, producing a `MediaStreamTrack`. Verify: a standalone prototype (not yet wired into `callSession.tsx`) requests capture start and plays the resulting track back audibly (e.g. routed to an `<audio>` element) from a real desktop audio source.
- [ ] 3.3 **Gate (D4):** confirm the prototype's audible output is low-glitch end-to-end on a live call test, not just that frames arrive. If latency/glitching is unacceptable, stop here and revise the buffering/transport approach per `design.md` D4 before proceeding to section 4.

## 4. Integration into the screen-share flow

- [ ] 4.1 Wire capture start/stop into `frontend/electron/main.ts`'s `fulfillScreenShare` and `frontend/src/voice/callSession.tsx`'s existing screen-share audio lifecycle, mirroring the Windows `audio: "loopback"` path, so selecting audio on Linux with a working addon captures and publishes the synthesized track alongside the screen video, and stopping the share tears down capture, IPC, and the Web Audio graph. Verify: the new `frontend-v2/voice-session` scenarios ("Linux native capture is available" / "...is unavailable or fails") pass manually on a live call with a second participant confirming audibility.
- [ ] 4.2 Confirm the existing Windows loopback and macOS paths are unaffected, and existing screen-share-without-audio and start/stop scenarios still pass. Verify: manually re-check those scenarios on Windows or macOS if available, and on Linux with audio left unselected.

## 5. Packaging and documentation

- [ ] 5.1 Wire the compiled native addon into `frontend/electron-builder.yml`'s Linux AppImage packaging (e.g. `asarUnpack`, matching the existing `electron/icons/**` pattern) so the shipped AppImage includes the addon binary for its current single target architecture. Verify: a built AppImage launches and a live screen share with audio selected works on a clean Linux host outside the dev environment, falling back to video-only when PipeWire isn't present.
- [ ] 5.2 Update `.github/workflows/desktop-release.yml`'s `linux` job to install `libpipewire-0.3-dev` (apt) and ensure a working Rust toolchain before the build/package steps — this is the actual pipeline that produces the AppImage attached to real releases, confirmed in both reviews; a local build alone does not ship this feature. Verify: a `workflow_dispatch` run of that workflow succeeds and its uploaded `parley-linux` artifact contains the addon binary.
- [ ] 5.3 Document the new build-time requirements (Rust toolchain, `pipewire-devel`) and the supported/fallback host behavior in the project's build docs (e.g. `docs/desktop-release.md`). Verify: following the documented steps from a clean checkout produces a working build.

## 6. Validation

- [ ] 6.1 Run `openspec validate add-linux-screen-share-native-audio-capture --strict` and verify it passes.
