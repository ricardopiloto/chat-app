# Implementation Plan: Iconografia e Tipografia do Shell

**Branch**: `012-shell-iconography-typography` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-shell-iconography-typography/spec.md`

## Summary

Substituir os glifos de texto/Unicode soltos do shell (`▸`, `+`, `☰`, rótulos de chamada, chip/banner E2EE) por um pequeno sistema de ícones SVG inline próprio (sem nova dependência npm), reforçar a hierarquia tipográfica (peso por nível de heading + tipo de letra monoespaçado para valores copiáveis), e tornar a barra superior funcional: pesquisa restrita ao que o utilizador já tem acesso, notificações derivadas de eventos WebSocket já recebidos, e definições que consolidam tema + sessão numa única superfície — tudo no cliente, sem tocar no backend (Rust/SQLite intocados).

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend apenas; backend Rust 2021 (Axum) não é tocado por esta feature.

**Primary Dependencies**: `solid-js`, `@solidjs/router`, utilitários de cripto já existentes (`crypto/keyHandoff.ts`, `crypto/channelKey.ts`, `crypto/serverKey.ts`) para decifrar mensagens durante a pesquisa. Nenhuma dependência nova: o sistema de ícones é um pequeno conjunto de componentes SVG inline próprios (ver [research.md](./research.md)).

**Storage**: Sem migração SQLite. Estado novo é todo client-side: sinais SolidJS em memória (notificações, pesquisa) e, no máximo, `localStorage` para preferência de painel de definições aberto/fechado (padrão já usado em `preferences/uiPrefs.ts`).

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual via [quickstart.md](./quickstart.md). Sem `cargo test` — nenhum handler Rust é alterado.

**Target Platform**: Browser desktop + telemóvel, temas claro/escuro existentes, incluindo o layout drawer/narrow (<900px) já presente no shell.

**Project Type**: Web app — mudanças confinadas a `frontend/`; `backend/` fica intocado (FR-013).

**Performance Goals**: Pesquisa não deve bloquear a UI — resultados progressivos por canal à medida que chegam, alvo de resposta perceptível <1s para o canal atualmente aberto e sem "jank" visível ao alternar estados de ícone (mic/câmara) em <100ms.

**Constraints**: Zero endpoints/schema novos no backend (FR-013); todo ícone com nome acessível (FR-007); largura de botão de chamada estável entre estados (FR-004); rótulos de chamada num único idioma (FR-003); ícones legíveis em ambos os temas (FR-012); pesquisa nunca devolve conteúdo fora dos servidores/canais em que o utilizador é membro (FR-014).

**Scale/Scope**: ~13 componentes de ícone novos; 2 ficheiros CSS com tokens novos (`--font-mono`, pesos de heading); `TopBar.tsx` reescrito (pesquisa/notificações/definições); `SettingsPanel` novo (via `Dialog` existente); `Sidebar.tsx`, `VoiceChannel.tsx`, `Channel.tsx` com trocas pontuais de glifo→ícone; 3 contratos de UI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado (placeholders por preencher, como nas specs 002–011 anteriores).

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — constituição não ratificada |
| Test-first | N/A — projeto frontend não tem suite automatizada; segue convenção `tsc --noEmit` + quickstart já usada em 007/008/009 |
| Complexity Tracking | Vazio — troca de glifos, tokens CSS e funcionalidades client-side sobre endpoints/eventos já existentes |

**Gate: PASS**

### Re-check pós-Phase 1

Nenhum schema novo; nenhum endpoint novo; contratos cobrem sistema de ícones, funções da topbar e tokens tipográficos sem introduzir estado persistido no servidor. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/012-shell-iconography-typography/
├── plan.md              # Este ficheiro
├── research.md          # Fase 0
├── data-model.md         # Fase 1
├── quickstart.md         # Fase 1
├── contracts/
│   ├── icon-system.md
│   ├── topbar-functions.md
│   └── typography-tokens.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   └── icons/                     # NOVO — IconVoiceChannel, IconMic(On/Off), IconCamera(On/Off),
│                                   #        IconPhoneHangup, IconLock(Closed/Warning), IconSearch,
│                                   #        IconBell, IconSettings, IconPlus, IconMenu
│   └── SettingsPanel.tsx           # NOVO — consolida tema + sessão (usa Dialog existente)
├── shell/
│   ├── TopBar.tsx                  # + pesquisa, notificações, definições (ícones); remove theme-seg solto
│   └── Sidebar.tsx                 # prefixo "▸" → IconVoiceChannel; "+" → IconPlus
├── pages/
│   ├── VoiceChannel.tsx            # controlos de chamada → ícone+rótulo fixo; chip/banner E2EE → IconLock
│   └── Channel.tsx                 # chip E2EE do canal de texto → IconLock
├── preferences/
│   └── notifications.ts            # NOVO — estado de atividade não vista por canal (em memória, por sessão)
└── styles/
    ├── nocturne.css                 # + --font-mono; pesos de heading por nível
    └── mesa-theme.css               # .key-display, .members-handle, código de convite → monospace;
                                      #   classes para botões de ícone da topbar e badge de notificação

backend/            # Intocado (FR-013)
```

**Structure Decision**: Frontend-only. Nenhum ficheiro em `backend/` é alterado; a pesquisa e as notificações reutilizam endpoints REST e eventos WebSocket já existentes e documentados no `README.md`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md) — decisões: sistema de ícones, tipo de letra monoespaçado, âmbito/algoritmo da pesquisa, modelo de notificações, superfície de definições, hierarquia tipográfica
- [data-model.md](./data-model.md) — catálogo de ícones, `NotificationState`, `SearchState`, tokens tipográficos
- [contracts/](./contracts/) — sistema de ícones, funções da topbar, tokens de tipografia
- [quickstart.md](./quickstart.md) — validação manual ponta-a-ponta
