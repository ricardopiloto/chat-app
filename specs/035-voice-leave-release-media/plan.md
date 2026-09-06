# Implementation Plan: Libertar câmera e microfone ao sair da chamada

**Branch**: `035-voice-leave-release-media` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/035-voice-leave-release-media/spec.md`

## Summary

Garantir um **único caminho idempotente** que liberta captura local (mic + câmera + blur/pipeline) em **todo** fim de sessão — Sair no palco, Sair na barra persistente (`hangup`), move/`disconnectLivekitOnly`, `dropped`, `pagehide`, e join falhado com captura parcial (partilha [031](../031-voice-join-errors/) `abortFailedJoin`). Prioridade: **hardware local primeiro**, depois leave remoto best-effort (FR-007). Critério observável: indicador de captura do browser cessa sem refresh.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 (frontend). Backend leave/occupancy inalterado.

**Primary Dependencies**: `VoiceSession.tsx` (`hangup`, `dropped`, `disconnectLivekitOnly`, `pagehide`), `VoiceChannel.tsx` (`leave`, `connect` catch), `liveClient.ts` (`disconnect` com `room.disconnect(true)`), `backgroundBlur.ts` (`stopBlurProcessor`), `leaveVoice` API; alinhado a helper `abortFailedJoin` de 031.

**Storage**: N/A.

**Testing**: Manual [quickstart.md](./quickstart.md) (indicador de captura do browser); `cd frontend && npx tsc --noEmit`.

**Target Platform**: Browser (Chrome/Firefox/Safari — unload best-effort via `pagehide`).

**Project Type**: Web app — apenas `frontend/`.

**Performance Goals**: Captura libertada ≤2 s após Sair feliz (SC-001); ≤3 s em falha parcial / join falhado (SC-005, SC-007).

**Constraints**: Idempotente; libertar local mesmo se `leaveVoice` falhar; não mudar UI de Sair; unload best-effort; partilhar limpeza com 031.

**Scale/Scope**: Extrair `releaseLocalCapture` (+ reutilizar em hangup/leave/dropped/abort); fechar buraco barra persistente vs palco.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + `tsc`; sem TDD obrigatório |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Um helper de libertação + wiring nos exits existentes; sem schema/API nova. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/035-voice-leave-release-media/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── release-local-capture.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── voice/VoiceSession.tsx       # hangup / dropped / pagehide → releaseLocalCapture first
├── voice/releaseLocalCapture.ts # NEW: blur stop + track.stop + LiveKit disable (idempotent)
├── pages/VoiceChannel.tsx       # leave() usa helper; connect fail → mesmo caminho (c/ 031)
├── video/liveClient.ts          # disconnect já faz setCamera/MicEnabled(false) + disconnect(true)
├── video/backgroundBlur.ts      # stopBlurProcessor (já existe)
└── shell/AppShell.tsx           # Sair barra → hangup (deve passar a libertar via helper)
```

**Structure Decision**: Centralizar libertação em `releaseLocalCapture`; `hangup` e `dropped` passam a usá-lo (hoje só `VoiceChannel.leave` faz `track.stop` + blur). BE inalterado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
