# Tasks

## 1. Linux capture feasibility gate

- [ ] 1.1 On representative PipeWire X11 and Wayland hosts, identify the actual system-output monitor exposed to Electron's renderer and test audio capture with the share audio choice on. Verify: record host audio stack, monitor enumeration, permissions, capture result, and a reproducible runtime detection rule for each host.
- [ ] 1.2 Prototype publication of the captured monitor as a LiveKit screen-audio track while the existing Electron video share runs, without changing the backend. Verify: a remote client hears desktop audio, the microphone remains independent, and cancellation, stop, and monitor removal clean up both tracks.
- [ ] 1.3 Record a pass/fail checkpoint against D1. Verify: retain the measured host matrix and remote-client evidence; if either capture or publication fails, stop subsequent implementation tasks and revise this change's design/spec/tasks before selecting a native or helper route.

## 2. Conditional Linux implementation after gate passes

- [ ] 2.1 Add runtime detection and capture of the proven PipeWire output monitor only for selected Linux share audio, retaining the existing X11 and Wayland video picker flows. Verify: supported hosts attempt audio, unsupported hosts and unselected starts remain video-only, and existing Windows loopback behavior is unchanged.
- [ ] 2.2 Publish and tear down the Linux system-audio track with the owning screen share, and derive the active indicator from publication rather than selection. Verify: remote audibility, stop, cancellation, device loss, and no microphone interruption in targeted tests and a live call.
- [ ] 2.3 Add focused Linux setup/support documentation for the verified host matrix and whole-desktop audio scope. Verify: instructions reproduce the supported and fallback cases on the tested hosts.

## 3. Integration

- [ ] 3.1 Run the frontend build and live X11/Wayland screen-share matrix with supported and unsupported audio stacks. Verify: video-only fallback stays nonblocking, no track survives share stop, and the Linux AppImage can run the proven approach.
- [ ] 3.2 Run `openspec validate add-linux-screen-share-system-audio --strict`. Verify: validation succeeds after any review-driven artifact edits.
