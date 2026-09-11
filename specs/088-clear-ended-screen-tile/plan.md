# Implementation Plan: Clear ended screen-share tile

**Branch**: `088-clear-ended-screen-tile` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/088-clear-ended-screen-tile/spec.md`

## Summary

Quando o screen share termina (botão in-app ou fim do track no browser/OS), a Grade e os indicadores de partilha activa devem limpar-se de imediato. Hoje `joinLiveRoom` só trata `TrackSubscribed`; tracks de `ScreenShare` ficam em `remotesScreen` e `refreshGradeLists` continua a emitir tiles vazias com chip «Tela». Corrigir com unsubscribe/unpublish + limpeza de mapa/estado local e confirmação de `screen_on: false` / WS occupancy para indicadores.

## Technical Context

**Language/Version**: TypeScript (SolidJS frontend); Rust unchanged unless occupancy lag needs hardening  
**Primary Dependencies**: livekit-client (`RoomEvent.TrackUnsubscribed`, `LocalTrackUnpublished` / `TrackUnpublished`), Solid signals, existing `patchVoiceMedia` / `voice.occupancy`  
**Storage**: N/A (occupancy `screen_on` already persisted)  
**Testing**: Manual E2E (dois browsers); `npx tsc --noEmit`; optional unit on map-remove helper if extracted  
**Target Platform**: Modern browsers with LiveKit WebRTC  
**Project Type**: Web app (frontend-heavy fix; backend already has `screen_on`)  
**Performance Goals**: Clear within one event loop / WS occupancy tick; no leftover tile after stop  
**Constraints**: No new SFU protocol; reuse 082/083 Grade + occupancy; both end paths per clarifications  
**Scale/Scope**: Voice Grade + sidebar/channel share indicators only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Library-First | PASS | Prefer small helpers in `liveClient` / VoiceChannel for unsubscribe + map cleanup |
| II. CLI Interface | N/A | UI / LiveKit events |
| III. Test-First | PASS | Reproduce ghost tile → fix → quickstart scenarios; tsc gate |
| IV. Integration Testing | PASS | Two-client share then stop (button + browser stop) |
| V. Observability | PASS | Existing error paths; no silent failed clear |
| VI. Versioning & Breaking | PASS | Additive event handlers; occupancy contract unchanged |
| VII. Simplicity | PASS | Wire unsubscribe; remove Map entries; refresh lists — no new UI surface |

**Post-design re-check**: PASS — contracts document clear path without schema change.

## Project Structure

### Documentation (this feature)

```text
specs/088-clear-ended-screen-tile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── grade-screen-clear.md
│   └── share-indicators-clear.md
└── tasks.md              # Phase 2 (/speckit-tasks)
```

### Source Code (expected touchpoints)

```text
frontend/src/video/liveClient.ts          # TrackUnsubscribed (+ local unpublish if needed)
frontend/src/pages/VoiceChannel.tsx       # removeScreenTracks / remotesScreen delete + refresh
frontend/src/voice/VoiceSession.tsx       # ensure stopScreenShare + ended always clear screenOn
frontend/src/shell/Sidebar.tsx            # verify occupancy-driven indicators (likely OK)
```

**Structure Decision**: Frontend-only event/state cleanup on existing 082/083 surfaces; backend occupancy already supports `screen_on`.

## Complexity Tracking

No constitution violations.
