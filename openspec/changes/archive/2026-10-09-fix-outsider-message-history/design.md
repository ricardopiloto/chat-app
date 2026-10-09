# Design

## Context

Ver `proposal.md` (Why). A lista de canais chama `require_member` e responde 403 a quem não é membro. O histórico passa por `require_channel_view` → `channel_access`. Quando não há membership, `channel_access` devolve 404 «channel not found» (`backend/src/api/authz.rs`). O mesmo 404 acontece se o membro existe mas `access.view` é falso, nesse caso de propósito, em `require_channel_view`.

## Goals / Non-Goals

**Goals:**

- Não-membro autenticado de um canal que existe recebe 403 nas acções que hoje passam por esse lookup.
- Canal inexistente e membro sem `view` continuam 404.
- Um único sítio decide a recusa de «sem membership», para a lista de canais e o histórico não divergirem.

**Non-Goals:**

- Redesenhar o ocultar de canal privado (404 para membro sem `view`).
- Alterar o 403 da lista de canais, que já está certo.
- Mudar corpos de erro, cifra ou o conjunto de quem pode ler o histórico.

## Decisions

### A falta de membership em `channel_access` passa a 403

Quando `db::membership::find` não encontra a conta no servidor do canal, `channel_access` SHALL devolver `ApiError::forbidden("not a member of this server")`, o mesmo texto de `require_member`. O 404 de canal inexistente fica no `find_by_id` que corre antes, em `require_channel_view`. O 404 de membro sem `view` fica no `if !access.view` de `require_channel_view`, que só corre depois de a membership existir.

Alternativa considerada: tratar só `GET .../messages`. Rejeitada porque enviar, reagir e as outras acções que usam `require_channel_view` continuariam a dizer que o canal não existe.

Alternativa considerada: 404 para todo o estranho, para não confirmar que o canal existe. Rejeitada: a lista de canais já confirma o servidor com 403, e o teste de isolamento e o bug pedem 403 no histórico.

### Quem já filtrou membership não muda de comportamento

`list_channels` e o snapshot de voz chamam `require_member` antes de `channel_access`. Um estranho nem chega ao lookup. Membros continuam a ter membership, por isso o ramo novo não os apanha.

## Risks / Trade-offs

- [403 confirma a um estranho que aquele id de canal existe] → Aceite: é o contrato do teste e alinha com a lista de canais. O canal privado de um membro sem `view` continua 404.
- [Outros callers de `channel_access` passam a ver 403 em vez de 404 se a membership faltar] → É o efeito pedido. Os callers que já exigem membership não mudam. Confirmar com `cargo test`, em especial `server_isolation` e os testes de mensagens, reações e ACL.

## Migration Plan

Sem migração. Publicar o backend. Rollback: reverter o commit. Clientes que tratavam 404 como «canal apagado» para um estranho passam a ver recusa de permissão; não há dados para migrar.
