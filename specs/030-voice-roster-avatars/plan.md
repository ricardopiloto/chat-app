# Implementation Plan: Avatares na lista de jogadores e nos canais de texto

**Branch**: `030-voice-roster-avatars` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-voice-roster-avatars/spec.md`

## Summary

Mostrar o **ícone de identidade** (foto de perfil 029 ou iniciais) à esquerda do handle (1) na lista aninhada de voz (028) e (2) em cada grupo de mensagens de texto. A ocupação REST/WS passa a incluir `has_avatar` no instante do snapshot, para a linha nascer já com a foto certa (SC-001b). Sem evento WS de avatar; mudança de foto com a pessoa já visível segue 029 (refetch).

## Technical Context

**Language/Version**: Rust 2021 (Axum); TypeScript ~5.8 / SolidJS 1.9.

**Primary Dependencies**: `OccupantView` / GET occupancy / WS `voice.occupancy`; `IdentityAvatar`; `Sidebar` roster; `Channel` message groups; `GET /api/accounts/{id}/avatar` (029).

**Storage**: Sem migração. `has_avatar` derivado de `account.avatar_filename` no JOIN da vista de ocupação. Bytes da foto continuam em `AVATARS_DIR`.

**Testing**: Contract occupancy com `has_avatar` true/false; `cargo test --test contract`; `npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Browser + Axum (igual 028/029).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Foto na linha de voz no mesmo prazo de 028 (&lt;3 s); grupo de texto com foto no instante em que aparece (SC-007).

**Constraints**: FR-001–011; sem `avatar.updated`; sem badges/a falar; sem lista de ocupação em canais `#`; não alterar quem entra na lista (mic **ou** câmera).

**Scale/Scope**: Ícone por linha de roster (poucas pessoas) + um ícone por grupo de mensagens visível.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract `has_avatar` na ocupação + tsc + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Um campo na vista de ocupação; UI reutiliza `IdentityAvatar`. Sem BFF, sem tabela nova, sem WS de identidade. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/030-voice-roster-avatars/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── voice-occupancy-avatars.md
│   └── identity-icon-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/domain/voice_occupancy.rs   # OccupantView.has_avatar
backend/src/db/voice_occupancy.rs       # JOIN account.avatar_filename
backend/tests/contract/voice_occupancy.rs  # e/ou avatars.rs — has_avatar no snapshot/WS

frontend/src/api/client.ts              # VoiceOccupantView.has_avatar
frontend/src/shell/Sidebar.tsx          # IdentityAvatar na lista aninhada
frontend/src/pages/Channel.tsx          # grupos de texto (já 029 — verificar SC-007)
frontend/src/components/IdentityAvatar.tsx  # opcional: onerror → iniciais
frontend/src/styles/mesa-theme.css      # .voice-roster-item + círculo compacto
```

**Structure Decision**: Estender a **vista** de ocupação (não a tabela `voice_occupant`). FE: mesmo componente de 029. Texto: completar/verificar o que 029 já ligou em `Channel.tsx`.

## Complexity Tracking

> Vazio — um booleano na projecção existente.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
