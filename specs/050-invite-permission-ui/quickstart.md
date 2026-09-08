# Quickstart: 050-invite-permission-ui

Validação alinhada a [spec.md](./spec.md) e [contracts/invite-button-visibility.md](./contracts/invite-button-visibility.md).

## Prerequisites

- Backend + frontend a correr
- Servidor com **dono A** e **membro B**
- Papel com «Criar convites» que possa ser atribuído a B

## Setup

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Membro com permissão vê e cria

1. Como A: criar/editar papel com **Criar convites** ON; atribuir B.
2. Como B: abrir o servidor.
3. **Expect**: botão Convite visível; **Gerir papéis** ausente.
4. B clica Convite → obtém URL/código válido.

### B — Membro sem permissão

1. Como A: remover B do papel (ou desligar a capacidade); B refresca / troca de servidor e volta.
2. **Expect**: botão Convite ausente para B.

### C — Dono

1. Como A no mesmo servidor.
2. **Expect**: Convite e Gerir papéis visíveis; criar convite funciona.

### D — Vários papéis (OR)

1. B noutro papel sem convites + papel com convites.
2. **Expect**: Convite visível.

## Done when

- A–D OK + `tsc --noEmit` limpo.
