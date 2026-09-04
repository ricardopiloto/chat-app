# Implementation Plan: Fidelidade pixel ao Protótipo Mesa v2

**Branch**: `006-prototype-ui-parity` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-prototype-ui-parity/spec.md`

## Summary

Alinhar a SPA ao **protótipo Nocturne v2** (chrome, texto, voz, editor, diálogos) com desvio documentado do **rail de Servidores**; corrigir **continuidade de vídeo** após Salvar cena e **enquadramento cover/centrado** dos feeds; implementar **Gravar ⇄ E2EE off/religar** + **custódia da chave do canal** (G1/G2/G5) com backend; **apagar** canal/Servidor (hard delete, permissões clarify). Lacunas G3/G4/G7–G9 ficam em `docs/backlog-prototype-v2-gaps.md`.

## Technical Context

**Language/Version**: TypeScript (SolidJS SPA) + Rust 2021 (Axum) — herdado.

**Primary Dependencies**: SolidJS, Vite, Nocturne CSS; LiveKit Client (Insertable Streams / E2EE) + LiveKit Server API (tokens + Egress quando configurado); sqlx/SQLite; WebSocket hub existente.

**Storage**: SQLite — migrações para `channel.created_by`, estado E2EE do canal, custódia de chave de canal (blob selado), log de auditoria E2EE; CASCADE já cobre hard delete de canal/Servidor.

**Testing**: `cargo test` (contratos delete, e2ee-toggle, channel create/custody, last-channel guard); `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) + [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md).

**Target Platform**: Browser desktop + telemóvel (HTTPS/LAN).

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC-006 (reattach ≤2s); SC-008/011/012/013/014/015 da spec.

**Constraints**: E2EE on por omissão; Gravar exige chave de canal (legado = desabilitado); sem chat/co-diretor no voz; rail único para troca de Servidor; ≥1 canal por Servidor; hard delete; egress opcional na instância (erro claro se falhar).

**Scale/Scope**: Shell + VoiceChannel/Channel + diálogos criar + APIs channel/server/voice/egress; ~1–2 migrações; sem G3/G4/G7–G9.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — contratos Rust + quickstart manual |
| Complexity Tracking | Ver tabela (E2EE/chave canal + egress + delete + fidelity) |

**Gate: PASS** (complexidade justificada pela clarify e pela arquitectura alvo em `docs/arquitetura-tecnica.md`).

### Re-check pós-Phase 1

Modelo e contratos cobrem chave de canal, E2EE state, delete, rail/UI. Egress documentado como best-effort. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/006-prototype-ui-parity/
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
frontend/src/
├── styles/mesa-theme.css          # fidelity + object-fit cover + rail
├── shell/
│   ├── AppShell.tsx               # rail + sidebar layout; stage hides both
│   ├── Sidebar.tsx                # canais; sem switcher de Servidor no header
│   ├── ServerRail.tsx             # NOVO — ícones / iniciais
│   └── ContextMenu.tsx            # NOVO — delete confirm
├── components/
│   ├── CameraGrid.tsx / SceneEditor.tsx  # cover; fidelity
│   └── Dialog.tsx                 # create channel custody block; gravar dialog
├── pages/
│   ├── VoiceChannel.tsx           # layoutMedia robusto; Gravar/Religar; cover
│   ├── Channel.tsx                # fidelity texto
│   └── … Auth/Invite
├── video/liveClient.ts            # E2EE on/off por canal; reattach tracks
└── api/client.ts                  # novos endpoints

backend/
├── migrations/0006_*.sql          # created_by, e2ee, channel_key, audit
├── src/api/
│   ├── channels.rs                # create+custody; DELETE; last-channel guard
│   ├── servers.rs                 # DELETE
│   └── voice.rs                   # e2ee-toggle; egress start/stop
├── src/db/…
└── tests/contract/…
```

**Structure Decision**: Continuar monólito `frontend/` + `backend/`. Fidelity é sobretudo CSS/markup; produto novo (rail, delete, E2EE/gravar, chave canal) toca API + migração + VoiceChannel.

## Complexity Tracking

| Divergência | Justificação | Alternatives rejected |
|-------------|--------------|----------------------|
| Chave E2EE **por canal** (além da chave de Servidor) | Clarify G5 + PRD/arquitectura; Religar precisa custódia | Reusar só chave de Servidor (quebra protótipo) |
| E2EE desligável + Egress | Clarify G1/G2; cunha de privacidade | Manter E2EE sempre on (rejeitado na clarify) |
| Rail Discord-like | Pedido explícito; PRD 1b revertido conscientemente | Só header switcher |
| Hard delete + kick | Clarify | Soft-delete |

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md)
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)
