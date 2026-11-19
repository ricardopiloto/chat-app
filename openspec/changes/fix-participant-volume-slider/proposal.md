# Proposal

## Why

The per-participant volume slider (`frontend-v2/voice-participant-volume`, specifically its "Per-participant volume control" requirement) already specifies correct behavior — adjusting a remote participant's slider should change what that person locally hears, from 0% to 200%. Live testing on a real two-person call shows it does nothing audible at any setting, not just above 100%: `applyVolumeForIdentity` in `frontend/src/voice/callSession.tsx:286-293` has a logic defect that reports success even when it finds no matching audio element to apply volume to:

```js
function applyVolumeForIdentity(identity: string, percent: number): boolean {
  let applied = true;
  audioHost.querySelectorAll("audio").forEach((node) => {
    const el = node as HTMLMediaElement;
    if (el.dataset.identity === identity && !applyElementVolume(el, percent)) applied = false;
  });
  return applied;
}
```

`applied` starts `true` and only flips to `false` on an explicit failed application; if the loop finds zero elements whose `dataset.identity` matches, the function still returns `true`. `setRemoteVolume` (`callSession.tsx:1254-1258`) treats that as success and persists the chosen percentage, so the UI shows the new value while no `<audio>` element was ever touched — confirmed live: the slider's label stayed at a user-set 79% with the same track SID before and after, while `document.querySelectorAll("audio")` showed that element's `.volume` still at `1`. Separately, the slider's native `title` attribute (`frontend/src/voice/tiles.tsx:191`) is a full sentence ("Local volume for this person only (0–200%)...), which renders as an oversized native browser tooltip on hover for what is otherwise a self-explanatory icon+slider+percentage control.

This is a bug-fix restoring already-specified behavior and a minor UI cleanup; no spec-level requirement is changing, so this change sets `skip_specs: true`.

## What Changes

- Fix `applyVolumeForIdentity` so it only reports success when it actually applied the volume to at least one matching audio element, surfacing (at minimum, via a dev warning) the case where no element matches an identity that is supposed to have live audio, so this class of silent-failure is easier to catch going forward.
- Investigate and fix why the live audio element for the identity under test does not match in practice (confirm whether it's purely the always-true logic bug, or whether there's also a genuine identity/handle mismatch at the point the slider's `onInput` fires) — add temporary debug logging if needed to confirm before finalizing the fix.
- Remove the `title` attribute from the volume `<label>` in `tiles.tsx:189-194`, keeping only the existing `aria-label` for accessibility.

## Capabilities

(No capabilities listed — `skip_specs: true`. The existing `frontend-v2/voice-participant-volume` spec already correctly requires this behavior; this change fixes the implementation to match it, with no change to what the system is specified to do.)

## Impact

- `frontend/src/voice/callSession.tsx` (`applyVolumeForIdentity`, and whichever upstream cause is confirmed during investigation — e.g. `attachAudio`, `handlesByIdentity` population, or `setRemoteVolume`/`applyStoredRemoteVolume`).
- `frontend/src/voice/tiles.tsx` (`ParticipantVolumeControl`'s `title` attribute).
- No backend, API, or protocol change.
