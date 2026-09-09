# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product versions align with `frontend/package.json` and `backend/Cargo.toml` unless noted.

## [Unreleased]

## [0.6.0] - 2026-09-08

### Added

- Frontend **multi-idioma** EN + pt-BR (custom catalogs, browser detect + `mesa.locale`, Account menu language control; system role labels translate; user content stays raw) ([074-i18n-en-ptbr](specs/074-i18n-en-ptbr/)).
- Product **version label** (`X.Y.Z` from package): Auth brand footer + under TopBar «Mesa»; FE/BE manifests for this release **0.6.0** ([076-app-version-label](specs/076-app-version-label/)).
- **Member join welcome** (system chat announce on invite accept/register): destination owner channel → `#geral` → per-invite channel; owner GET/PATCH `/api/servers/{id}/welcome`; centered FE system rows ([077-member-join-welcome](specs/077-member-join-welcome/)).
- **Discord-style user panel**: identity (handle / Online); mic · deafen · camera · settings; leave while in call; channel-list collapse deferred ([078-user-panel-discord](specs/078-user-panel-discord/), [081-panel-cam-header-blur](specs/081-panel-cam-header-blur/)).
- **Chat image lightbox**: click message attachments to view full decrypted image; fit + zoom/pan; Escape/backdrop/X close; prev/next within the same message (no wrap, zoom reset); download control ([079-chat-image-zoom](specs/079-chat-image-zoom/)).

### Changed

- Voice **call chrome**: camera on the user panel (session preference drives JOIN; pre-join is JOIN-only); blur as header select (none / light / strong); removed in-call bottom bar and stage mode ([080-call-controls-restore](specs/080-call-controls-restore/), [081-panel-cam-header-blur](specs/081-panel-cam-header-blur/)).
- Mic and deafen work **out of call** as browser-session preferences; joining a call inherits that state ([080-call-controls-restore](specs/080-call-controls-restore/)).

### Fixed

- Leave call always available from the user panel while live; mid-call camera/blur reachable after entering without camera ([080-call-controls-restore](specs/080-call-controls-restore/), [081-panel-cam-header-blur](specs/081-panel-cam-header-blur/)).
- User-panel call control sizing/alignment (32×32 peers; stage + collapsed-channels layout) ([075-panel-cam-ctrl-align](specs/075-panel-cam-ctrl-align/)).

## [0.5.0] - 2026-09-08

### Added

- Unicode **emoji** in channel names and chat; composer **emoji picker** + `:shortcode:` suggest (no auto-replace); in-field chrome with attach left and emoji + paper-plane send right ([070-emoji-hypertext-picker](specs/070-emoji-hypertext-picker/)).
- Message body **@handle** chips (background + bold) for other members; click opens members panel when available ([067-mention-handle-style](specs/067-mention-handle-style/)).
- Composer **@ mention autocomplete**: picker of channel viewers (excludes self), dynamic filter, keyboard select; `GET /api/channels/{id}/mentionables` ([065-mention-autocomplete](specs/065-mention-autocomplete/)).
- Message **@mentions** (client metadata, E2EE-safe), **replies** (`reply_to_message_id`), durable **Menção/Resposta** notifications (migration `0018`), TopBar list + deep-link `?msg=`, personal highlight until viewed, stick-to-bottom + «Saltar para o presente» ([062-message-mentions-replies](specs/062-message-mentions-replies/)).
- Text channel **day separators**: inline dash line with **Hoje** / **Ontem** / full PT date; sticky label while scrolling (hidden when inline is at top); local TZ; no empty-day lines ([061-channel-day-separators](specs/061-channel-day-separators/)).
- Permissions parity phase 1: role **hierarchy** (`position`), channel overwrites **Allow/Deny** with «todos os membros», denial reason codes, and admin **access inspect** (`0017`) ([060-permissions-parity-phase1](specs/060-permissions-parity-phase1/)).
- Automatic system role **Dono** for the server creator (`is_system`, full caps, migration `0016` backfill); protected from delete/edit/reassign; members UI locks owner and hides Dono from other pickers ([059-server-owner-role](specs/059-server-owner-role/)).
- Channel mute (timeout): role cap **Silenciar membros**, per-channel duration presets/custom, composer blocked until `ends_at`, unmute from members panel; kick remains membership-only (account retained) ([058-channel-mute-member](specs/058-channel-mute-member/)).
- Server settings shell: gear/name → `/servers/:id/settings` with grouped nav (Membros, Perfis page, Imagem, Apagar), placeholder home, TopBar X exit; legacy members/permissions redirects ([056-server-settings-shell](specs/056-server-settings-shell/)).
- Channel rename via double-click / double-tap on the sidebar name; `PATCH /api/channels/{id}` accepts `name` for owner ∪ creator ∪ **Gerenciar canal** ([054-channel-rename](specs/054-channel-rename/)).
- Members manage page, session presence roster (Online/Offline by role), and server-name menu (**Membros** + **Perfis**) with single-role-per-member model and migration `0014` ([052-members-role-assignment](specs/052-members-role-assignment/)).
- Server roles with channel-creation capability, public/private channel visibility, account/role ACLs, effective text/voice permission enforcement, owner-only member removal, and matching role/ACL/privacy controls in the frontend ([047-server-channel-permissions](specs/047-server-channel-permissions/)).
- Dedicated role-permissions page (Geral/Texto/Voz toggles + Save/`returnTo`), expanded `server_role` capability flags (migration `0013`), and backend enforcement for invites, manage channels/roles, delete-others, attachments, kick, and voice ([047-server-channel-permissions](specs/047-server-channel-permissions/) Phase 10).

### Fixed

- Text chat no longer freezes after idle: WebSocket auto-reconnect, incremental message catch-up, and a non-modal delivery banner ([069-idle-chat-stall](specs/069-idle-chat-stall/)).
- TopBar **Notificações** dropdown no longer clipped by the header: `.topbar` overflow/stacking so the panel paints above the shell; scrollable `max-height` on long lists ([066-topbar-notif-panel](specs/066-topbar-notif-panel/)).
- Typing a valid `@handle` in text chat notifies again: send resolves mentions from the channel mentionables roster (same source as the picker), not a silent empty set ([065-mention-autocomplete](specs/065-mention-autocomplete/)).
- Sidebar invite button respects role **Criar convites** (not owner-only); role-management gear stays owner-only ([050-invite-permission-ui](specs/050-invite-permission-ui/)).

### Changed

- Roles manage card heading shows **name only** (no «posição N» / «(sistema)» in `.permission-card-heading`) ([073-role-card-name-only](specs/073-role-card-name-only/)).
- Channel names: max **32** characters, spaces → `-` while typing (create/rename); reject empty/hyphen-only; BE enforces on create/PATCH. Private sidebar **lock** on the right with **clear name reserve** (fade only in that band); rename/create fields do not scroll the sidebar horizontally ([072-channel-name-lock](specs/072-channel-name-lock/)).
- TopBar notifications: auto-clear durable Menção/Resposta when the target message enters the viewport; session unreads track per-message with **5+** aggregate per channel (mentions/replies always full); **Limpar** via `POST /api/notifications/read-all`; larger bell (24px); binary badge unchanged ([071-notif-seen-collapse](specs/071-notif-seen-collapse/)).
- TopBar notification list shows **channel name** + local when (`Hoje`/`Ontem`/`DD mmm HH:MM`) for durable items; session unseen shows name only (no UUID / Menção·Resposta labels) ([068-notif-channel-datetime](specs/068-notif-channel-datetime/)).
- Day-separator dash lines span the text-scroll content width (inside panel padding); sticky day chip sits flush at the scroll top as a compact pill ([064-day-sep-full-width](specs/064-day-sep-full-width/)).
- Channel ACL, rename, delete, and access inspect share one manage model: owner ∪ creator ∪ **Gerenciar canal** with role hierarchy vs creator; ACL PUT also requires outranking account/role subjects ([063-channel-acl-edit-parity](specs/063-channel-acl-edit-parity/)).
- Login and app theme follow the browser/OS by default; TopBar cycles Sistema → Claro → Escuro with local `mesa.theme` (including explicit `system`); cross-tab + OS sync; early `index.html` boot reduces FOUC ([057-system-theme-preference](specs/057-system-theme-preference/)).
- Server-name dropdown and rail context «Imagem / Apagar» replaced by settings shell navigation ([056-server-settings-shell](specs/056-server-settings-shell/)).
- Channel list can hide behind the Server Rail on desktop (also outside stage): peek strip opens only; header «Ocultar canais» closes; preference `mesa.channelsListExpanded` with legacy fallback ([055-channels-rail-drawer](specs/055-channels-rail-drawer/)).
- Production entry JS drops below 500 kB by lazy-loading LiveKit/voice (`loadVoiceRuntime` + route/PiP code-split); loading + retry UX on voice module failure; shared FE helpers (`apiError`, `capabilities`, `localPrefs`, `safeMedia`, …) and dedupe inventory ([053-frontend-build-optimize](specs/053-frontend-build-optimize/)).
- «Papéis do servidor» defines profiles only; member role assignment moves to Gerir membros; presence panel groups by Online/Offline then role ([052-members-role-assignment](specs/052-members-role-assignment/)).
- Topbar and auth brand use the Mesa logo image (`/mesa-logo.png`) instead of the solid accent mark; wordmark «Mesa» kept ([051-topbar-logo-image](specs/051-topbar-logo-image/)).
- Call controls (mic, deafen, camera/blur, leave) live only on the user panel whenever in a call — including on the voice stage; stage `.call-controls` bar and scene-recording UI removed (G1 backlog) ([049-panel-only-call-controls](specs/049-panel-only-call-controls/)).
- User panel spans the full left nav width (server rail + channel list) as one continuous card; server rail ends above the panel with `--shell-gutter`; thin `1px` + `--radius-lg` outline on the full `.app` chrome ([048-user-panel-span-rail](specs/048-user-panel-span-rail/)).
- Invite codes default to a **5-minute** TTL (`DEFAULT_INVITE_TTL_SECS=300`), cap at **10** successful uses, reject permanent creates, and invalidate legacy usable invites on migration ([046-invite-5min-window](specs/046-invite-5min-window/)).
- Public channels are always visible to all members; `visible_to_new_members` no longer hides public channels (hide via private + ACL) ([047-server-channel-permissions](specs/047-server-channel-permissions/) FR-008).

## [0.4.1] - 2026-09-06

### Changed

- Shell chrome uses inset rounded cards (topbar, server rail, sidebar header/nav/user-panel, main pane) with subtle uniform `--shell-gutter` gaps so corners stay visible ([045-shell-chrome-radius](specs/045-shell-chrome-radius/)).

## [0.4.0] - 2026-09-06

### Added

- Floating user panel at the sidebar bottom (avatar, online, handle, account menu); mic / deafen / camera+blur / leave share `VoiceSession` state and appear on exactly one active site (stage vs panel); TopBar account chip removed ([039-floating-user-bar](specs/039-floating-user-bar/)).
- Discord-like visual polish: self-hosted Inter typography; filled call-control glyphs; server-rail unread pill + voice indicator with durable `channel_read_state`; theme-aware `--shadow-float` and menu enter motion with `prefers-reduced-motion` ([037-discord-visual-alignment](specs/037-discord-visual-alignment/)).
- Floating voice call miniature (PiP) when leaving the stage for text: video preview or status fallback, drag-snap to four corners, coexists with the connected bar ([038-floating-voice-pip](specs/038-floating-voice-pip/)).
- Pre-join choice to enter a voice channel with camera or without (bank); joining without camera skips auto-slot; turning camera on later auto-assigns only in auto scene with a free slot ([032-voice-join-camera-choice](specs/032-voice-join-camera-choice/)).
- Nested voice roster shows mic + headphones icons with a shared speaking aura driven by LiveKit active speakers (in-call viewers only) ([033-voice-speaking-indicator](specs/033-voice-speaking-indicator/)).
- Speaking aura on the whole call-controls microphone button (same visual language as the roster; mute still blocks aura; labels unchanged) ([036-mic-ctrl-speaking-aura](specs/036-mic-ctrl-speaking-aura/)).

### Changed

- System-wide moderate–strong corner radius: `--radius-sm|md|lg` → 8/14/22px; Mesa theme box hardcodes mapped to tokens; pills (`999px`) and circles (`50%`) unchanged ([044-rounded-borders](specs/044-rounded-borders/)).
- Confirmed user-panel call controls (including leave) mount only while in a live voice/video call off-stage — no idle `is-disabled` chrome ([043-panel-calls-in-call-only](specs/043-panel-calls-in-call-only/); builds on [042](specs/042-panel-call-stage-ui/)).
- User panel call controls only show while in a voice call (off-stage); panel icons share the mic size; voice stage reclaims ~40–80px height via tighter margins/header/privacy chrome ([042-panel-call-stage-ui](specs/042-panel-call-stage-ui/)).
- Selecting a server navigates the main pane to that server’s last/first channel (or a blank joke screen when it has zero channels); last channel remembered per server in localStorage ([041-server-scoped-pane](specs/041-server-scoped-pane/)).
- Removed the shell «ainda na chamada» connected bar; off-stage chrome is the floating PiP only, with footer «Voltar à mesa» + red hangup icon (stay on current view; no mic/cam on PiP) ([040-remove-connected-bar](specs/040-remove-connected-bar/)).
- Scene editor side panel stacks slots / layout / bank by content (compact slots at top) instead of stretching section labels with equal `flex: 1` ([034-scene-editor-side-layout](specs/034-scene-editor-side-layout/)).
- Join/connect errors surface categorized Portuguese messages (permission / device / connection / generic) instead of raw browser text ([031](specs/031-voice-join-errors/)).
- Moving to another voice channel leaves the previous call and shows the dual pre-join actions again instead of auto-reconnecting with the previous camera mode ([032](specs/032-voice-join-camera-choice/)).

### Fixed

- Server rail / channel-list selection stays aligned with the main pane after switching servers (including empty-server joke view): no stale highlight on the previous server or channel ([041-server-scoped-pane](specs/041-server-scoped-pane/) US4).
- Voice join failures after occupancy upsert no longer leave a ghost occupant or orphan mic/camera capture: `abortFailedJoin` leaves the channel and stops local tracks; camera-only GUM failure joins audio-only with a PT warning ([031-voice-join-errors](specs/031-voice-join-errors/)).
- Leaving a voice call (stage, persistent bar, drop, unload, failed join) releases mic/camera via shared `releaseLocalCapture` before best-effort `leaveVoice` ([035-voice-leave-release-media](specs/035-voice-leave-release-media/)).

## [0.3.0] - 2026-09-05

### Added

- Production profile (`MESA_PRODUCTION=1` or `MESA_ENV=production`) refuses example LiveKit keys and requires `COOKIE_SECURE=true`; default `BIND` is `127.0.0.1:8080` ([024-security-hardening](specs/024-security-hardening/)).
- In-process login/register rate limit (10 requests / 60s / TCP IP) returning `429` `{ "error": "too many requests" }` ([024](specs/024-security-hardening/)).
- Security headers on all responses: `X-Frame-Options: DENY`, nosniff, `Referrer-Policy: no-referrer`, CSP with `frame-ancestors 'none'`; HSTS when cookie Secure or production ([024](specs/024-security-hardening/)).
- Auth / invite screens redesigned to the two-pane Mesa prototype layout (brand + form, dark chrome, tabs, field adornments, password visibility) ([027-auth-login-screen](specs/027-auth-login-screen/)).
- Nested roster of transmitting members (mic or camera on) under each voice channel, plus a shared call-session timer; occupancy lives on the Axum server (`voice_occupant` + `voice.occupancy`) ([028-voice-call-roster](specs/028-voice-call-roster/)).
- Persistent voice session in the shell: stay in the call while reading text, connected bar with Voltar à mesa / Sair, and moving to another voice channel ([028](specs/028-voice-call-roster/)).
- User profile photos and server images (JPEG/PNG/WebP, ≤1 MiB) with initials fallback on the topbar chip, member list, messages, and server rail; owner-only server image ([029-user-server-avatars](specs/029-user-server-avatars/)).
- Identity icon (photo or initials) to the left of the handle on the nested voice roster and text message groups; occupancy snapshot includes `has_avatar` ([030-voice-roster-avatars](specs/030-voice-roster-avatars/)).

### Changed

- Unfurl resolves DNS, blocks private/loopback/link-local IPs (including after redirects), and caps the body at 256 KiB; OG `image_url` is re-validated; the client only uses `http(s)` for preview images ([024](specs/024-security-hardening/)).
- Voice join `url` is always `LIVEKIT_WS_URL` (Host / `X-Forwarded-Host` ignored) ([024](specs/024-security-hardening/)).
- Server key envelopes: self-upsert allowed; another member only while `pending` and the caller is owner or `synced`; overwrite of a `synced` envelope is `403` ([024](specs/024-security-hardening/)).
- Nocturne fonts use `system-ui, sans-serif` (no Google Fonts CDN) ([024](specs/024-security-hardening/)).
- LAN/prod docs: `BIND=0.0.0.0:8080` must be explicit on the LAN; production section does not present example LiveKit keys as the recipe ([024](specs/024-security-hardening/)).

### Fixed

- First-operator flag is assigned inside a SQLite `BEGIN IMMEDIATE` transaction so two parallel empty-instance registers cannot both become initial operator ([024](specs/024-security-hardening/)).
- Voice leave (and move) frees the grid slot so the stage no longer shows people who already hung up ([028-voice-call-roster](specs/028-voice-call-roster/)).

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
- Voice call **Câmera** control is split: main area toggles camera; a chevron opens Sem blur / Blur leve / Blur forte (shape on the chevron shows blur on) ([015](specs/015-camera-background-blur/)).
- Scene `layout_key` and `slot_count` are independent: API accepts e.g. mestre+6 / faixa+3; voice `grid_slot_count` provision range is **2–8** ([018-scene-camera-count](specs/018-scene-camera-count/)).
- Channel header **Membros** is an icon-only people-group control (selected while the list is open); server **Convite** is a person-plus icon to the right of the server name, **owner-only** ([019-members-invite-icons](specs/019-members-invite-icons/)).
- Call bar: Microfone and Câmera are icon-only with state tooltips; camera+blur chevron is a Discord-style unified split; **Sair** keeps hangup + label on a red danger button ([020-call-control-icons](specs/020-call-control-icons/)).
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

[Unreleased]: https://github.com/ricardosobral/chat-app/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/ricardosobral/chat-app/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/ricardosobral/chat-app/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/ricardosobral/chat-app/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/ricardosobral/chat-app/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ricardosobral/chat-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ricardosobral/chat-app/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/ricardosobral/chat-app/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ricardosobral/chat-app/releases/tag/v0.1.0
