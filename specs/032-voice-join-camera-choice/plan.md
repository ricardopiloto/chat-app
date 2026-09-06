# Implementation Plan: Escolher câmera ao entrar na sala (ou ir para o banco)

**Branch**: `032-voice-join-camera-choice` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/032-voice-join-camera-choice/spec.md`

## Summary

Substituir o único botão «Ligar câmera e microfone» por **duas acções** de pré-join: entrar **com câmera** vs **sem câmera** (banco). No caminho sem câmera: captura só áudio, `cam_on: false` no join, **sem** auto-assign de slot. Ao ligar a câmera depois: auto-slot **só** se a cena estiver em atribuição automática e houver slot livre (senão permanece no banco).

## Technical Context

**Language/Version**: Rust 2021 (Axum); TypeScript ~5.8 / SolidJS 1.9.

**Primary Dependencies**: `POST /voice/join` + body `mic_on`/`cam_on`; `db::grid::auto_assign_first_empty`; `PATCH .../voice/media`; `VoiceChannel` pré-join; `joinLiveRoom` / `captureLocal`; `CallBank`.

**Storage**: Sem migração. Regras de slot em `scene_slot` / `AssignedBy` (auto vs owner) já existentes.

**Testing**: Contract join com `cam_on: false` → sem slot; PATCH `cam_on: true` → auto-slot condicional; `cargo test --test contract`; `npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Browser + Axum (igual 028).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Join sem câmera ≤1 min caminho feliz (SC-001); sem regressão no join com câmera.

**Constraints**: FR-001–010; dois botões no pré-join; sem preferência persistente; sem deafen; não alterar regras 028 de quem entra na lista; alinhar falhas de câmera a [031](../031-voice-join-errors/) se presente.

**Scale/Scope**: Um canal de voz por utilizador; N slots (2–8); banco ilimitado na prática da mesa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract join/PATCH slot + tsc + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Mudança localizada: condicionar auto-assign a `cam_on`; UI de dois botões; caminho `joinLiveRoom` sem forçar câmera. Sem BFF, sem tabela nova. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/032-voice-join-camera-choice/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── voice-join-camera.md
│   └── prejoin-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/api/voice.rs                 # join: skip auto_assign se !cam_on; PATCH: auto_assign ao ligar cam
backend/src/db/grid.rs                   # reutilizar auto_assign_first_empty / unassign
backend/tests/contract/voice_occupancy.rs  # ou voice_join.rs — cam_on false → banco

frontend/src/pages/VoiceChannel.tsx      # dois botões; connect(cam|audio); captureLocal audio-only
frontend/src/video/liveClient.ts         # não setCameraEnabled(true) quando sem vídeo
frontend/src/voice/VoiceSession.tsx      # camOn inicial false no caminho sem câmera
frontend/src/components/CallBank.tsx     # sem mudança de contrato (já deriva banco)
```

**Structure Decision**: Estender o join/media existentes. FE: modo de connect `camera` | `audio` | `test`. BE: auto-assign só quando `cam_on` no join ou transição para `cam_on: true` no PATCH.

## Complexity Tracking

> Vazio — regra booleana em cima de `auto_assign_first_empty` + UI de dois botões.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
