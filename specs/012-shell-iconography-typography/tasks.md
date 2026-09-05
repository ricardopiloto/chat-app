---
description: "Task list for Iconografia e Tipografia do Shell"
---

# Tasks: Iconografia e Tipografia do Shell

**Input**: Design documents from `/specs/012-shell-iconography-typography/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Sem alterações Rust — `backend/` não é tocado (FR-013).

**Organization**: Setup (base de ícones + tokens tipográficos) → Foundational (catálogo de ícones concretos, bloqueia US1/US2) → US1 (chamada + E2EE, P1, MVP) → US2 (navegação + topbar funcional, P2) → US3 (monoespaçada, P3, independente de ícones) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/icons/`, `frontend/src/components/`, `frontend/src/shell/`, `frontend/src/pages/`, `frontend/src/preferences/`, `frontend/src/styles/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Base do sistema de ícones e tokens tipográficos, per [contracts/icon-system.md](./contracts/icon-system.md) e [contracts/typography-tokens.md](./contracts/typography-tokens.md).

- [X] T001 [P] Create shared icon wrapper (`IconProps { size?, title?, class? }`, defaults `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.75"`) in `frontend/src/components/icons/Icon.tsx`
- [X] T002 [P] Add `--font-mono` token (system monospace stack) to `frontend/src/styles/nocturne.css` per [contracts/typography-tokens.md](./contracts/typography-tokens.md)
- [X] T003 [P] Change `--font-heading-weight` from single global value to per-level (`h1,h2,h3 { font-weight: 650 }`, `h4,h5,h6 { font-weight: 500 }`) in `frontend/src/styles/nocturne.css` per [contracts/typography-tokens.md](./contracts/typography-tokens.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Catálogo de componentes de ícone concretos sobre a base (T001) — **bloqueia US1 e US2**. US3 (tipografia) não depende desta fase.

**⚠️ CRITICAL**: US1 e US2 MUST wait for this phase.

- [X] T004 [P] Implement `IconMicOn` / `IconMicOff` in `frontend/src/components/icons/IconMic.tsx` (uses T001)
- [X] T005 [P] Implement `IconCameraOn` / `IconCameraOff` in `frontend/src/components/icons/IconCamera.tsx` (uses T001)
- [X] T006 [P] Implement `IconPhoneHangup` in `frontend/src/components/icons/IconPhoneHangup.tsx` (uses T001)
- [X] T007 [P] Implement `IconLockClosed` / `IconLockWarning` in `frontend/src/components/icons/IconLock.tsx` (uses T001)
- [X] T008 [P] Implement `IconVoiceChannel` in `frontend/src/components/icons/IconVoiceChannel.tsx` (uses T001)
- [X] T009 [P] Implement `IconPlus` in `frontend/src/components/icons/IconPlus.tsx` (uses T001)
- [X] T010 [P] Implement `IconMenu` in `frontend/src/components/icons/IconMenu.tsx` (uses T001)
- [X] T011 [P] Implement `IconSearch` in `frontend/src/components/icons/IconSearch.tsx` (uses T001)
- [X] T012 [P] Implement `IconBell` in `frontend/src/components/icons/IconBell.tsx` (uses T001)
- [X] T013 [P] Implement `IconSettings` in `frontend/src/components/icons/IconSettings.tsx` (uses T001)

**Checkpoint**: Todos os componentes de ícone do catálogo ([data-model.md](./data-model.md#catálogo-de-ícones-componente-por-linha-frontendsrccomponentsicons)) renderizam, aceitam `title`/`aria-label` per [contracts/icon-system.md](./contracts/icon-system.md); `tsc` limpo.

---

## Phase 3: User Story 1 - Reconhecer estado da chamada e da encriptação sem ler texto (Priority: P1) 🎯 MVP

**Goal**: Controlos de chamada (microfone/câmara/sair) e indicador de E2EE (chip + banner) comunicam estado por ícone, com rótulo fixo num só idioma e largura de botão estável.

**Independent Test**: [quickstart.md](./quickstart.md) §2–3 — alternar mic/câmara várias vezes; observar chip/banner E2EE.

### Implementation for User Story 1

- [X] T014 [US1] Replace microphone button markup in `frontend/src/pages/VoiceChannel.tsx`: usar `IconMicOn`/`IconMicOff` (T004) + rótulo fixo "Microfone" (remover o texto "Mic off"); `aria-label` do botão muda com o estado
- [X] T015 [US1] Replace camera button markup in `frontend/src/pages/VoiceChannel.tsx`: usar `IconCameraOn`/`IconCameraOff` (T005) + rótulo fixo "Câmara" (remover o texto "Cam off"); `aria-label` do botão muda com o estado
- [X] T016 [US1] Add `IconPhoneHangup` (T006) ao botão "Sair" em `frontend/src/pages/VoiceChannel.tsx`
- [X] T017 [US1] Fix `.call-controls .btn` min-width in `frontend/src/styles/mesa-theme.css` para que a largura não varie entre estados ligado/desligado (FR-004)
- [X] T018 [P] [US1] Add `IconLockClosed` (T007) ao `.e2ee-chip` (canal de texto) in `frontend/src/pages/Channel.tsx`
- [X] T019 [US1] Add `IconLockClosed`/`IconLockWarning` (T007) ao `.e2ee-chip` e `.e2ee-banner` (estados activo/aviso) in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: Chamada e E2EE reconhecíveis por ícone sem ler texto; [quickstart.md](./quickstart.md) §2–3 passam.

---

## Phase 4: User Story 2 - Distinguir canais e navegar o shell por reconhecimento visual (Priority: P2)

**Goal**: Canais de voz, criar canal e menu usam ícone em vez de carácter cru; topbar ganha pesquisa (âmbito = servidores/canais do utilizador), notificações (eventos WS já recebidos) e definições (consolida tema + sessão), per [contracts/topbar-functions.md](./contracts/topbar-functions.md).

**Independent Test**: [quickstart.md](./quickstart.md) §1, §4, §5, §6.

### Implementation for User Story 2

- [X] T020 [US2] Replace `▸` prefix with `IconVoiceChannel` (T008) na lista de canais de voz em `frontend/src/shell/Sidebar.tsx`
- [X] T021 [P] [US2] Replace `+` text with `IconPlus` (T009) nos botões de criar canal em `frontend/src/shell/Sidebar.tsx`
- [X] T022 [P] [US2] Replace `☰` text with `IconMenu` (T010) no botão `menu-toggle` em `frontend/src/shell/TopBar.tsx`
- [X] T023 [P] [US2] Create `NotificationState` (`unseenByChannel` Map, `markSeen`/`markUnseen`) em `frontend/src/preferences/notifications.ts` per [data-model.md](./data-model.md#notificationstate-cliente-em-memória)
- [X] T024 [US2] Wire `NotificationState` (T023) ao barramento de eventos WS existente em `frontend/src/App.tsx`: `message.new` (canal ≠ focado → marca não visto), `channel.deleted`/`server.deleted` (remove entrada) per [contracts/topbar-functions.md](./contracts/topbar-functions.md)
- [X] T025 [P] [US2] Create `frontend/src/components/SettingsPanel.tsx` (via `Dialog` existente) — secção Tema (`theme-seg`) + secção Sessão (handle + "Terminar sessão") per [contracts/topbar-functions.md](./contracts/topbar-functions.md)
- [X] T026 [US2] Create search state/logic (`query`, `status`, `results`) per [data-model.md](./data-model.md#searchstate-cliente-transitório-por-sessão-de-pesquisa-aberta) em `frontend/src/components/SearchPanel.tsx`: para cada servidor de `GET /api/servers` e canal de texto de `GET /api/servers/{id}/channels`, buscar `GET /api/channels/{id}/messages`, decifrar com a chave de servidor em sessão, filtrar por texto, com debounce e mínimo de 2 caracteres
- [X] T027 [US2] Rework `frontend/src/shell/TopBar.tsx`: adicionar botões `IconSearch` (T011, abre `SearchPanel` de T026), `IconBell` (T012, com indicador quando `NotificationState.hasAnyUnseen`), `IconSettings` (T013, abre `SettingsPanel` de T025); remover o `theme-seg` solto; `user-chip` passa a abrir `SettingsPanel` em vez de fazer logout num único clique
- [X] T028 [US2] Wire result click in `frontend/src/components/SearchPanel.tsx`/`TopBar.tsx` para navegar a `/channels/{id}?server=...&type=...` e fechar o painel de pesquisa

**Checkpoint**: [quickstart.md](./quickstart.md) §1, §4, §5, §6 passam — ícone de voz/plus/menu; pesquisa nunca sai da visibilidade do utilizador; notificações vêm só de eventos já recebidos; definições consolida tema+sessão.

---

## Phase 5: User Story 3 - Copiar valores técnicos sem ambiguidade de caracteres (Priority: P3)

**Goal**: Chave de mídia E2EE, handles de membro e código de convite usam tipo de letra monoespaçado (`--font-mono`, T002).

**Independent Test**: [quickstart.md](./quickstart.md) §7.

### Implementation for User Story 3

- [X] T029 [P] [US3] Apply `font-family: var(--font-mono)` to `.key-display` in `frontend/src/styles/mesa-theme.css` (uses T002)
- [X] T030 [P] [US3] Apply `font-family: var(--font-mono)` to `.members-handle` in `frontend/src/styles/mesa-theme.css` (uses T002)
- [X] T031 [P] [US3] Apply `font-family: var(--font-mono)` ao código/URL de convite no diálogo de convite em `frontend/src/shell/Sidebar.tsx` (nova classe em `frontend/src/styles/mesa-theme.css` se necessário)

**Checkpoint**: [quickstart.md](./quickstart.md) §7 passa — chave, handles e código de convite claramente monoespaçados (0/O, 1/l/I distinguíveis).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação e limpeza transversal.

- [X] T032 [P] Run `cd frontend && npx tsc --noEmit` e corrigir erros de tipo introduzidos pelas fases anteriores
- [X] T033 Execute manual scenarios em [quickstart.md](./quickstart.md) (§1–§9) e corrigir lacunas encontradas
- [X] T034 [P] Visual check da hierarquia de headings (T003) em ambos os temas — [quickstart.md](./quickstart.md) §8
- [X] T035 [P] Accessibility spot-check: confirmar `aria-label`/`title` em todo controlo ícone-apenas per [contracts/icon-system.md](./contracts/icon-system.md) — [quickstart.md](./quickstart.md) §2.6

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar de imediato
- **Foundational (Phase 2)**: Depende de T001 (Setup) — **bloqueia US1 e US2**
- **US1**: Depende de T004–T007 (Foundational)
- **US2**: Depende de T008–T013 (Foundational)
- **US3**: Depende apenas de T002 (Setup) — independente de Foundational/US1/US2
- **Polish**: Depende das fases desejadas estarem completas

### User Story Dependencies

| Story | Depende de | Notas |
|-------|------------|--------|
| US1 Chamada + E2EE | T004–T007 (Foundational) | Independente de US2/US3 |
| US2 Navegação + topbar | T008–T013 (Foundational) | Independente de US1/US3; usa endpoints/eventos já existentes |
| US3 Monoespaçada | T002 (Setup) | Totalmente independente — pode ser feita em paralelo com tudo |

### Parallel Opportunities

- T001 ∥ T002 ∥ T003 (Setup)
- T004 ∥ T005 ∥ T006 ∥ T007 ∥ T008 ∥ T009 ∥ T010 ∥ T011 ∥ T012 ∥ T013 (Foundational, todos ficheiros distintos)
- T018 ∥ T014/T015/T016/T017 dentro de US1 (chip de texto vs. controlos de chamada)
- T021 ∥ T022 ∥ T023 ∥ T025 dentro de US2 (antes de T024/T026/T027 que integram)
- T029 ∥ T030 ∥ T031 (US3, completamente paralelo)
- T032 ∥ T034 ∥ T035 (Polish)
- **US3 pode correr em paralelo com Foundational/US1/US2 inteiras** — só depende do Setup

### Within Each Story

- Ícones do catálogo (Foundational) antes de qualquer wiring de página
- Estado (`NotificationState`, `SearchState`) antes da integração na `TopBar`
- `SettingsPanel`/`SearchPanel` como componentes antes de serem montados na `TopBar`

---

## Parallel Example: Foundational

```bash
Task: "T004 IconMicOn/IconMicOff em IconMic.tsx"
Task: "T005 IconCameraOn/IconCameraOff em IconCamera.tsx"
Task: "T007 IconLockClosed/IconLockWarning em IconLock.tsx"
Task: "T008 IconVoiceChannel em IconVoiceChannel.tsx"
Task: "T011 IconSearch em IconSearch.tsx"
```

## Parallel Example: User Story 3 (independente de todo o resto)

```bash
Task: "T029 monospace em .key-display"
Task: "T030 monospace em .members-handle"
Task: "T031 monospace no código de convite"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 Foundational (pelo menos T004–T007, ícones de chamada/E2EE)
3. Phase 3 US1 — controlos de chamada + E2EE por ícone
4. **STOP e VALIDAR**: [quickstart.md](./quickstart.md) §2–3
5. Depois US2 (navegação + topbar funcional) → US3 (tipografia)

### Incremental Delivery

1. Setup + Foundational (catálogo de ícones completo)
2. US1 → demo: chamada/E2EE reconhecíveis por ícone (MVP)
3. US2 → demo: navegação por ícone + pesquisa/notificações/definições funcionais
4. US3 → demo: chave/handles/convite monoespaçados
5. Polish + quickstart completo

### Suggested MVP scope

**US1** (chamada + E2EE por ícone) — maior valor de confiança/uso ao vivo, menor superfície de mudança. **US3** pode ser feita em paralelo a qualquer momento por não ter dependências.

---

## Notes

- Nenhuma tarefa toca `backend/` — search/notificações/definições reaproveitam endpoints e eventos WS já existentes (FR-013).
- Rótulos de controlos de chamada ficam sempre em português, mesmo texto em ambos os estados (T014/T015) — não reintroduzir "Mic off"/"Cam off".
- `IconLockWarning` ≠ `IconLockClosed` visualmente — não reutilizar o mesmo glifo com cor diferente apenas (FR-005 exige forma distinta, não só cor).
- [P] = ficheiros diferentes / sem dependências incompletas; coordenar edições simultâneas em `mesa-theme.css` e `TopBar.tsx`.
