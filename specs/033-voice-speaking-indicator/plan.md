# Implementation Plan: Indicador animado de «a falar» na lista do canal de voz

**Branch**: `033-voice-speaking-indicator` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/033-voice-speaking-indicator/spec.md`

## Summary

Na lista aninhada do canal de voz (028/030), mostrar ícones de **microfone** (ligado/mudo) e de **saída de áudio** («a ouvir», sem deafen). Quando um participante da **mesma chamada** está a falar, aplicar a **mesma aura** animada em ambos os ícones. Detecção **só no cliente** via LiveKit `ActiveSpeakersChanged` / `isSpeaking` (identity = `account_id`); sem API nova. Observadores fora da chamada vêem ícones sem aura.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `livekit-client` ^2.15 (`RoomEvent.ActiveSpeakersChanged`, `participant.isSpeaking`); `VoiceSession` (room session); `Sidebar.tsx` voice roster; occupancy `mic_on`; `IconMicOn`/`IconMicOff`; novo ícone headphones/speaker; CSS `.voice-roster-*` em `mesa-theme.css`.

**Storage**: N/A.

**Testing**: `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) com 2 clientes na mesma chamada.

**Target Platform**: Browser na mesa LiveKit.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Aura ≤1 s após fala; cessa ≤2 s; histerese curta; sem WS speaking.

**Constraints**: Sem deafen; sem API speaking; aura só se viewer `voice.live()` na mesma chamada; não mudar quem entra na lista 028.

**Scale/Scope**: Roster UI + speaking signal do `VoiceSession` + CSS aura + ícones.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI + LiveKit client events; sem schema/API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/033-voice-speaking-indicator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── voice-speaking-roster-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── voice/VoiceSession.tsx           # ActiveSpeakers → speakingIds signal
├── video/liveClient.ts              # opcional: registar RoomEvent
├── shell/Sidebar.tsx                # ícones mic/speaker + aura class
├── components/icons/
│   ├── IconMic.tsx                  # reutilizar On/Off
│   └── IconHeadphones.tsx           # NOVO — saída «a ouvir»
└── styles/mesa-theme.css            # .voice-roster-mic/speaker + .speaking aura
```

**Structure Decision**: Expor set de `account_id` a falar a partir da sessão LiveKit; Sidebar consome com `mic_on` da ocupação e `voice.live()` para gate da aura.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
