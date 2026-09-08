# Quickstart: 047-server-channel-permissions

Validação manual + testes de contrato após implement.

## Prerequisites

- Backend + frontend a correr ([README](../../README.md) / [docs/operar-instancia.md](../../docs/operar-instancia.md))
- Duas contas (Owner O, Member M); terceiro N via convite
- Migração `0012` aplicada

## Automated

```bash
cd backend && cargo test --test contract
cd ../frontend && ./node_modules/.bin/tsc --noEmit
```

Expect: new permission/ACL/roles/kick tests green; tsc exit 0.

## Scenario A — Membership / kick (US1)

1. O cria servidor; M entra por convite.
2. Ambos vêem o servidor.
3. O remove M (`DELETE …/members/{id}`).
4. M deixa de ver o servidor / recebe sem acesso.

## Scenario B — Público vs privado + ícone (US6)

1. O (ou papel com criar) cria canal **privado** → só O (e owner) na lista; ícone de privado.
2. M não vê o canal (DOM: sem entrada; URL directa falha sem revelar).
3. O cria canal **público** → M vê sem ícone de privado.

## Scenario C — Texto read vs write (US2)

1. Canal privado: ACL M = `read` → M vê, composer bloqueado; POST 403.
2. ACL M = `write` → M envia mensagem.

## Scenario D — Voz listen vs speak (US3)

1. Canal voz privado: ACL M = `listen` → entra, mic/cam desligados/bloqueados.
2. ACL = `speak` → pode mic e câmera.

## Scenario E — Papéis + criar canal (US4 / FR-020)

1. O cria papel «Mods» com `can_create_channels`, atribui M.
2. M consegue criar canal; conta sem papel não.

## Scenario F — Convite / visível a novos (US5)

1. Público A com visível a novos; público B sem; privado C.
2. N aceita convite → vê A; não vê B nem C.
3. O concede ACL a N em C → N passa a ver C com ícone.

## Scenario G — Owner bypass

1. M cria privado (com papel).
2. O vê o privado, abre conteúdo, gere ACL.

## Pass criteria

Aligned with [contracts/](./contracts/) and SC-001–009. Note any skipped scenarios.
