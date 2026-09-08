# Quickstart: 072-channel-name-lock

## Prerequisites

- Frontend + backend running.
- Account with permission to create/rename channels; a **private** and a **public** channel (or create them).

## A — Espaços → `-` ao escrever

1. Criar ou renomear canal; digitar `sala geral`.
2. Esperado: campo mostra `sala-geral` em tempo real.

## B — Limite 32

1. Colar ou digitar mais de 32 caracteres (após hífens).
2. Esperado: campo não ultrapassa 32; save com ≤32.

## C — Inválidos

1. Tentar nome só espaços ou só `-` (ex. `---` após normalize).
2. Esperado: rejeição com feedback; canal não grava.

## D — Cadeado privado (reserva clara)

1. Sidebar: canal **privado** com nome longo (32).
2. Esperado: cadeado à **direita**; **reserva clara** sob/antes do ícone (nome não misturado com o desenho do cadeado); fade só nessa faixa se existir; nada legível à direita do cadeado; `#`/ícone de voz intactos à esquerda.
3. Canal **público**: sem cadeado; nome usável.

## E — Paridade create/rename

1. Repetir A–C em **criar** e em **renomear** (texto e voz se possível).

## F — Sem scroll lateral ao editar

1. Renomear na sidebar com nome de 32 caracteres; criar com nome longo no formulário.
2. Esperado: **sem** scroll horizontal da lista/linha/formulário; o caret pode mover-se dentro do campo.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd backend && cargo test --test contract channel_rename -- --nocapture
# plus any new name-rule tests added for 072
```

## Pass criteria

A–F match [spec.md](./spec.md) SC-001–SC-005 and clarifications (incl. amendment reserva + no container scroll).
