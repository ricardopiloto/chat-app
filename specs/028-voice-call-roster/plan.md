# Implementation Plan: Lista de participantes e duração da chamada de voz

**Branch**: `028-voice-call-roster` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-voice-call-roster/spec.md`

## Summary

Mostrar, na coluna de canais, quem está **a transmitir** (mic **ou** câmara ligados) em cada canal de voz/vídeo, e um **cronómetro da sessão de chamada** (enquanto houver alguém na mesa, mesmo com a lista vazia). A ocupação vive no **servidor** (SQLite + WS), não na grade nem só no LiveKit do cliente. A sessão LiveKit **sobe para o shell** para sobreviver à navegação para texto; clicar noutro canal de voz **move** a mesa.

## Technical Context

**Language/Version**: Rust 2021 (Axum); TypeScript ~5.8 / SolidJS 1.9 (SPA).

**Primary Dependencies**: Axum + sqlx SQLite + WS hub existentes; frontend `Sidebar`, `AppShell`, `VoiceChannel`, `liveClient` (LiveKit). Sem BFF.

**Storage**: SQLite — tabela `voice_occupant` + `channel.voice_session_started_at`. Ritmo de heartbeat em processo (opcional) alinhado à linha SQLite.

**Testing**: `cargo test --test contract` (ocupação, sessão, mídia, leave, move); `npx tsc --noEmit`; [quickstart.md](./quickstart.md) com duas contas.

**Target Platform**: Browser + único processo Axum (LAN/produção como hoje).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: SC-001/006/007 — outros membros vêem join/leave/mídia/move em **&lt;3 s**; cronómetro **±2 s**.

**Constraints**: FR-001–015; sem BFF; chaves E2EE/localStorage intocadas; painel Membros 008/019 intocado; sem ícones de a falar/anfitrião/AFK.

**Scale/Scope**: Uma instância, grupo pequeno; uma chamada de voz por conta.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests de ocupação + tsc + quickstart |
| Complexity Tracking | Vazio (contexto de sessão no shell é necessário para FR-014, não um 4.º processo) |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos REST/WS + UI; modelo SQLite mínimo; sessão LiveKit no shell (não um serviço extra). Sem BFF. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/028-voice-call-roster/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── voice-occupancy.md
│   └── voice-session-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0008_voice_occupancy.sql    # NOVO
backend/src/
├── domain/voice_occupancy.rs                 # NOVO
├── db/voice_occupancy.rs                     # NOVO
├── api/voice.rs                              # ALTERAR — join upsert; leave; media; heartbeat
├── api/mod.rs                                # rotas leave/media + GET occupancy
└── tests/contract/voice_occupancy.rs         # NOVO

frontend/src/
├── voice/VoiceSession.tsx                    # NOVO — contexto LiveKit + ocupação local
├── shell/AppShell.tsx                        # barra «ainda na mesa» + Sair / voltar
├── shell/Sidebar.tsx                         # lista aninhada + timer
├── pages/VoiceChannel.tsx                    # não desligar no unmount; usar contexto
├── pages/ChannelRoute.tsx                    # ao abrir outro voice: move
├── App.tsx                                   # provider da sessão
└── styles/mesa-theme.css                     # nested roster + connected bar
```

**Structure Decision**: Occupancy no Axum (fonte de verdade para a coluna). UI de sessão no `AppShell` para FR-014. `VoiceChannel` passa a ser a vista da mesa, não o dono exclusivo da ligação LiveKit.

## Complexity Tracking

> Vazio — o contexto de sessão no shell é o mínimo para permanecer na chamada em texto.
