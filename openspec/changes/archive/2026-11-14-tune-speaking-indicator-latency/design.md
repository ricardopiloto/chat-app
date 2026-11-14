# Design

## Context

`callSession.tsx:644` sets `speaking` only from LiveKit `ActiveSpeakersChanged`; `tiles.tsx:61-84` renders the border/chip from that signal. There is no app-level smoothing path. The deployed config (`infra/livekit.yaml`) has only network/TURN settings. LiveKit's own [sample config](https://github.com/livekit/livekit/blob/master/config-sample.yaml) documents `audio.update_interval` (default 500 ms) and `audio.smooth_intervals` (sample 4), plus `audio.active_level` and `audio.min_percentile`. The sample is current upstream; implementation should confirm these keys against the pinned v1.13.5 server image before deployment.

## Goals / Non-Goals

**Goals:** reduce perceptible onset delay; keep speaking indication consistent across grid, stage, and roster; avoid rapid flicker.

**Non-Goals:** infer speaking from the remote audio waveform in the browser; change audio transport latency; promise exact synchronization under network jitter.

## Decisions

### D1. Tune the SFU's audio notification cadence first

Set `audio.update_interval: 200` ms and `audio.smooth_intervals: 2` as an initial profile in `infra/livekit.yaml`, verify accepted config keys against the pinned image, then compare median onset and flicker to the current defaults in a controlled two-client call. Retain default `active_level` and `min_percentile` unless measurement shows low-volume speech is missed. A 200 ms update period limits server notification delay without multiplying updates as aggressively as 100 ms.

*Alternative rejected:* add client audio-level polling or prediction. It duplicates SFU detection, adds CPU work in every renderer, and may diverge from sidebar and popout indicators.

### D2. Keep the existing event-to-UI pipeline

Continue to use the LiveKit room event and existing reactive `speaking` set. Tune the source, then change frontend only if timing measurements show client rendering adds material lag.

*Alternative rejected:* arbitrary client-side timeout on `ActiveSpeakersChanged`; that can smooth release but cannot make the initial server event arrive earlier.

## Risks / Trade-offs

- [Shorter interval can increase event volume or flicker] → compare onset and release under quiet speech and background noise; adjust `smooth_intervals` if needed.
- [Server version may differ from current upstream docs] → validate config with the pinned v1.13.5 image before rollout.
