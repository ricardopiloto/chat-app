# Implementation Plan: Tratativa de falha ao entrar na sala de voz

**Branch**: `031-voice-join-errors` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/031-voice-join-errors/spec.md`

## Summary

Corrigir o join de voz/vídeo para que falhas de **áudio** ou de **ligação à sala** revertam ocupação e libertem média parcial — o utilizador **não** fica «conectado». Falha **só da câmera** com áudio ok: join sucede com câmera off + aviso por categoria. Manter `POST .../voice/join` antes do LiveKit (flash breve aceite); no `catch` de `connect`, abortar com `leaveVoice` + stop de tracks + mensagens PT por categoria. Relacionado a [035](../035-voice-leave-release-media/) (libertação de hardware).

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 (frontend); Rust/Axum só se testes de ocupação precisarem de ajuste (improvável).

**Primary Dependencies**: `VoiceChannel.tsx` (`connect`, `captureLocal`, `leave`), `VoiceSession.tsx` (`bindLive`, `hangup`, `leaveVoice`), `liveClient.ts` (`joinLiveRoom`), `POST /api/channels/{id}/voice/join` + `leave`, WS `voice.occupancy`.

**Storage**: N/A (reutiliza ocupação SQLite/WS existente; sem schema novo).

**Testing**: Manual [quickstart.md](./quickstart.md); opcional smoke occupancy após leave; `npx tsc --noEmit`. Contract BE de ocupação já existe — não obrigatório alterar.

**Target Platform**: Browser + API Mesa self-hosted.

**Project Type**: Web app — principalmente `frontend/`; BE leave inalterado.

**Performance Goals**: Estado final «fora» ≤5 s (SC-002); feedback de erro ≤3 s (SC-003).

**Constraints**: Flash breve de ocupação aceite; sem nova API speaking/join; câmera-only fail ≠ abort; áudio/sala fail = abort + revert; PT por categoria.

**Scale/Scope**: Fluxo `connect` + helper de abort/erro; split GUM áudio vs vídeo para clarificação câmera.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + `tsc`; occupancy leave via API existente |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Abort path + error taxonomy + audio-first capture; sem schema. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/031-voice-join-errors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── voice-join-errors.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── pages/VoiceChannel.tsx          # connect catch → abort; GUM split; error map
├── voice/VoiceSession.tsx          # reutilizar leaveVoice / não bindLive em falha
├── video/liveClient.ts             # joinLiveRoom (falhas propagam)
└── api/client.ts                   # leaveVoice (já existe)

# Opcional
frontend/src/voice/joinErrors.ts    # mapear erros → categorias PT
```

**Structure Decision**: Corrigir principalmente `VoiceChannel.connect`; extrair `abortFailedJoin` + mapper de erros; BE leave/occupancy inalterado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
