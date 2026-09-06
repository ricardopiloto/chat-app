# Implementation Plan: Tela de login Mesa (estilo protótipo)

**Branch**: `027-auth-login-screen` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-auth-login-screen/spec.md`

## Summary

Redesenhar `/auth` (e o chrome de `/invite/…`) para o layout de duas colunas de [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg): marca Mesa à esquerda, formulário à direita, tema escuro, acento roxo, abas + «ou» + botão secundário, campos com afixos e toggle de senha. Preservar fluxos actuais de login, registo, desbloquear chaves e aceitar convite.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `Auth.tsx`, `Invite.tsx`, `mesa-theme.css` (`.auth-*`), `theme/theme.ts`, ícones em `frontend/src/components/icons/`, referência visual `docs/screenshots/03-auth.jpg`.

**Storage**: N/A (só apresentação; APIs `/api/auth/*` e `/api/invites/*` inalteradas).

**Testing**: `cd frontend && npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) vs screenshot.

**Target Platform**: Browser; auth/invite em tema **escuro forçado** (referência), independente do tema claro da shell.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Primeira pintura da auth utilizável; submissão no caminho feliz inalterada.

**Constraints**: Sem reset de senha; sem mudanças de regras primeira-conta/convite; não pixel-perfect obrigatório; partilhar chrome entre Auth e Invite.

**Scale/Scope**: Layout + CSS auth; possível `AuthShell` partilhado; ícones campo (@, eye); refactor markup `Auth.tsx` / `Invite.tsx`.

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

UI chrome + contrato visual; sem schema/API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/027-auth-login-screen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-screen-visual.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── components/
    │   ├── AuthShell.tsx          # NOVO (opcional) — painel 2 colunas + marca
    │   └── icons/
    │       ├── IconLock.tsx       # reutilizar
    │       ├── IconAt.tsx         # NOVO se preciso
    │       └── IconEye.tsx        # NOVO — show/hide senha
    ├── pages/
    │   ├── Auth.tsx               # ALTERAR — markup/modos/tabs
    │   └── Invite.tsx             # ALTERAR — mesmo chrome
    └── styles/
        └── mesa-theme.css         # ALTERAR — .auth-shell / panes
```

**Structure Decision**: Extrair chrome partilhado (`AuthShell` ou classes CSS comuns) usado por `Auth.tsx` e `Invite.tsx`; lógica de submit permanece nas páginas.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
