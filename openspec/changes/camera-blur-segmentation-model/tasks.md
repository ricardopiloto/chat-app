# Tasks

## 1. Vendor the model asset

- [ ] 1.1 Download `selfie_segmenter_landscape.tflite` (float16) from `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite` into `frontend/public/mediapipe/`, record its license/attribution next to it, and verify it is served with no 404 by `npm run dev` (e.g. `curl -I` the local dev URL for that path).

## 2. Wire the new model path into both call sites

- [ ] 2.1 Add the shared asset-path constant in `frontend/src/voice/devices.ts`, pointing at the vendored file from task 1.1, and import it from `frontend/src/voice/callSession.tsx` and `frontend/src/voice/preview.ts`.
- [ ] 2.2 Pass that constant as `assetPaths: { modelAssetPath: ... }` into the `processors.BackgroundProcessor(options)` call in `frontend/src/voice/callSession.tsx` (around line 231) and `frontend/src/voice/preview.ts` (around line 148). Verify with `npm run build` (type-check) that both files still compile.

## 3. Manual quality and offline verification

- [ ] 3.1 Run the app locally (`npm run dev` + `npm run electron:dev` or the web build), enable background blur and a virtual background with a real camera, and visually compare segmentation quality (especially hair/edge accuracy) against the behavior before this change, confirming no regression.
- [ ] 3.2 Simulate no outbound access to third-party hosts (e.g. block `storage.googleapis.com` and `cdn.jsdelivr.net` in browser devtools network conditions, or via `/etc/hosts`) and confirm background blur and virtual background still initialize successfully, since the model asset now loads from the instance's own origin.

## 4. Spec validation

- [ ] 4.1 Run `openspec validate camera-blur-segmentation-model --strict` and confirm it passes with no errors.
