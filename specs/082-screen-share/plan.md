# Implementation Plan: Compartilhamento de tela no canal de voz

**Branch**: `082-screen-share` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/082-screen-share/spec.md`

**Note**: `.specify/feature.json` → `specs/082-screen-share`. Clarificações supersedem o PRD em `docs/screen-share.md` quanto a auto-modo/restauro/opt-out local: **sem** troca automática Grade↔Composição; tiles de ecrã **só** em Grade; controlo iniciar/parar **só** em Grade; áudio da partilha continua em Composição; indicadores no seg Grade + item do canal.

## Summary

1. **Publicação LiveKit** — `setScreenShareEnabled` / tracks `ScreenShare` (+ áudio de sistema quando o browser permitir); `contentHint: 'detail'`; independente da câmara; limpar no hangup/`releaseLocalCapture`.
2. **Estado canónico** — `screen_on` no occupant (ou conjunto derivado); start/stop idempotentes; snapshot via `voice.occupancy` (estendido) para todos os clientes.
3. **UI Grade-only** — toggle no `UserPanel` só com `viewMode === grid` e em chamada; tiles de ecrã só no layout Grade (`CameraGrid` / `layoutMedia`); Composição não renderiza vídeo de ecrã; áudio da partilha continua.
4. **Indicadores** — no `.seg-opt` Grade do header e no `a.channel-item` do canal de voz na sidebar enquanto houver ≥1 partilha.
5. **Local** — spotlight de partilhador + prioridade visual das telas em Grade (sem sync).
6. **E2EE** — validar spike que pistas ScreenShare herdam Insertable Streams da room; se não, estender antes de fechar canais cifrados.

## Technical Context

**Language/Version**: Rust (Axum backend); TypeScript / SolidJS frontend; CSS `mesa-theme.css`.

**Primary Dependencies**: LiveKit client (`liveClient.ts`, `VoiceSession`), `VoiceChannel` / `CameraGrid`, `UserPanel`, `Sidebar`, `voice_occupancy` + `api/voice.rs`, WS hub, i18n catalogs, `uiPrefs.viewMode`.

**Storage**: `voice_occupant.screen_on` (migration) — canónico no servidor. View mode permanece `mesa.viewMode` (cliente). Spotlight / layout local — memória de sessão no cliente.

**Testing**: `cargo test` (occupancy / voice API); `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md); spike E2EE screen track.

**Target Platform**: Browser + self-hosted Mesa (LiveKit SFU).

**Project Type**: Full-stack feature (API + WS + voice UI).

**Performance Goals**: Multi-share MVP (2+ screens) legível em Grade; 4+ aceitável apertado; sem mudar modo global.

**Constraints**: Sem auto-modo/restauro/pre_share; sem opt-out «ver composição»; controlo partilha só em Grade; Composição sem tiles de ecrã; câmara independente; qualquer participante (MVP).

**Scale/Scope**: Um canal de voz/vídeo existente; N partilhadores simultâneos; indicadores sidebar + header.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + cargo test + tsc |
| Complexity Tracking | Vazio (extensão occupancy existente) |

**Gate: PASS**

### Re-check pós-Phase 1

data-model + contracts HTTP/WS/UI + quickstart. Sem auto-layout server-side. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/082-screen-share/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── screen-share-api.md
│   ├── screen-share-ws.md
│   ├── screen-share-ui.md
│   └── grade-layout-spotlight.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/NNNN_voice_occupant_screen_on.sql
backend/src/domain/voice_occupancy.rs      # screen_on on occupant / OccupantView
backend/src/api/voice.rs                   # start/stop or PATCH media; leave clears; broadcast
backend/src/db/…                           # persistence helpers if split

frontend/src/video/liveClient.ts           # optional helpers; E2EE room already on
frontend/src/voice/VoiceSession.tsx        # toggleScreenShare; screenOn signal; release on hangup
frontend/src/voice/releaseLocalCapture.ts  # stop screen share tracks
frontend/src/pages/VoiceChannel.tsx        # layoutMedia split Camera vs ScreenShare; Grade indicator; audio in composition
frontend/src/components/CameraGrid.tsx     # grade: screen-priority + spotlight layout
frontend/src/shell/UserPanel.tsx           # screen toggle (Grade + live only)
frontend/src/shell/Sidebar.tsx             # channel-item share indicator from occupancy
frontend/src/preferences/uiPrefs.ts        # reactive viewMode notify for panel gate (if needed)
frontend/src/api/client.ts                 # types + start/stop or patch screen
frontend/src/styles/mesa-theme.css         # indicators, grade screen band, panel btn
frontend/src/i18n/catalogs/{en,pt-BR}.ts   # screen share strings
spike/…                                    # optional E2EE screen-track check notes
```

**Structure Decision**: Extender occupancy existente (`screen_on`) em vez de um subsistema de layout canónico no servidor — alinhado com clarificações (modo continua local).

## Complexity Tracking

N/A
