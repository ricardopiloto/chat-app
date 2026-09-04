# Tasks: Spike Fase 0 — Viabilidade da Chamada

**Input**: Design documents from `/specs/001-fase-0-spike/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Só contrato do token (pedido no plan). Demais histórias = validação manual no [quickstart.md](./quickstart.md).

**Organization**: Onda 1 = US1–US3. Onda 2 = US4–US6. Código só em `spike/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelo (arquivos diferentes, sem depender de task incompleta)
- **[Story]**: US1–US6; Setup/Foundational/Polish sem label
- Toda task tem caminho de arquivo

## Path Conventions

```text
spike/infra/     # LiveKit Compose (já existe)
spike/client/    # Tauri 2 + Vite vanilla TS
spike/token/     # axum + livekit-api
spike/scripts/
specs/001-fase-0-spike/results.md   # go/no-go (criado na execução)
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Toolchain, scaffold e pin da imagem. Ainda não sobe chamada.

- [x] T001 Write host prerequisites (Docker group, rustup, Node LTS, `dnf install webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel librsvg2-devel`) in `spike/README.md`
- [x] T002 [P] Scaffold Tauri 2 + Vite vanilla TypeScript in `spike/client/` (`package.json`, `spike/client/src/main.ts`, `spike/client/index.html`, `spike/client/src-tauri/tauri.conf.json`)
- [x] T003 [P] Pin `livekit/livekit-server` image tag (not floating `latest`) in `spike/infra/docker-compose.yml`
- [x] T004 [P] Create `spike/scripts/` (add `spike/scripts/.gitkeep`) for later mint/RAM helpers

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SFU no ar e isolado com cliente de **terceiros**. Nenhuma user story de produto começa antes.

**⚠️ CRITICAL**: US1+ bloqueadas até o checkpoint.

- [ ] T005 Enable Docker daemon / user group and record the commands that actually ran in `spike/README.md`
- [ ] T006 Start LiveKit via `spike/infra/docker-compose.yml` and confirm signaling port `7880` responds (note in `spike/README.md`)
- [ ] T007 Join two official LiveKit example clients to room `spike-room` (LAN) and document the exact URL/token steps in `spike/README.md` — if this fails, do not start US1

**Checkpoint**: SFU aceita dois participantes. Falha daqui é servidor, não o Tauri.

---

## Phase 3: User Story 1 - Dois participantes se veem e se ouvem (Priority: P1) 🎯 MVP da chamada

**Goal**: Cliente Tauri captura câmera/mic, entra em `spike-room`, pub/sub A/V entre `alice` e `bob` na mesma LAN.

**Independent Test**: Duas janelas `npm run tauri dev` (identities `alice` e `bob`) com áudio e vídeo bidirecionais. Cliente de exemplo da T007 já passou.

### Implementation for User Story 1

- [x] T008 [US1] Add npm dependency `livekit-client` in `spike/client/package.json`
- [x] T009 [US1] Implement Room connect, publish local tracks, subscribe remote tracks in `spike/client/src/livekit.ts`
- [x] T010 [US1] Implement `getUserMedia` camera+mic with visible permission errors in `spike/client/src/media.ts`
- [x] T011 [US1] Add join UI (identity `alice`|`bob`, room `spike-room`, `ws://` URL) in `spike/client/src/main.ts` and `spike/client/index.html`
- [x] T012 [US1] Add Onda-1-only token helper `spike/scripts/mint-dev-token.sh` (uses API secret locally; client must not embed the secret after US4)
- [ ] T013 [US1] Wire helper output into `spike/client/src/main.ts` and verify two Tauri windows on LAN (quickstart §3)

**Checkpoint**: US1 demonstrável sem grade, hotspot, token service nem E2EE.

---

## Phase 4: User Story 2 - Grade de câmeras em posições fixas (Priority: P1)

**Goal**: Grade da sala 2×2; uma câmera por pessoa; slot atrelado à identity; vazios visíveis.

**Independent Test**: `alice` slot 0, `bob` slot 1, slots 2–3 vazios. Rejoin com a mesma identity volta ao mesmo slot. Layout não compacta.

### Implementation for User Story 2

- [x] T014 [P] [US2] Encode static slot map (`alice`→0, `bob`→1, 2–3 `null`) matching `specs/001-fase-0-spike/contracts/grid-layout.json` in `spike/client/src/grid.ts`
- [x] T015 [P] [US2] Add 2×2 CSS grid with reserved empty cells in `spike/client/src/grid.css` and hook it from `spike/client/index.html`
- [x] T016 [US2] Attach local/remote `<video>` to slots by `participant.identity` (not join order) in `spike/client/src/grid.ts`
- [x] T017 [US2] Keep slot reserved on leave; restore same index on rejoin in `spike/client/src/grid.ts` and `spike/client/src/livekit.ts`
- [ ] T018 [US2] Manual check in `spike/client/src/grid.ts`: leave/rejoin keeps the same slot; unknown identity does not reorder slots 0–3 (quickstart §4)

**Checkpoint**: US1+US2 = chamada com diferencial de layout.

---

## Phase 5: User Story 3 - Chamada atravessa redes (hotspot) (Priority: P1)

**Goal**: `alice` na LAN, `bob` no hotspot do celular, A/V via relé se ICE direto falhar. Túnel não conta.

**Independent Test**: Segundo cliente na rede móvel usa IP **público** do host. Sem port-forward/hotspot → `bloqueio_ambiente` em `results.md`, não go.

### Implementation for User Story 3

- [x] T019 [US3] Enable embedded TURN (`turn.enabled: true`, `udp_port: 3478`) and `rtc.use_external_ip` (or `node_ip`) in `spike/infra/livekit.yaml`; publish `3478/udp` in `spike/infra/docker-compose.yml`
- [x] T020 [US3] Log ICE candidate types (host / srflx / relay) to the UI or console from `spike/client/src/ice.ts`
- [x] T021 [US3] Document router port-forward (7880/tcp, 7881/tcp, 3478/udp, 50000–50100/udp) in `spike/README.md`
- [ ] T022 [US3] Run hotspot test (quickstart §5); write `hotspot_nat` = go | no-go | bloqueio_ambiente in `specs/001-fase-0-spike/results.md` (create file from `contracts/go-no-go-report.md` if missing)

**Checkpoint**: Onda 1 pode fechar a seção 1 de `results.md` (chamada, grade, NAT).

---

## Phase 6: User Story 4 - Credencial de processo separado (Priority: P2)

**Goal**: Stub TokenSvc; cliente só recebe JWT; API secret nunca no frontend.

**Independent Test**: `POST /token` → join aceito; grep em `spike/client` sem `spikesecret`.

### Tests for User Story 4

> Escrever os testes primeiro e garantir que falham antes de T024.

- [x] T023 [US4] Add contract tests (response has only `token`+`url`; body must not contain API secret) in `spike/token/tests/token_contract.rs`

### Implementation for User Story 4

- [x] T024 [US4] Implement `GET /health` and `POST /token` with `livekit-api` + axum in `spike/token/src/main.rs` and `spike/token/Cargo.toml` per `specs/001-fase-0-spike/contracts/token-api.yaml`
- [x] T025 [US4] Load `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_WS_URL` from env; add `spike/token/.env.example` (do not commit real `.env`)
- [x] T026 [US4] Fetch JWT via `POST /token` in `spike/client/src/token.ts` and switch `spike/client/src/main.ts` off `spike/scripts/mint-dev-token.sh`
- [ ] T027 [US4] Confirm join still works and search `spike/client/` for the API secret string (must be zero hits)

**Checkpoint**: Loop igual à arquitetura (secret só no processo token).

---

## Phase 7: User Story 5 - Criptografia de mídia neste desktop Linux (Priority: P2)

**Goal**: Round-trip cifra→decifra no **webview Tauri** (não no Chrome do host). Gap Win/mac explícito.

**Independent Test**: Com E2EE do `livekit-client` ligado, o remoto ainda vê/ouve; probe `RTCRtpScriptTransform` registrado. Falha de round-trip = no-go documentado.

### Implementation for User Story 5

- [x] T028 [P] [US5] Probe `RTCRtpScriptTransform` / `createEncodedStreams` and display results in `spike/client/src/e2ee-probe.ts` (call from `spike/client/src/main.ts`)
- [x] T029 [US5] Enable LiveKit E2EE (`ExternalE2EEKeyProvider` + `livekit-client/e2ee-worker`) with a hardcoded test key in `spike/client/src/e2ee.ts`
- [x] T030 [P] [US5] Add XOR loopback diagnostic (API vs worker failure) in `spike/client/src/e2ee-xor.ts` — not a substitute for T029 go
- [ ] T031 [US5] Run round-trip inside Tauri webview; write `criptografia_linux` and Windows/macOS gap into `specs/001-fase-0-spike/results.md`

**Checkpoint**: Premissa E2EE-por-padrão no Linux tem go ou no-go explícito.

---

## Phase 8: User Story 6 - Orçamento de RAM (Priority: P2)

**Goal**: Medir RSS idle/em chamada. Corte: idle do cliente **< 1024 MB** = go.

**Independent Test**: Script imprime Tauri, container LiveKit e token-svc; `ram_idle` classificado.

### Implementation for User Story 6

- [x] T032 [US6] Implement `spike/scripts/measure-ram.sh` (`ps`/`smem` for Tauri + token; `docker stats --no-stream` for LiveKit)
- [ ] T033 [US6] Run `idle` and `in_call` (two participants with A/V) and append the table to `specs/001-fase-0-spike/results.md`
- [ ] T034 [US6] Set `ram_idle` go if Tauri idle RSS < 1024 MB else no-go in `specs/001-fase-0-spike/results.md` (hundreds-of-MB band is observation only)

**Checkpoint**: Onda 2 pode fechar seção 2+3 do relatório.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Relatório final e higiene. Não é código de produção.

- [x] T035 Complete both Onda 1 and Onda 2 sections in `specs/001-fase-0-spike/results.md` per `specs/001-fase-0-spike/contracts/go-no-go-report.md`
- [x] T036 [P] Record LiveKit image digest and WebKitGTK/webview version in the header of `specs/001-fase-0-spike/results.md`
- [x] T037 [P] State in `spike/README.md` that `spike/` is disposable and must not be copied into the product binary
- [x] T038 Walk remaining steps in `specs/001-fase-0-spike/quickstart.md` and fix gaps in `spike/` or the docs
- [x] T039 After Onda 1 section is filled, explicitly allow/block “MVP that only needs a working call”; after Onda 2, explicitly allow/block freezing TokenSvc + E2EE-by-default in `specs/001-fase-0-spike/results.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: imediato
- **Foundational (Phase 2)**: depende de Setup (T003 pin + T005/T006 Docker) — **bloqueia** US1–US6
- **US1 (Phase 3)**: após T007; precisa T002
- **US2 (Phase 4)**: após US1 (usa `livekit.ts` + vídeos)
- **US3 (Phase 5)**: após US1 (idealmente após US2 para testar grade no hotspot, não obrigatório)
- **US4 (Phase 6)**: token crate independente após Foundational; troca do cliente exige US1
- **US5 (Phase 7)**: após US1 (webview com tracks)
- **US6 (Phase 8)**: após US1; baselines melhores com US4 no ar
- **Polish (Phase 9)**: depois das histórias que forem executar (Onda 1 pode parar no T035 parcial)

### User Story Dependencies

- **US1 (P1)**: só Foundational
- **US2 (P1)**: US1
- **US3 (P1)**: US1; ambiente (port-forward/hotspot) é bloqueio de ambiente, não de código
- **US4 (P2)**: Foundational para o crate; US1 para o cliente consumir `/token`
- **US5 (P2)**: US1
- **US6 (P2)**: US1; US4 se quiser RSS do token-svc

US4 (crate + testes) **pode** avançar em paralelo com US2/US3 depois da fundação.

### Within Each User Story

- US4: T023 falha → T024 implementa → T026 cliente
- Modelos/constantes (grid) antes de CSS/UI
- Core join antes de ICE/E2EE/RAM

### Parallel Opportunities

- T002 (scaffold client) ∥ T003 (pin image) ∥ T004 (scripts dir)
- T014 (grid.ts) ∥ T015 (grid.css)
- T028 (probe) ∥ T030 (xor) depois que T029 estiver em andamento ou em arquivos distintos
- T036 ∥ T037
- Token crate (T023–T025) ∥ trabalho de grade/TURN se outra pessoa estiver no cliente

---

## Parallel Example: User Story 2

```bash
Task: "Encode static slot map in spike/client/src/grid.ts"
Task: "Add 2×2 CSS grid in spike/client/src/grid.css"
```

## Parallel Example: Onda 2 start

```bash
Task: "Contract tests in spike/token/tests/token_contract.rs"
# em paralelo, no cliente, se US1 já passou:
Task: "ICE logging in spike/client/src/ice.ts"   # US3, se Onda 1 ainda aberta
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational (T007 obrigatório)  
3. Phase 3 US1  
4. **STOP**: duas janelas Tauri com A/V  

### Incremental Delivery (alinhado à spec)

1. Setup + Foundational  
2. **Onda 1**: US1 → US2 → US3 → preencher seção 1 de `results.md` → MVP de “chamada funciona” pode seguir  
3. **Onda 2**: US4 → US5 → US6 → seção 2+3 → só então congelar TokenSvc e E2EE-por-padrão  
4. Polish T035–T039  

### Parallel Team Strategy

Solo: ordem acima.  
Dois devs após T007: A = US1/US2/US3 no cliente; B = T023–T025 no token (integra na T026).

---

## Notes

- [P] = arquivos diferentes, sem esperar a irmã
- Não commitar `spike/token/.env` nem API secret no frontend
- Túnel **não** fecha T022
- E2EE da T031 é no webview Tauri, não no Chrome
- `spike/` é descartável (T037)
- Constitution template: sem TDD fora do token
- Próximo comando: `/speckit-implement` (ou executar as tasks na ordem)
