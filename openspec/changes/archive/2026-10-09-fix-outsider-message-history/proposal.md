# Proposal

## Why

Uma conta autenticada que não é membro de um servidor recebe «canal não encontrado» ao pedir o histórico de um canal que existe. A lista de canais desse servidor já recusa por falta de permissão. O teste de isolamento entre servidores espera a mesma recusa no histórico e falha. A falha é anterior às reações e está registada em `docs/bugs.md`.

## What Changes

- Recusar o histórico de um canal existente a quem está autenticado mas não é membro do servidor, com a mesma falta de permissão já usada na lista de canais.
- Manter «não encontrado» quando o canal não existe, e quando um membro não tem permissão de ver esse canal (o canal continua oculto).
- Manter a recusa de sessão ausente como falta de autenticação.
- Onde o mesmo lookup diz a um não-membro que um canal existente não existe (enviar, reagir, ou outra acção no canal), passar a usar a mesma recusa de permissão.
- **BREAKING** para clientes que tratavam esse «não encontrado» como canal inexistente quando o leitor simplesmente não é membro. O histórico em si, a cifra e quem já pode ver o canal não mudam.

## Capabilities

### New Capabilities

- `auth/server-isolation`: recusa de permissão ao histórico (e às acções que hoje mentem sobre a existência do canal) para uma conta autenticada que não é membro do servidor, sem alterar o «não encontrado» de canal inexistente ou oculto a um membro.

### Modified Capabilities

(nenhuma — `frontend-v2/channel-management` já descreve o acesso dos membros e o canal exclusivo que os restantes nem vêem; não define o estado HTTP de um estranho a pedir o histórico)

## Impact

- Backend: lookup de membership usado ao ler o histórico do canal (`GET /api/channels/{id}/messages`) e os outros pontos que devolvem «canal não encontrado» a um não-membro de um canal que existe.
- Teste `integration::server_isolation::servers_do_not_leak_across_membership`, que hoje recebe 404 onde espera 403.
- Sem migração, sem mudança de frontend e sem mudança do conteúdo das mensagens.
