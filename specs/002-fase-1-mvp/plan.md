# Implementation Plan: Fase 1 — MVP (cliente web)

**Branch**: `002-fase-1-mvp` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fase-1-mvp/spec.md`

## Summary

Entregar o primeiro produto usável: uma Instância de Hospedagem self-hosted (backend Rust/axum + SQLite) servindo um cliente web (SPA TypeScript) que permite criar a primeira conta sem convite, convidar mais gente, conversar por texto em Servidores/Canais e fazer chamada de vídeo com grade de câmeras fixas (2–4 slots) via LiveKit self-hosted — tudo protegido de ponta a ponta por padrão, sem que o operador da instância consiga ler mensagens nem mídia em claro. Reaproveita as premissas técnicas validadas no spike Fase 0 (LiveKit self-hosted, TokenSvc Rust que nunca expõe o secret, E2EE via Web Crypto + Insertable Streams no navegador) e as reimplementa como produto (não copia `spike/`).

## Technical Context

**Language/Version**: Rust (stable, backend) + TypeScript (frontend SPA, build via Vite)

**Primary Dependencies**: `axum` (HTTP + WebSocket hub), `sqlx` (SQLite, async, migrations), `argon2` (hash de senha), `livekit-api` (emissão de JWT LiveKit sem expor o secret — validado no spike), `livekit-client` (SDK JS/TS do navegador, publish/subscribe de mídia), SolidJS (framework de UI leve, reativo, sem VDOM) + Vite no frontend, `libsodium`/`@noble/curves` (ou equivalente Web Crypto) para o par de chaves de identidade e o handoff de chave do Servidor no cliente.

**Storage**: SQLite embutido (arquivo único por Instância), acessado via `sqlx`. Sem Postgres nesta fase — a abstração de repository plugável do documento de arquitetura fica adiada até haver necessidade real (YAGNI); metadados estruturais em claro, corpo de mensagem e chave de mídia sempre como ciphertext opaco ao servidor.

**Testing**: `cargo test` no backend (contratos HTTP/WS, regras de domínio: convite único-uso-de-cadastro, isolamento entre Servidores, cálculo do "primeiro slot vazio"). Validação end-to-end multi-navegador é manual, guiada por [quickstart.md](./quickstart.md) (mesmo padrão do spike Fase 0) — automação de dois contextos de navegador (Playwright) fica como melhoria futura, não bloqueia o done desta fase.

**Target Platform**: Servidor Linux (a instância do operador). Cliente: navegador desktop das famílias Chromium/Firefox (Gecko) — únicas com Insertable Streams/Encoded Transforms validadas no spike Fase 0 nesta máquina. Safari/WebKit (macOS) e navegadores Windows continuam gap explícito (não bloqueiam o done, que é Linux/web — US5, FR-016).

**Project Type**: Aplicação web (backend + frontend separados; sem o binário único cliente/servidor dual-mode do documento de arquitetura — dispensado porque o cliente desta fase é só navegador, não o shell Tauri).

**Performance Goals**: Instância publicável e respondendo no navegador em <30min de operação documentada (SC-001). Fluxo conta→convite→primeira mensagem <10min (SC-002). Fluxo entrar no canal de vídeo→ver/ouvir com slots fixos <5min (SC-003). Sem meta de req/s formal — escala é grupos pequenos (mesa de RPG/amigos), não SaaS multiusuário.

**Constraints**: E2EE ligado por padrão em texto, voz e vídeo, sem opção de desligar nesta fase (FR-015). O cliente nunca carrega o secret de administração do LiveKit (FR-014 — herdado do TokenSvc do spike). Cadastro aberto só quando a instância não tem nenhuma conta; depois, só via convite (FR-002). Grade de vídeo fixa em 2–4 slots, uma fonte de A/V por conta (FR-009, FR-010).

**Scale/Scope**: Uma Instância isolada (sem federação), múltiplos Servidores por instância, poucas contas por Servidor (grupo pequeno). Cenário de teste de isolamento: ≥3 contas, 2 Servidores (SC-007).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` continua o **template** não ratificado (mesmo estado registrado no plan do spike Fase 0). A própria spec já assume isso: *"a constituição do repositório ainda é o modelo não ratificado; não impõe TDD nem stack além do que esta spec e o brief já delimitam"*.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — não ratificados |
| Test-first obrigatório | N/A — não ratificado; testes de contrato/domínio no backend (`cargo test`) + validação manual multi-navegador via quickstart |
| Library-first / CLI | N/A |
| Complexity Tracking | Não preenchido (nenhuma constituição vigente para violar) |

**Gate: PASS** (nada a violar). Ratificar a constituição continua fora do escopo desta feature — não bloqueia a Fase 1.

### Re-check pós-Phase 1

`data-model.md`, `contracts/` e `quickstart.md` não introduzem federação, Postgres, nem o shell desktop — mantêm o recorte assumido no Technical Context. Continua **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/002-fase-1-mvp/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.rs                 # bootstrap: config, DB pool, router, WS hub
│   ├── api/                    # handlers REST: auth, servers, channels, invites, messages, voice
│   ├── ws/                     # hub WebSocket (message.new, presence.update, invite.consumed)
│   ├── domain/                 # regras: Instância>Servidor>Canal, convites, primeiro-slot-vazio, permissões
│   ├── token/                  # emissão de JWT LiveKit (evolução do spike/token; secret só aqui)
│   └── db/                     # sqlx models + queries
├── migrations/                 # schema SQLite (sqlx migrate)
└── tests/
    ├── contract/                # request/response de cada endpoint REST/WS
    └── integration/              # fluxos de domínio (convite sem histórico, isolamento entre Servidores, etc.)

frontend/
├── src/
│   ├── pages/                  # login/cadastro, lista de Servidores, canal de texto, canal de vídeo
│   ├── components/             # grade de câmeras, lista de canais, composer de mensagem
│   ├── crypto/                 # chave de identidade (client-only), handoff da chave do Servidor, cifra/decifra
│   ├── video/                  # integração livekit-client, aplicação do E2EE nos tracks, grid layout
│   └── api/                    # cliente REST + conexão WebSocket
├── index.html
├── vite.config.ts
└── package.json

infra/
├── docker-compose.yml          # LiveKit self-hosted (+ TURN) + backend, para o operador subir a instância
├── livekit.yaml
└── .env.example
```

**Structure Decision**: Web application (Option 2) com `backend/` (Rust/axum, dono da API REST + hub WebSocket + emissão de token LiveKit + SQLite) e `frontend/` (SPA TypeScript/SolidJS, único cliente desta fase) como projetos irmãos na raiz — mesma separação de responsabilidades do spike (`token/` vs `client/`), agora como produto real, mais `infra/` para o operador subir LiveKit + backend. Não há shell Tauri nesta fase (adiado para o port nativo).

## Complexity Tracking

> Sem constituição vigente para violar — tabela omitida. A única divergência deliberada do documento de arquitetura (`docs/arquitetura-tecnica.md`) é a ausência da abstração de repository/Postgres e do binário único dual-mode nesta fase; motivo documentado em [research.md](./research.md) (decisões D1 e D6), não uma violação de princípio.

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md) — decisões que fecham as lacunas técnicas deixadas em aberto por `docs/arquitetura-tecnica.md` §8.
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)
