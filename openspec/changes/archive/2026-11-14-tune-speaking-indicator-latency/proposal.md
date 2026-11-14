# Proposal

## Why

The tile's speaking indicator perceptibly trails live speech. Parley currently forwards LiveKit's `ActiveSpeakersChanged` directly (`frontend/src/voice/callSession.tsx:644`), and `infra/livekit.yaml:1-16` contains no audio detection configuration.

## What Changes

- Tune LiveKit's documented `audio.update_interval` and `audio.smooth_intervals` in `infra/livekit.yaml` for faster speaker updates, while keeping `active_level` and `min_percentile` at their defaults initially.
- Measure speaking onset and release with a real two-client call and adjust the values if the proposed starting point is too jumpy.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: real-time speaking indicators respond promptly to speech while remaining stable between syllables.

## Impact

- `infra/livekit.yaml` and deployment verification; no initial frontend change. The server image is pinned at `livekit/livekit-server:v1.13.5` in `infra/docker-compose.yml:3`.
