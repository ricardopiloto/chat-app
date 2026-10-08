# Bugs

Defeitos conhecidos do produto, à parte do [backlog de funcionalidades](backlog/backlog.md).

## 1. Agrupamento de mensagens ignora o intervalo de tempo

O chat junta visualmente todas as mensagens consecutivas do mesmo remetente, mesmo quando o intervalo entre elas é longo. O agrupamento deve existir só quando as mensagens são enviadas num intervalo curto.

**Como reproduzir** (2026-10-08): no mesmo canal, o mesmo remetente enviou uma mensagem às 09:24, outra às 09:26 e outra às 09:46. As três ficaram no mesmo grupo.

**Esperado**: as de 09:24 e 09:26 podem ficar juntas (dois minutos de diferença). A de 09:46, vinte minutos depois, deve abrir um grupo novo, com o seu próprio avatar e cabeçalho.

**Onde está**: `buildTimeline` em `frontend/src/chat/logic/timeline.ts` continua o grupo quando o remetente é o mesmo, a mensagem não é uma resposta e o dia não mudou. A hora (`createdAt`) não entra nessa decisão. O spec de texto (`openspec/specs/frontend-v2/text-messaging/spec.md`, «Lista de mensagens agrupada e separada por dia») também só exige remetente consecutivo, sem janela de tempo. O limite exacto do intervalo curto fica por decidir.
