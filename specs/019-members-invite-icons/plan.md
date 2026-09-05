# Implementation Plan: Ícones de Membros e Convite

**Branch**: `019-members-invite-icons` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-members-invite-icons/spec.md`

## Summary

Substituir o rótulo textual «Membros» no cabeçalho do canal (texto e voz) por um **ícone de grupo** (duas silhuetas), com o mesmo pictograma e botão **seleccionado/pressionado** enquanto o painel está aberto. Mover o gatilho «Convite» para um **ícone pessoa+** à direita do nome no cabeçalho da coluna do servidor, **visível só ao dono**. Frontend-only: reutilizar o sistema SVG da 012 e o diálogo/POST de convite existentes. Backend intocado.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend; backend Rust/Axum **não** é alterado.

**Primary Dependencies**: `solid-js`; componentes `Icon` (012); `Channel.tsx`, `VoiceChannel.tsx`, `Sidebar.tsx`; `mesa-theme.css`; `POST /api/servers/{id}/invites` já existente (só dono).

**Storage**: N/A (sem persistência nova; `membersOpen` e diálogo de convite já em memória).

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md) (dono vs não-dono).

**Target Platform**: Browser; temas claro/escuro; drawer/narrow e Modo Palco já existentes.

**Project Type**: Web app — mudanças em `frontend/`; `backend/` intocado.

**Performance Goals**: Troca de ícone / estado seleccionado sem atraso perceptível (menos de 100 ms); sem pedidos extra no caminho de membros.

**Constraints**: FR-001–009 — ícone só; metáforas grupo vs pessoa+; convite oculto se não dono / sem servidor; não reordenar outros controlos do cabeçalho do canal; não redesenhar o diálogo de convite; traço/peso 012.

**Scale/Scope**: 2 ícones novos; 3 superfícies (canal texto, canal voz, header sidebar); CSS de botão-ícone + header; remoção do botão textual no fundo da lista.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos UI (gatilho membros + gatilho convite); sem schema/API novos. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/019-members-invite-icons/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── members-trigger.md
│   └── invite-trigger.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/icons/Icon.tsx          # REUTILIZAR — casca SVG 012
├── components/icons/IconUsers.tsx     # CRIAR — grupo (membros)
├── components/icons/IconUserPlus.tsx  # CRIAR — pessoa+ (convite)
├── pages/Channel.tsx                  # ALTERAR — botão membros → ícone
├── pages/VoiceChannel.tsx             # ALTERAR — idem, mesma posição
├── shell/Sidebar.tsx                  # ALTERAR — ícone no header; remover «Convite» do fundo
└── styles/mesa-theme.css              # ALTERAR — botão-ícone seleccionado; header nome+acção

backend/  # Intocado (create_invite já é só dono)
```

**Structure Decision**: Chrome-only no frontend. Ícones no kit 012; estado aberto via `aria-expanded` + classe/fundo `--press` (não segundo SVG). Visibilidade do convite = `owner_account_id === me.id`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
