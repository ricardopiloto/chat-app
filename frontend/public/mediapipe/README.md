# MediaPipe assets (camera background blur)

Served from the same origin as the SPA. **Do not** load models from Google/jsDelivr at call time.

| Path | Role |
|------|------|
| `wasm/vision_wasm_internal.js` + `.wasm` | MediaPipe Tasks Vision (SIMD) |
| `wasm/vision_wasm_nosimd_internal.js` + `.wasm` | Fallback without SIMD |
| `selfie_segmenter.tflite` | Selfie Image Segmenter (float16) |

`wasm/` is copied from `node_modules/@mediapipe/tasks-vision/wasm/` by `scripts/vendor-mediapipe.sh` (also `npm postinstall`). The `.tflite` is kept in git (~244 KiB).

Runtime URLs used by `frontend/src/video/backgroundBlur.ts`:

- `/mediapipe/wasm`
- `/mediapipe/selfie_segmenter.tflite`
