# Implementation Plan: Alinhamento Visual com Discord

**Branch**: `037-discord-visual-alignment` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-discord-visual-alignment/spec.md`

## Summary

Alinhar a Mesa ao polish visual do Discord **sem** mudar marca (nome, accent roxo, shell) nem fluxos core: (1) tipografia self-hosted consistente cross-OS; (2) glifos **preenchidos** nos 3 controlos de chamada + indicadores na barra de servidores (**unread** real por canal + **voz** coexistente); (3) token único de elevação tema-aware para menus flutuantes; (4) entrada suave de menus com `prefers-reduced-motion`. O maior trabalho de produto/dados é persistir **estado de leitura** (hoje só existe um `Set` em memória no FE para o sino do topbar).

## Technical Context

**Language/Version**: Rust 2021 (Axum); TypeScript ~5.8 / SolidJS 1.9; CSS tokens (`nocturne.css` + `mesa-theme.css`).

**Primary Dependencies**: Vite asset pipeline / `@font-face`; ícones stroke em `frontend/src/components/icons/*`; `ServerRail` + `Sidebar`; `GET/POST /api/channels/{id}/messages` + WS `message.new`; `GET /api/servers/{id}/voice-occupancy` + WS `voice.occupancy`; SQLite via sqlx migrations.

**Storage**: Nova tabela `channel_read_state` (account × channel → cursor de leitura). Sem mudança de schema de `message` / `voice_occupant`.

**Testing**: Contract tests para mark-read + listagem agregada unread; `cargo test --test contract`; `npx tsc --noEmit`; validação visual [quickstart.md](./quickstart.md).

**Target Platform**: Browser moderno + Axum (igual features 028–036).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Mark-read e agregação unread por servidor &lt; 100 ms p95 em mesas pequenas (≤20 canais); fontes com `font-display: swap` sem FOIT; animações de menu ≤ ~150 ms.

**Constraints**: FR-001–013 + clarificações 2026-09-06 (unread real, qualquer msg de texto, pill sem número, unread∥voz, glifos filled / chrome intacto); não alterar `#161826` nem roles/cores por utilizador; não redesenhar call bar Discord-completa; animações de speaking/e2ee intactas (FR-010).

**Scale/Scope**: Shell inteiro (tipografia); 3 ícones de chamada; rail de servidores; 4+ menus flutuantes; 1 migração + APIs de leitura; resumo de voz cross-server para a rail.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract read-state + tsc + quickstart visual |
| Complexity Tracking | Ver tabela abaixo (justificação unread BE) |

**Gate: PASS** (complexidade justificada)

### Re-check pós-Phase 1

Design localizado: tokens CSS + ícones FE + migração/`channel_read_state` + campos/endpoints de actividade na rail. Sem BFF novo, sem mudança de LiveKit. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/037-discord-visual-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── typography-elevation-motion.md
│   ├── call-control-filled-glyphs.md
│   ├── server-rail-activity.md
│   └── channel-read-state-api.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0010_channel_read_state.sql
backend/src/db/read_state.rs                 # get/upsert last_read; aggregate unread servers
backend/src/api/messages.rs                  # PATCH/PUT mark-read; opcional embed no list
backend/src/api/servers.rs                   # list_servers (+ activity) ou endpoint dedicado
backend/src/api/voice.rs                     # resumo voice-active servers (ou query agregada)
backend/tests/contract/…                     # read_state + rail activity

frontend/public/fonts/                       # ou src/assets/fonts — Inter woff2
frontend/src/styles/nocturne.css             # --font-*, --shadow-float light/dark, weights
frontend/src/styles/mesa-theme.css           # rail pills, menu enter, reduced-motion, shadow unify
frontend/index.html                          # preload font opcional
frontend/src/components/icons/IconMic.tsx    # variantes filled
frontend/src/components/icons/IconCamera.tsx
frontend/src/components/icons/IconPhoneHangup.tsx
frontend/src/pages/VoiceChannel.tsx          # usar filled nos call-controls
frontend/src/shell/ServerRail.tsx            # unread pill + voice indicator
frontend/src/shell/Sidebar.tsx / App.tsx     # feed activity; mark-read ao abrir canal
frontend/src/preferences/notifications.ts   # alinhar / não duplicar inconsistente com BE
```

**Structure Decision**: Tipografia/elevação/motion e ícones filled são só FE. Unread + voz na rail exigem BE (cursor persistente + agregação) e FE (`ServerRail` props). Reutilizar `message.new` / `voice.occupancy` para actualizar sinais em tempo quase real.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Nova tabela + API de read-state | Spec clarificou tracking real de unread (não só CSS) | Set em memória do topbar não sobrevive a refresh nem multi-device e não alimenta a rail |
| Endpoint/agregação voice cross-server | FR-013 precisa voz na rail de **todos** os servidores | `voice-occupancy` só do servidor seleccionado não basta |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
