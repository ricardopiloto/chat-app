# Tasks

## 1. Fix the vacuous-success bug and diagnose the real mismatch

- [ ] 1.1 Fix `applyVolumeForIdentity` in `frontend/src/voice/callSession.tsx:286-293` so it only returns `true` when it actually applied the volume to at least one matching audio element, returning `false` (or a distinct "no element found" signal) when zero elements match a non-empty identity. Verify: a unit/manual test with zero matching elements returns false instead of the current vacuous true.
- [ ] 1.2 Add a `console.warn` (or equivalent dev-only log) in the zero-match branch, logging the searched identity and the `data-identity` values actually present on `audioHost`'s audio elements. Reproduce the original bug on a real two-client call, capture the log output, and confirm whether it's a pure logic-accumulator issue or a genuine identity/handle mismatch at the point `setRemoteVolume`/`attachAudio` run. Verify: the log output during repro either shows a mismatched identity (confirming a real mismatch to fix) or shows a correct match that still failed to apply (pointing back to `applyElementVolume` itself).
- [ ] 1.3 Based on 1.2's finding, fix the actual root cause (the identity/handle mismatch if one is found, or confirm `applyElementVolume` itself already works correctly once reached). Verify: on a real two-client call, dragging the slider to 0%, 50%, 100%, and 150-200% for one remote participant produces an audible change for that participant only, and `document.querySelectorAll("audio")`-style inspection shows the targeted element's `.volume`/gain matching the chosen percentage.
- [ ] 1.4 Extend the project's automated coverage for this area: `frontend/scripts/verify-participant-volume.mjs` (run via `npm run verify:participant-volume`) currently only tests the storage layer (`participantVolume.ts`) and never touches `applyVolumeForIdentity`, so the bug fixed in 1.1 had no regression test. Add a test (in that script, or a new focused `verify-*` script in the same esbuild-based pattern) that constructs a minimal DOM with fake `<audio>` elements carrying controlled `data-identity` values and asserts `applyVolumeForIdentity` returns `false` when zero elements match a non-empty identity, and `true` with the volume actually set when one does. Verify: the new test fails against the pre-1.1 code and passes after it; `npm run verify:participant-volume` (or the new script) runs cleanly.

## 2. Remove the oversized tooltip

- [ ] 2.1 Remove the `title={t("call.volume.hint")}` attribute from the `<label class="call-volume">` in `frontend/src/voice/tiles.tsx:189-194`, keeping the existing `aria-label` on the `<input>` unchanged. Verify: hovering the control no longer shows a native tooltip; a screen reader still announces the control via `aria-label`.

## 3. Regression check

- [ ] 3.1 Confirm the existing `frontend-v2/voice-participant-volume` scenarios still hold after the fix: no control on the local tile, preference persists by handle across rejoin on the same device, preference does not follow to another device, and output-device routing for boosted participants degrades gracefully where unsupported. Verify: manually re-check each scenario on a real two-client call.
