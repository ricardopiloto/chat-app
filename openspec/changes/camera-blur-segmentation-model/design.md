# Design

## Context

Background blur and virtual background share one code path: both call `processors.BackgroundProcessor(options)` from `@livekit/track-processors` (`frontend/src/voice/callSession.tsx:231` for the live call, `frontend/src/voice/preview.ts:148` for the green-room preview; `switchTo()` is used afterward on an already-constructed processor at `callSession.tsx:229` and `preview.ts:113` and does not accept `assetPaths`, so the asset configuration must be set at construction time). Neither call site passes `assetPaths` or `segmenterOptions` today, so both fall back to the package's hardcoded defaults, confirmed by reading the compiled package (`node_modules/@livekit/track-processors/dist/index.js`):

- `modelAssetPath` defaults to `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite` — the square (256x256), general-purpose selfie segmentation model.
- `tasksVisionFileSet` (the MediaPipe WASM runtime) defaults to `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@<version>/wasm`.

Per Google's own MediaPipe Image Segmenter documentation, a second selfie segmentation model exists, `selfie_segmenter_landscape.tflite` (144x256, float16), explicitly described as optimized for landscape aspect ratios such as video calls — the exact shape of webcam video this app processes. Its output is binary (background/person), the same shape the current code already consumes, so no handling-logic change is needed beyond pointing at the new asset.

`frontend/public/` already vendors a third-party static asset tree this same way (`frontend/public/dice-box-threejs/`, ~2.9MB total today for all of `public/`), so serving a MediaPipe model from the app's own origin instead of fetching it from Google has a direct precedent in this codebase.

The existing exclusion of GPU acceleration from scope (`frontend-v2/audio-video-settings` spec, "Definições fiéis ao subconjunto do mockup" requirement) is unaffected: this change does not touch the `delegate` option, so segmentation stays on CPU exactly as today.

## Goals / Non-Goals

**Goals:**
- Use the MediaPipe segmentation model variant purpose-built for landscape video instead of the square default, improving segmentation accuracy for webcam footage.
- Serve that model asset from the instance's own origin instead of fetching it from Google's CDN at runtime, removing an external runtime dependency and aligning with the self-hosted deployment model.

**Non-Goals:**
- No change to the GPU/CPU delegate — stays CPU-only.
- No change to the two existing blur-strength presets (light/strong) or to the UI for choosing them.
- No change to the MediaPipe WASM runtime fileset (`tasksVisionFileSet`) — still loaded from jsdelivr; vendoring it is a separate, larger concern (a generic multi-feature runtime, not specific to this model swap) and is a possible follow-up change, not part of this one.
- No switch to the multiclass segmentation model (`selfie_multiclass_256x256`) — considered and rejected for this change (see D1).

## Decisions

### D1. Use `selfie_segmenter_landscape`, not `selfie_multiclass_256x256`
`selfie_segmenter_landscape` keeps the same binary (background/person) output the current code already handles, is float16 (smaller/faster than float32), and is explicitly published by Google for this exact use case (landscape video calls). `selfie_multiclass_256x256` offers finer category separation (hair, skin, clothes) that could improve edge quality further, but is float32/unquantized (larger, more compute) and would need new mask-handling logic for its multiclass output. Rejected for this change as a larger, riskier swap; left as a possible future follow-up once the landscape-model swap has been validated in practice.

### D2. Vendor the model file under `frontend/public/mediapipe/`
`assetPaths.modelAssetPath` is set to an app-relative path (e.g. `/mediapipe/selfie_segmenter_landscape.tflite`) served from `frontend/public/mediapipe/`, matching the existing `frontend/public/dice-box-threejs/` vendoring pattern — served from the SPA's own origin in the web build and bundled with the app's static resources in the Electron build, with no new build-tooling needed since `public/` is already copied as-is by Vite. The WASM `tasksVisionFileSet` is left pointed at jsdelivr (see Non-Goals) — vendoring it is a separate, larger, cross-cutting concern.

### D3. One shared constant instead of a second duplicated one
`BLUR_RADIUS` is already duplicated between `callSession.tsx` and `preview.ts`. Rather than repeating that duplication for the new `assetPaths` value, define it once in `frontend/src/voice/devices.ts` (where `BlurLevel`/`CameraEffect` already live) and import it from both call sites.

## Risks / Trade-offs

- [License/attribution for the vendored model file is not yet confirmed in writing] → Confirm the exact license MediaPipe publishes selfie segmentation models under and record it (e.g. a short NOTICE comment next to the vendored file) before shipping, the same way any other vendored third-party asset in this repo should be attributed.
- [Model file adds to the app's static asset footprint] → Both selfie_segmenter variants are small (sub-megabyte, float16); measure the exact file size against the current ~2.9MB `public/` footprint when vendoring it, to confirm it is not a meaningful regression.
- [Whether the landscape model is actually visually better for real webcam footage needs a live check, not just reading documentation] → Requires a manual side-by-side comparison (old vs. new model, same camera, same lighting) before considering this done; included explicitly as a task rather than assumed.
