# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product versions align with `frontend/package.json` and `backend/Cargo.toml` unless noted.

## [Unreleased]

### Added

- Shell creation via «+»: pinned create control on the server rail; section «+» on **Texto** / **Voz e vídeo** (owner only); type implied by section ([007-shell-create-plus](specs/007-shell-create-plus/)).
- Create-server bootstrap: custody of the initial voice channel key; auto-provisions text (`geral`) + voice (`mesa`) with channel key and default scene.
- Delete-channel guard `last_channel_of_type` (409) so each server keeps at least one text and one voice channel.

### Changed

- Voice channel chrome: single-scene UX — multi-scene list/create/switch hidden; **Editar cena** edits the active scene only. Multi-scene UI deferred to backlog G10.

### Removed

- Textual sidebar buttons «Criar servidor» and «Criar canal».

## [0.1.0] - 2026-09-04

Initial tracked release baseline (features delivered through 006).

### Added

- Self-hosted Mesa chat: servers, text and voice/video channels, invites, LiveKit voice with E2EE.
- Scene/layout composition for voice channels (grid admin, scene APIs).
- Prototype UI parity shell: server rail, Nocturne/Mesa theme, delete server/channel ([006-prototype-ui-parity](specs/006-prototype-ui-parity/)).
- Channel-key custody, Gravar ↔ E2EE off/Religar, optional LiveKit egress ([006](specs/006-prototype-ui-parity/)).
- Speckit feature workflow under `specs/` (001–006).

### Notes

- Earlier spikes and phases: see `specs/001-fase-0-spike/` … `specs/005-fase3-ui-corrections/` and `docs/`.

[Unreleased]: https://github.com/ricardosobral/chat-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ricardosobral/chat-app/releases/tag/v0.1.0
