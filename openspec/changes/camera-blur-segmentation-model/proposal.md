# Proposal

## Why

Background blur and virtual background both resolve to the stock MediaPipe segmentation model shipped by `@livekit/track-processors`'s default configuration — `selfie_segmenter.tflite`, fetched live from `storage.googleapis.com` at runtime. This has two concrete problems: (1) that model is the square/portrait-oriented general-purpose variant, even though camera video is landscape-oriented, so segmentation accuracy is lower than it could be for this exact use case; (2) fetching the model from Google's CDN at runtime is an external, outbound-internet dependency that contradicts the product's self-hosted philosophy and would fail in network-restricted self-hosted deployments.

## What Changes

- Switch background blur and virtual background to the `selfie_segmenter_landscape` MediaPipe model — officially published by Google specifically "optimized for landscape aspect ratios (e.g., video calls)" — via the `assetPaths.modelAssetPath` option already supported by `@livekit/track-processors`, instead of the square `selfie_segmenter` default. No new dependency is required.
- Vendor the chosen model asset as a static file served by the app itself, under `frontend/public/`, following the same pattern already used for the `dice-box-threejs` vendored assets, instead of fetching it from Google's CDN at runtime.
- No change to the GPU delegate (stays CPU-only, per the existing exclusion already decided in `frontend-v2/audio-video-settings`), no change to the two existing blur-strength presets (light/strong), and no change to the MediaPipe WASM runtime fileset (`tasksVisionFileSet`, loaded from jsdelivr), which is a separate, generic runtime concern kept out of scope for this change.

## Capabilities

### Modified Capabilities

- `frontend-v2/audio-video-settings`: adds a new requirement about the segmentation model used for background blur and virtual background being self-hosted and tuned for landscape camera video, alongside the existing device-selection and blur-level requirements already in that capability.

## Impact

- `frontend/src/voice/callSession.tsx` (around line 231, `processors.BackgroundProcessor(options)` call) — add `assetPaths`.
- `frontend/src/voice/preview.ts` (around line 148, `processors.BackgroundProcessor(options)` call) — add `assetPaths`.
- `frontend/src/voice/devices.ts` — new shared constant for the asset path, imported by both files above, instead of duplicating it a second time (the existing `BLUR_RADIUS` constant is already duplicated between `callSession.tsx` and `preview.ts`; this change should not repeat that pattern for a second constant).
- `frontend/public/` — new vendored model asset file.
- No backend/API impact.
