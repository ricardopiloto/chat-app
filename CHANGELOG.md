# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product versions align with `frontend/package.json` and `backend/Cargo.toml` unless noted.

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [0.2.0] - 2026-09-05

### Added

- Paste images into the text-channel pane (messages area + composer): pending attachments; text+image paste splits to pending + composer draft ([010-media-paste-webp](specs/010-media-paste-webp/)).
- Pasted static images converted client-side to WebP (quality 0.82); animated GIFs kept as GIF ([010](specs/010-media-paste-webp/)).
- Delete text-channel messages: author (own, no time limit), channel creator (any in that channel), or server owner (any text channel); hard remove + attachment cleanup; WS `message.deleted`; hover/focus «Apagar» + confirm ([011-text-message-delete](specs/011-text-message-delete/)).
- Shell SVG icon system (call controls, E2EE lock, voice channels, create/menu, topbar search/bell/settings) ([012-shell-iconography-typography](specs/012-shell-iconography-typography/)).
- Client-only topbar search (member servers/channels), session notifications from WS, and settings panel (theme + logout) ([012](specs/012-shell-iconography-typography/)).
- Topbar theme toggle with sun/moon icons reflecting the **current** theme ([013-topbar-scene-ux](specs/013-topbar-scene-ux/)).
- Account menu on user chip (read-only handle + logout with confirmation dialog) ([013](specs/013-topbar-scene-ux/)).
- Topbar search shortcut Ctrl+F / Cmd+F; in a text channel seeds `#nome ` (replaces field) ([014-search-channel-scope](specs/014-search-channel-scope/)).
- Channel-scoped search via `#canal termo`; distinct empty states (not found / text-only / no results) ([014](specs/014-search-channel-scope/)).
- Camera background blur (light / strong) on the published live-camera feed, visible to others and recordings; preference in `localStorage` ([015-camera-background-blur](specs/015-camera-background-blur/)).
- Selecting a topbar search hit jumps to that exact text message (centered), highlights it for ~3 s, and shows a non-modal toast if it cannot be found ([017-search-jump-highlight](specs/017-search-jump-highlight/)).
- Scene editor camera/slot count **N ∈ [2,8]** with parametric layouts (Mestre featured slot 0 + satellites, Faixa N-up, Painel balanced grid); reduce-N picker when occupied slots would be dropped; live stage updates only on Save ([018-scene-camera-count](specs/018-scene-camera-count/)).
- Hover or keyboard focus on a text-channel message highlights the full `.msg-block` (text + attachments) with `--hover`; distinct from the search-jump `.msg-highlight` ([021-message-hover-highlight](specs/021-message-hover-highlight/)).

### Changed

- Max attachment size lowered from 8 MiB to **5 MiB** (client + server) ([010](specs/010-media-paste-webp/)).
- Typography: `--font-mono` for copyable technical values; heading weights by level (h1–h3 vs h4–h6) ([012](specs/012-shell-iconography-typography/)).
- Call control labels stay in Portuguese across on/off states; width stabilized ([012](specs/012-shell-iconography-typography/)).
- Topbar search expands inline (icon → field + results popover); no modal just to type ([013](specs/013-topbar-scene-ux/)).
- Scene editor layout fills the voice pane: wide preview + ~296px side column (Protótipo v2) ([013](specs/013-topbar-scene-ux/)).
- Search without `#` covers all accessible text channels; placeholder documents `#canal termo` ([014](specs/014-search-channel-scope/)).
- Shared Dialog + form controls (`.input` / `.field`) restyled to Mesa tokens; create-channel/server «+» modals inherit look and live theme ([016-plus-create-modals](specs/016-plus-create-modals/)).
- Voice call **Câmara** control is split: main area toggles camera; a chevron opens Sem blur / Blur leve / Blur forte (shape on the chevron shows blur on) ([015](specs/015-camera-background-blur/)).
- Scene `layout_key` and `slot_count` are independent: API accepts e.g. mestre+6 / faixa+3; voice `grid_slot_count` provision range is **2–8** ([018-scene-camera-count](specs/018-scene-camera-count/)).
- Channel header **Membros** is an icon-only people-group control (selected while the list is open); server **Convite** is a person-plus icon to the right of the server name, **owner-only** ([019-members-invite-icons](specs/019-members-invite-icons/)).
- Call bar: Microfone and Câmara are icon-only with state tooltips; camera+blur chevron is a Discord-style unified split; **Sair** keeps hangup + label on a red danger button ([020-call-control-icons](specs/020-call-control-icons/)).
- Search-jump highlight (~3 s) covers the full message **group** (avatar + meta + bubbles), not only the hit bubble; scroll still centres the message ([022-search-group-highlight](specs/022-search-group-highlight/)).
- Text-channel message delete control is icon-only trash in soft light red (matching fill + border); tooltip «Apagar»; `aria-label` unchanged; confirm flow unchanged ([026-message-delete-icon](specs/026-message-delete-icon/)).

### Fixed

- Dialog `Portal` now mounts under `.app` and theme is mirrored on `<html>`, so light/dark tokens apply while modals are open ([016](specs/016-plus-create-modals/)).
- Camera blur chevron menu was clipped by Discord-style split `overflow: hidden` (020); menu Sem / Leve / Forte opens again, including stage mode ([023-fix-blur-menu](specs/023-fix-blur-menu/)).
- Dev Vite `[vite] ws proxy error: This socket has been ended by the other party` on voice leave: ordered LiveKit disconnect + leave dedupe; narrow logger filter for that exact benign `/rtc` half-close ([025-ws-disconnect-proxy](specs/025-ws-disconnect-proxy/)).

### Removed

- Settings gear / `SettingsPanel` from the topbar; theme and logout live on the toggle and account menu ([013](specs/013-topbar-scene-ux/)).

## [0.1.1] - 2026-09-04

### Added

- Shell creation via «+»: pinned create control on the server rail; section «+» on **Texto** / **Voz e vídeo** (owner only); type implied by section ([007-shell-create-plus](specs/007-shell-create-plus/)).
- Create-server bootstrap: custody of the initial voice channel key; auto-provisions text (`geral`) + voice (`mesa`) with channel key and default scene.
- Delete-channel guard `last_channel_of_type` (409) so each server keeps at least one text and one voice channel.
- Server **Members** panel on the right, toggled from the channel header (text and voice); reuses `GET /api/servers/{id}/members`; stays open and refreshes on server switch ([008-shell-chrome-members](specs/008-shell-chrome-members/)).
- Text-channel **image/GIF attachments** (up to 10, ≤8 MiB), client-encrypted with the server key; opaque blobs under `ATTACHMENTS_DIR` ([009-chat-media-embeds](specs/009-chat-media-embeds/)).
- Lazy **link unfurl** via `POST /api/unfurl` after decrypt (OG/image/video cards; SSRF guards) ([009](specs/009-chat-media-embeds/)).

### Changed

- Voice channel chrome: single-scene UX — multi-scene list/create/switch hidden; **Editar cena** edits the active scene only. Multi-scene UI deferred to backlog G10.
- Action buttons use pill radius (`999px` / `--radius-pill`) aligned with Protótipo v2 ([008](specs/008-shell-chrome-members/)).
- Text composer uses full pane width (removed artificial `74ch` max-width) ([008](specs/008-shell-chrome-members/)).
- Stage mode collapses the channel column to a strip with «mostrar canais» instead of hiding rail + sidebar entirely; rail stays visible ([008](specs/008-shell-chrome-members/)).
- Text messages may include `attachment_ids`; composer supports media-only and multi-attach preview ([009](specs/009-chat-media-embeds/)).

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

[Unreleased]: https://github.com/ricardosobral/chat-app/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ricardosobral/chat-app/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/ricardosobral/chat-app/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ricardosobral/chat-app/releases/tag/v0.1.0
