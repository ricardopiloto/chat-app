# Implementation Plan: Botões «+» para criar servidor e canal

**Branch**: `007-shell-create-plus` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-shell-create-plus/spec.md`

## Summary

Substituir CTAs textuais «Criar servidor» / «Criar canal» por «+» no **fundo do rail** e «+» nos labels **Texto** / **Voz e vídeo** (só dono; tipo implícito). Create-server passa a **aprovisionar texto+voz** com **custódia** da chave do voz. Delete rejeita o **último canal de cada tipo**. No voz: UX de **uma cena** — ocultar multi-cena; **manter Editar cena** na activa. Validar CSS do tema Mesa. Multi-cena completa → backlog G10.

## Technical Context

**Language/Version**: TypeScript (SolidJS SPA) + Rust 2021 (Axum) — herdado.

**Primary Dependencies**: SolidJS, Vite, mesa-theme CSS; sqlx/SQLite; crypto/custódia de chave de canal já na 006; LiveKit inalterado nesta feature.

**Storage**: SQLite — **sem** migração nova prevista; invariantes enforceadas em handlers.

**Testing**: `cargo test` (create-server bootstrap, delete last-of-type); `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser desktop + telemóvel (HTTPS/LAN).

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC-006 load UI ≤5s rede local; SC-008 «+» do rail sempre visível.

**Constraints**: ≥1 texto + ≥1 voz por servidor; create-server exige custódia; sem UI multi-cena; APIs de cenas multi podem ficar; theme CSS válido.

**Scale/Scope**: Shell (ServerRail, Sidebar), VoiceChannel (SceneList off), `POST /servers` extendido, `DELETE /channels` tighten; 3 contratos UI/API.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — testes Rust + quickstart manual |
| Complexity Tracking | Vazio — mudanças localizadas, sem novos sistemas |

**Gate: PASS**

### Re-check pós-Phase 1

Modelo sem schema novo; contratos cobrem bootstrap, last-of-type, shell/voz UI. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/007-shell-create-plus/
├── plan.md              # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── create-server-bootstrap.md
│   ├── delete-channel-last-of-type.md
│   └── shell-plus-ui.md
├── checklists/
└── tasks.md             # /speckit-tasks — NOT created here
```

### Source Code (repository root)

```text
frontend/src/
├── styles/mesa-theme.css       # rail sticky-plus; section +; CSS validity
├── shell/
│   ├── ServerRail.tsx          # + fixo no fundo; callback onCreate
│   ├── Sidebar.tsx             # section +; remove textual CTAs; create-server custody
│   └── AppShell.tsx            # wiring se necessário
├── pages/
│   └── VoiceChannel.tsx        # hide SceneList; Editar cena → active scene
└── components/
    └── SceneList.tsx           # unused in voice chrome (may remain for G10)

backend/src/
├── api/servers.rs              # bootstrap text+voice + custody body
├── api/channels.rs             # last_channel_of_type on delete
└── db/channel.rs               # count_by_server_and_type (helper)
```

**Structure Decision**: Monólito existente frontend/ + backend/; sem novos packages.

## Complexity Tracking

> Sem violações a justificar.
