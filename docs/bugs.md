# Bugs

Defeitos conhecidos do produto, à parte do [backlog de funcionalidades](backlog/backlog.md).

## Resolvidos

### Histórico do canal diz que o canal não existe a quem não é membro

Uma conta autenticada que não pertence ao servidor recebia «não encontrado» ao pedir o histórico de um canal que existe. A lista de canais desse mesmo servidor já respondia «sem permissão». O teste `integration::server_isolation::servers_do_not_leak_across_membership` esperava essa mesma recusa no histórico e falhava (404 em vez de 403).

**Como reproduzir**: a conta A cria o servidor Alpha e um canal de texto. A conta C pertence só a outro servidor. C pede o histórico do canal de Alpha.

**Esperado**: recusa de permissão, igual à lista de canais de Alpha. Um canal que não existe continua «não encontrado». Um membro sem permissão de ver aquele canal também continua «não encontrado», para o canal ficar oculto.

**Resolução**: `channel_access` devolve 403 quando a conta não é membro do servidor. O 404 fica para canal inexistente e para membro sem permissão de ver. Spec: [fix-outsider-message-history](../openspec/changes/archive/2026-10-09-fix-outsider-message-history/proposal.md).

### Agrupamento de mensagens ignorava o intervalo de tempo

O chat juntava visualmente todas as mensagens consecutivas do mesmo remetente, mesmo quando o intervalo entre elas era longo.

**Como reproduzir** (2026-10-08): no mesmo canal, o mesmo remetente enviou uma mensagem às 09:24, outra às 09:26 e outra às 09:46. As três ficaram no mesmo grupo.

**Esperado**: as de 09:24 e 09:26 podem ficar juntas (dois minutos de diferença). A de 09:46, vinte minutos depois, deve abrir um grupo novo, com o seu próprio avatar e cabeçalho.

**Resolução**: `buildTimeline` agora continua o grupo apenas quando a mensagem chega até 5 minutos depois da anterior. O spec de texto exige a mesma janela, e `frontend/scripts/verify-chat.mjs` cobre o exemplo acima.
