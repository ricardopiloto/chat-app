# Implementation Plan: Aura de «a falar» no botão de microfone dos call-controls

**Branch**: `036-mic-ctrl-speaking-aura` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/036-mic-ctrl-speaking-aura/spec.md`

## Summary

Reutilizar o estado `speakingAccountIds` + detecção LiveKit de [033](../033-voice-speaking-indicator/) e aplicar a **mesma linguagem de aura** ao **botão inteiro** de microfone em `.call-controls` (`VoiceChannel`), enquanto o utilizador local está na chamada, com mic ligado e a falar. Sem alterar mute, rótulos, nem outros controlos.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `VoiceSession.speakingAccountIds` / `micOn`; `RoomEvent.ActiveSpeakersChanged` (já em 033); `VoiceChannel.tsx` call-controls; CSS aura 033 (`.voice-roster-media-icon.is-speaking` / `@keyframes voice-roster-speak-aura`).

**Storage**: N/A.

**Testing**: `./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md) (SC-001–005). Sem contract BE.

**Target Platform**: Browser na mesa / modo palco com call-controls visíveis.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Aura ≤1 s ao começar a falar; cessa ≤2 s; alinhado à histerese 033 (~120 ms).

**Constraints**: FR-001–007; aura só no botão de mic; rótulos fixos; mesma linguagem visual 033; sem API/WS nova.

**Scale/Scope**: Um botão local + CSS partilhado/adaptado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | tsc + quickstart manual |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Só FE: classList no botão + CSS; reusa signal 033. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/036-mic-ctrl-speaking-aura/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── call-mic-speaking-aura.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/pages/VoiceChannel.tsx   # classList is-speaking no botão mic (me + micOn + speaking set)
frontend/src/styles/mesa-theme.css    # aura no .call-controls .call-ctrl (botão inteiro); reutilizar keyframes 033
frontend/src/voice/VoiceSession.tsx   # sem mudança esperada (já expõe speakingAccountIds) — só se faltar helper local
```

**Structure Decision**: Não duplicar ActiveSpeakers. Condicionar aura local: `live && micOn && speakingAccountIds.has(me.id)`. CSS: mesma animação/cor que roster, `::before` em torno do **botão** (border-radius do `.btn` / `.call-ctrl-icon`).

## Complexity Tracking

> Vazio — wiring de UI sobre estado existente.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
