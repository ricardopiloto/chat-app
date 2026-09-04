# Implementation Plan: Fase 2 — Cenas de câmera trocáveis

**Branch**: `003-fase-2-cenas` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-fase-2-cenas/spec.md`

## Summary

Estender o canal de voz/vídeo da Fase 1 para **várias composições nomeadas (cenas)** no mesmo canal, trocáveis ao vivo sem derrubar a chamada. O mapa único `grid_slot` vira uma cena (migrada como “Cena padrão”); quem administra o canal copia o quadro visível ou duplica qualquer cena, edita mapas e ativa; co-diretores só ativam. A grade que o cliente de vídeo já renderiza continua a ser o mapa da **cena ativa**. Proteção ponta-a-ponta permanece sempre ligada — sem Egress, sem interruptor de E2EE.

## Technical Context

**Language/Version**: Rust (stable, backend) + TypeScript (frontend SPA, Vite) — herdado da Fase 1

**Primary Dependencies**: `axum`, `sqlx` (SQLite), `livekit-api` / `livekit-client`, SolidJS — sem dependência nova de mídia. Cenas são metadados de layout, não um segundo SFU.

**Storage**: SQLite via `sqlx`. Nova migration: tabelas `scene`, `scene_slot`, `channel_role`; `channel.active_scene_id`; dados atuais de `grid_slot` copiados para a cena padrão. Sem Postgres.

**Testing**: `cargo test` — contratos REST/WS (CRUD de cenas, recusa de apagar ativa, permissões de co-diretor, `grid.updated` no activate). Validação ao vivo (troca &lt;3s, A/V não cai) é manual via [quickstart.md](./quickstart.md), dois perfis de navegador, como na Fase 1.

**Target Platform**: Mesmo da Fase 1 — servidor Linux, cliente navegador Chromium/Firefox.

**Project Type**: Aplicação web (`backend/` + `frontend/` + `infra/`). Sem Tauri.

**Performance Goals**: Troca de cena visível em todos os clientes da chamada em menos de 3s (SC-002). Fluxo “copiar quadro + ativar segunda cena” em menos de 2min (SC-001). Sem meta de req/s.

**Constraints**: 2–4 slots por cena; um slot por conta; E2EE sempre on (FR-009); criar/duplicar não ativa; apagar ativa recusado; co-diretor não CRUD nem delega. Sem gravação/exportação no servidor.

**Scale/Scope**: Grupo pequeno (mesa). Teto de **32 cenas por canal** (guarda-chuva operacional, não um FR de produto). Uma instância, canais `voice_video` já existentes precisam migrar sem perder o layout.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` continua o **template** não ratificado. A spec assume o mesmo: não impõe TDD nem stack extra.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — não ratificados |
| Test-first obrigatório | N/A — `cargo test` de contrato/domínio + quickstart manual |
| Library-first / CLI | N/A |
| Complexity Tracking | Não preenchido |

**Gate: PASS.** Ratificar a constituição continua fora desta feature.

### Re-check pós-Phase 1

`data-model.md`, `contracts/` e `quickstart.md` não introduzem Egress, desligar E2EE, Postgres, federação nem cliente nativo. Continuam no recorte da spec. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/003-fase-2-cenas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
├── checklists/
└── tasks.md             # /speckit-tasks — NÃO criado aqui
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/                # + scenes.rs, channel_roles.rs; grid.rs passa a ler/escrever a cena ativa
│   ├── domain/             # + scene.rs; permissions.rs (is_co_director)
│   ├── db/                 # + scene.rs, channel_role.rs
│   └── ws/                 # grid.updated + scene.changed
├── migrations/             # 0003_scenes.sql (nome exacto na implementação)
└── tests/
    ├── contract/           # cenas, co-diretor, recusa DELETE ativa, sem toggle E2EE
    └── integration/

frontend/
├── src/
│   ├── pages/VoiceChannel.tsx    # lista/ativa cenas; grade continua CameraGrid
│   ├── components/               # SceneList / SceneSwitcher; GridAdmin edita a cena activa (ou inativa escolhida)
│   └── api/client.ts             # tipos Scene + channel roles

infra/                      # inalterado (LiveKit + TURN)
```

**Structure Decision**: Continua a web app da Fase 1. Cenas são tabelas + REST + eventos WS; o cliente de vídeo **não** troca de sala LiveKit ao ativar uma cena — só o mapa de slots na página.

## Complexity Tracking

> Sem constituição vigente. Divergência deliberada de `docs/arquitetura-tecnica.md` (Egress / E2EE-off por canal): **fora desta fase**, por clarificação da spec (Q1). Documentado em [research.md](./research.md) D7.

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md)
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)
