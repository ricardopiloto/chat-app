# Quickstart: 077-member-join-welcome

## Prerequisites

- Backend with migration `0019` applied; FE build current.
- Two accounts; ability to create invites / own a server.

## A — Default `#geral`

1. Server with text channel `geral`; no owner welcome override (or override = geral).
2. Conta B aceita convite.
3. Esperado: em `#geral`, mensagem de sistema centrada tipo *Usuário &lt;B&gt; acabou de entrar no canal*; B está no servidor.

## B — Sem `geral`: canal no convite (por-convite)

1. Servidor sem canal `geral` e sem destino do dono.
2. Criar convite **sem** canal → rejeitado.
3. Criar convite escolhendo `#chegadas`; B entra por esse código → anúncio em `#chegadas`.
4. Criar outro convite com outro canal; C entra → anúncio nesse outro canal (config do servidor inalterada).

## C — Template do dono

1. Dono define template com `{nome}` nas definições.
2. Novo join → texto reflecte o template.
3. Não-dono não altera definições de welcome.

## D — Destino do dono

1. Dono define canal `#avisos` (mesmo com `geral` existente).
2. Novo join → anúncio em `#avisos`.

## E — Falha do anúncio

1. Forçar destino inválido / erro de publish (lab).
2. Esperado: membro **ainda** entra no servidor.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd backend && cargo test --test contract -- --nocapture
# filter tests added for 077 as implemented
```

## Pass criteria

A–E match [spec.md](./spec.md) SC-001–SC-005 and contracts under `contracts/`.
