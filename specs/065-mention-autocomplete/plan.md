# Implementation Plan: Autocomplete de menções @ no composer

**Branch**: `065-mention-autocomplete` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/065-mention-autocomplete/spec.md`

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/)

## Summary

Dois eixos: (1) **picker** no composer ao digitar `@` — sugestões de membros com **view no canal actual**, sem o próprio, com filtro dinâmico e inserção de `@handle`; (2) **corrigir/garantir** que `@handle` válido (manual ou via picker) deixa de ser silencioso — roster disponível no envio, parse alinhado aos handles reais, mesma lista de candidatos na resolução. Preferir FE + helper puro; endpoint leve de mentionables se o filtro «só quem vê o canal» não for fiável só com `/members` no privado.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust / Axum só se for preciso endpoint de candidatos.

**Primary Dependencies**: `frontend/src/pages/Channel.tsx` (composer), `frontend/src/lib/mentionParse.ts`, `frontend/src/api/client.ts`; opcional `backend/src/api/channels.rs` + authz view; CSS `mesa-theme.css`.

**Storage**: N/A (reusa `message_mention` / notifications 062).

**Testing**: `cargo test --test contract` (mentions_replies + novo filtro se BE); `tsc --noEmit`; [quickstart.md](./quickstart.md) A–E.

**Target Platform**: Browser; canais de texto.

**Project Type**: Web app (composer UX + possible small API).

**Performance Goals**: Filtrar candidatos O(n) no cliente (n = membros do canal); picker sem jank; sem N round-trips por tecla.

**Constraints**: E2EE — servidor não lê plaintext; cliente envia `mentioned_account_ids`; excluir self; só viewers do canal; sem mudar modelo de replies/notificações 062.

**Scale/Scope**: ~1–3 FE modules + CSS; opcional 1 GET API + contract test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc; contract se novo endpoint |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos UI + mentionables + data-model; quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/065-mention-autocomplete/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── mention-composer-picker.md
│   ├── mention-resolution-fix.md
│   └── mentionables-api.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/lib/mentionParse.ts          # active-mention parse + filter + resolve (fix)
frontend/src/lib/mentionCandidates.ts     # optional: filter/sort candidates
frontend/src/components/MentionPicker.tsx # optional extracted UI
frontend/src/pages/Channel.tsx            # wire composer + send path
frontend/src/styles/mesa-theme.css        # picker chrome
backend/src/api/channels.rs               # optional GET …/mentionables
backend/tests/contract/…                   # optional contract
```

**Structure Decision**: Keep resolve/filter pure in `lib/`; picker UI in Channel or small component; add mentionables API only if private-channel view filter cannot be derived from existing members + channel privacy alone.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/mention-composer-picker.md](./contracts/mention-composer-picker.md)
- [contracts/mention-resolution-fix.md](./contracts/mention-resolution-fix.md)
- [contracts/mentionables-api.md](./contracts/mentionables-api.md)
- [quickstart.md](./quickstart.md)
