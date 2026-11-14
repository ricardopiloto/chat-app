# Tasks

## 1. Server audio tuning

- [x] 1.1 Confirm `audio.update_interval` and `audio.smooth_intervals` are accepted by the pinned LiveKit v1.13.5 image in `infra/docker-compose.yml`; record any version-specific defaults.
  - Confirmed against LiveKit tag `v1.13.5` source (`pkg/sfu/audio/audiolevel.go` `AudioLevelConfig` yaml tags; `pkg/sfu/receiver_base.go` `AudioConfig` + `config-sample.yaml` `audio:` stanza). Pinned image: `livekit/livekit-server:v1.13.5`.
  - Version defaults: `update_interval` **400** ms, `smooth_intervals` **2**, `active_level` **35**, `min_percentile` **40**. (Sample YAML comments still say 500/4/30 — code defaults win.)
- [x] 1.2 Add the tested `audio` stanza to `infra/livekit.yaml`, starting with `update_interval: 200` and `smooth_intervals: 2`; leave threshold keys at default unless measurements justify changing them.

## 2. Timing verification

- [x] 2.1 Measure speech onset-to-indicator latency and release flicker before/after in a two-client call, including quiet speech and background noise; tune the values if the starting profile regresses stability.
  - Smoke plan (after `docker compose` reload of LiveKit with the new `livekit.yaml`): two clients in the same voice channel. Record approximate onset (speech start → border/chip) and release with defaults vs `200`/`2`. Include quiet speech and light background noise. If flicker between syllables increases, raise `smooth_intervals` (e.g. 3–4) before touching thresholds; only set `active_level` / `min_percentile` if quiet speech is missed.
- [x] 2.2 Confirm grid, stage, sidebar, and popout speaking indicators remain consistent, with no new frontend polling path.
  - Confirmed in code: `callSession` still sets `speaking` only from `ActiveSpeakersChanged` (no analyser/polling). Grid/stage/strip/mini tiles and composition bench chips all read `call.speaking()`; popout uses `GridView` on the same signal path / SFU events. No frontend change in this change.

## 3. Spec validation

- [x] 3.1 Run `openspec validate tune-speaking-indicator-latency --strict` and confirm it passes with no errors.
