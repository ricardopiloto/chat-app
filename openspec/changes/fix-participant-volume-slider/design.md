# Design

## Context

See proposal.md - Why. `applyVolumeForIdentity` (`frontend/src/voice/callSession.tsx:286-293`) iterates `audioHost.querySelectorAll("audio")` and only flips its `applied` accumulator to `false` on an explicit failed application; zero matching elements leaves it `true`. `setRemoteVolume` (`callSession.tsx:1254-1258`) and `applyStoredRemoteVolume` (`callSession.tsx:1260-1264`) both trust that return value. Live diagnostic confirmed the live `<audio>` element for a tested identity stayed at `.volume === 1` after setting the UI slider to 79%, with the same `data-track` SID before and after (ruling out track churn/resubscription as the cause) — i.e. the vacuous-success path, not a transient resubscribe race, is what's actually observed.

## Goals / Non-Goals

**Goals:**
- Make `applyVolumeForIdentity` correctly report failure when it applies to zero elements, so this class of bug cannot silently persist a volume change that never reached any audio element.
- Find and fix whatever currently prevents a match for the live element (the vacuous-success bug explains why no error surfaced, but something is still causing zero matches or the fix would show up as already-working for other reasons it isn't).
- Remove the oversized native tooltip on the volume control.
- Close the test-coverage gap `review-fullstack.md` identified: `frontend/scripts/verify-participant-volume.mjs` already exists for this capability but only covers the storage layer, never the functions with the actual bug — add a DOM-based regression test for `applyVolumeForIdentity`'s zero-match case in the same script/pattern, so this bug class has an automated check going forward instead of relying solely on manual two-client audio testing.

**Non-Goals:**
- Reworking the volume/boost architecture (the `<=100%` direct-`.volume` path and the `>100%` `AudioContext`/`GainNode` boost path) — both are structurally sound per the design already in `fix-call-controls-regressions-and-cleanup`; this change targets the matching bug, not the audio-graph design.

## Decisions

**Fix the accumulator logic first, then add temporary diagnostic logging in the same pass to pin the identity-matching root cause, rather than guessing at the root cause from static review alone.**

Static review did not turn up an obvious reason `el.dataset.identity === identity` would fail to match in `applyVolumeForIdentity` — `identity` is `props.person.id` (from `CallParticipant.id`, itself `p.identity` from the LiveKit participant object in `snapshot()`), and `attachAudio` (`callSession.tsx:300-308`) sets `el.dataset.identity = identity` from the same `participant.identity` field on `TrackSubscribed`. Both reads trace back to the same LiveKit `Participant.identity` string, so a plain string-equality bug isn't visible from source alone. Rather than speculate further, add a `console.warn` (temporary, or permanent if it proves generally useful for catching this class of bug) whenever `applyVolumeForIdentity` finds zero elements for a non-empty identity, capturing the identity it searched for and the set of identities actually present on `audioHost`'s children. That turns the next repro into a direct comparison instead of another round of manual diagnostics.

**Drop the `title` attribute rather than shortening it.**

The hint text ("Local volume for this person only (0–200%). 100% is unchanged. Does not change what others hear.") is useful disclosure the first time someone sees the control, but the control's icon (`volume_up`), native range slider, and live percentage readout are self-explanatory on sight, matching how no other call-control button (mic, camera, deafen) carries a `title` tooltip either. The existing `aria-label` already carries equivalent meaning for assistive technology, so nothing is lost for accessibility.

## Risks / Trade-offs

- [Fixing only the accumulator without finding the real matching bug would make failures loud (console warnings) but still leave the slider non-functional] → Task order requires confirming the fix with the same live two-client audio test used to diagnose the bug (hear the volume change), not just confirming the warning stops firing.
- [Temporary diagnostic logging left in shipped code adds console noise] → Keep it gated to the zero-match failure case only (which should never happen once fixed), not every successful application, so it is silent in the normal case and only speaks up if the bug (or a regression of it) recurs.
