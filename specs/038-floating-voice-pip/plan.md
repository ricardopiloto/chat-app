# Implementation Plan: Miniatura flutuante da chamada de voz (PiP)

**Branch**: `038-floating-voice-pip` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/038-floating-voice-pip/spec.md`

## Summary

Quando o utilizador está **na chamada** (`voice.live`) e navega para uma vista que **não** é o canal de voz activo (mesmo predicado da barra «chamada ligada»), mostrar uma **miniatura flutuante** (PiP) com preview de vídeo LiveKit (fallback nome/estado), âncora nos **quatro cantos** (default superior direito), arrastar + snap ao soltar. A barra existente **coexiste**. Sem persistência de canto entre reloads; dentro da sessão de chamada, reutilizar o último canto até Sair. Frontend-only — sem API/WS nova.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `VoiceSession` (live, channelId, channelName, session/room, hangup); `AppShell` (`showConnectedBar` / `params.id`); `livekit-client` + `attachRemote` / room remote video pubs; CSS `mesa-theme.css`; router `useNavigate` / `useParams`.

**Storage**: N/A (canto em memória de sessão de chamada; sem `localStorage`).

**Testing**: `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) (texto + voz + drag + Sair).

**Target Platform**: Browser desktop shell (viewport da app).

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: PiP visível ≤2 s após navegar para texto; snap imediato ao soltar; vídeo actualiza quando tracks ligam/desligam.

**Constraints**: Não terminar chamada ao mostrar PiP; z-order abaixo de modais; coexistir com `voice-connected-bar`; não persistir canto entre reloads; não exigir layout móvel dedicado nesta entrega.

**Scale/Scope**: Um componente PiP na shell + helpers de âncora/drag + wiring LiveKit attach; sem backend.

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

UI + client LiveKit attach; sem schema/API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/038-floating-voice-pip/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── floating-voice-pip-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── voice/
│   ├── VoiceSession.tsx          # opcional: cornerAnchor signal até hangup
│   └── pipCorner.ts              # NOVO — tipo Corner + nearestCorner + CSS insets
├── shell/
│   ├── AppShell.tsx              # montar FloatingVoicePip com predicado showConnectedBar
│   └── FloatingVoicePip.tsx      # NOVO — UI, drag, attach vídeo, Voltar à mesa
├── video/liveClient.ts           # reutilizar attachRemote / Room
└── styles/mesa-theme.css         # .voice-pip* + z-index (abaixo modais)
```

**Structure Decision**: PiP na shell (sobrevive ao unmount de `VoiceChannel`); re-enumerar tracks do `Room` quando a vista da mesa não está montada; âncora em memória na sessão de chamada.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
