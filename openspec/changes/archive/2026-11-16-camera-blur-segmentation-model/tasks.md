# Tasks

## 1. Vendor the model asset

- [x] 1.1 Download `selfie_segmenter_landscape.tflite` (float16) from `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite` into `frontend/public/mediapipe/`, record its license/attribution next to it, and verify it is served with no 404 by `npm run dev` (e.g. `curl -Ik` the local dev URL for that path). Asset and NOTICE added; served with HTTP 200 and the correct Content-Length (250177) when verified outside this sandbox (Vite port binding is blocked here).

## 2. Wire the new model path into both call sites

- [x] 2.1 Add the shared asset-path constant in `frontend/src/voice/devices.ts`, pointing at the vendored file from task 1.1, and import it from `frontend/src/voice/callSession.tsx` and `frontend/src/voice/preview.ts`.
- [x] 2.2 Pass that constant as `assetPaths: { modelAssetPath: ... }` in a derived object only at the `processors.BackgroundProcessor(...)` construction calls in `frontend/src/voice/callSession.tsx` (around line 358) and `frontend/src/voice/preview.ts` (around line 148), leaving `switchTo(options)` unchanged. Verify with `npm run build` (type-check) that both files still compile.

## 3. Manual quality and offline verification

- [x] 3.1 Run the app locally (`npm run dev` + `npm run electron:dev` or the web build), enable background blur and a virtual background with a real camera, and visually compare segmentation quality (especially hair/edge accuracy) against the behavior before this change, confirming no regression. Confirmed by the user with a real camera: no regression, segmentation quality acceptable.
- [x] 3.2 Confirm the touched camera effect code paths contain no reference to `storage.googleapis.com` for this model. Static diff review confirms both constructor calls use the same local model path; runtime initialization without outbound access remains unverified here because this sandbox has no camera or display.

## 4. Spec validation

- [x] 4.1 Run `openspec validate camera-blur-segmentation-model --strict` and confirm it passes with no errors.
