# Implementation Plan: Spike Fase 0 — Viabilidade da Chamada

**Branch**: `001-fase-0-spike` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fase-0-spike/spec.md`

## Summary

Spike **descartável** para go/no-go das premissas de mídia do MVP: LiveKit self-hosted, cliente Tauri 2 + `livekit-client` (JS) com grade 2×2 (4 slots: `alice`/`bob`), NAT via hotspot + TURN embutido, TokenSvc Rust (`livekit-api` + axum) sem expor o secret, round-trip E2EE no WebKitGTK, RAM idle do cliente < 1 GB.

Onda 1 (US1–3) destrava “a chamada funciona”. Onda 2 (US4–6) é obrigatória antes de congelar TokenSvc e E2EE-por-padrão. Código em `spike/`, não no binário de produto.

## Technical Context

**Language/Version**: Rust (stable via rustup) no shell Tauri e no token service; TypeScript (Vite) na SPA do webview.

**Primary Dependencies**: LiveKit Server (Docker); `livekit-client` (npm); Tauri 2; crate `livekit-api`; axum; TURN embutido do LiveKit na US3.

**Storage**: Nenhum banco. Config em `spike/infra/livekit.yaml`; mapa de slots estático no cliente.

**Testing**: Validação manual segundo [quickstart.md](./quickstart.md). `cargo test` só no token (contrato JWT / secret ausente na resposta). Sem E2E de browser.

**Target Platform**: Fedora Linux desta máquina (WebKitGTK 4.1 / Tauri 2). Windows/macOS fora (gap de E2EE).

**Project Type**: Spike desktop + stub HTTP + Compose (não o monorepo do produto).

**Performance Goals**: Cliente idle RSS < 1024 MB (go/no-go). Em chamada e LiveKit/token = baseline.

**Constraints**: Código descartável; secret LiveKit só no servidor; túnel não substitui hotspot; E2EE = round-trip no webview Tauri, não no Chrome do host; UI pode ser feia.

**Scale/Scope**: Uma sala `spike-room`, dois participantes mapeados, quatro slots. Sem multi-tenant, auth, persistência.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o **template** (princípios placeholder, sem versão ratificada).

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — não ratificados |
| Test-first obrigatório | N/A — não ratificado; spike usa validação manual + 1 contrato de token |
| Library-first / CLI | N/A |
| Complexity Tracking | Não preenchido (sem violação de constituição vigente) |

**Gate: PASS** (nada a violar). Ratificar constituição **antes do MVP**, não como bloqueio deste spike.

### Re-check pós-Phase 1

Contratos (`token-api.yaml`, grade, relatório) e data-model não introduzem persistência, auth de produto nem binário único. Continua **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/001-fase-0-spike/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── token-api.yaml
│   ├── grid-layout.json
│   └── go-no-go-report.md
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks — ainda não
```

Relatório de execução (futuro): `specs/001-fase-0-spike/results.md`.

### Source Code (repository root)

```text
spike/
├── infra/
│   ├── docker-compose.yml      # já existe
│   └── livekit.yaml            # já existe; TURN off até US3
├── client/                     # Tauri 2 + Vite vanilla TS (a criar)
│   ├── src/                    # UI: join, grade 2×2, probe E2EE
│   ├── src-tauri/              # shell Rust
│   └── package.json
├── token/                      # axum + livekit-api (a criar)
│   ├── Cargo.toml
│   └── src/main.rs
└── scripts/
    └── measure-ram.sh
```

**Structure Decision**: Tudo sob `spike/`, separado de um futuro `src/` de produto. Três peças (infra, client, token) espelham SFU + UI + TokenSvc sem fingir o binário único do MVP.

## Complexity Tracking

> Sem violações de constituição vigente — tabela omitida.

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md) — sem NEEDS CLARIFICATION em aberto.
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)

## Approach (para `/speckit-tasks`)

### Onda 1 — chamada funciona

1. Pré-requisitos host: Docker (grupo `docker`), rustup, Node LTS, deps Tauri Fedora (`webkit2gtk4.1-devel`, etc.).
2. `docker compose up` em `spike/infra`; `curl` na 7880.
3. Dois joins com cliente de exemplo LiveKit (isola SFU vs. nosso cliente).
4. Scaffold `spike/client` (Tauri 2 vanilla TS) + `livekit-client`: getUserMedia, join `spike-room`, pub/sub A/V. Onda 1 pode mintar token com `lk` ou secret local **só nesta onda**.
5. Grade 2×2 conforme [contracts/grid-layout.json](./contracts/grid-layout.json).
6. US3: port-forward + `turn.enabled` + `use_external_ip`; segundo cliente no **hotspot**; registrar ICE/TURN. Sem hotspot ou sem IP público = `bloqueio_ambiente`, não túnel.
7. Medir RAM (pode ficar para o script da Onda 2; números da Onda 1 são bem-vindos).

### Onda 2 — congela arquitetura

8. `spike/token` segundo [contracts/token-api.yaml](./contracts/token-api.yaml); secret só em env.
9. Cliente deixa de carregar secret; só `POST /token`.
10. Probe Encoded Transform + E2EE `ExternalE2EEKeyProvider` no **webview Tauri**; fallback XOR só para diagnóstico. Gap Win/mac no relatório.
11. `measure-ram.sh` idle vs. chamada; corte 1 GB idle.
12. `results.md` nas duas seções do contrato de relatório.

Não copiar `spike/` para produção. Decisão de framework UI do MVP permanece aberta.
