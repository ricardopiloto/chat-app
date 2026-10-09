# Proposal

## Why

O chat agrupa visualmente mensagens consecutivas do mesmo remetente mesmo quando passou muito tempo entre elas (ex.: 09:24, 09:26 e 09:46 ficam todas no mesmo grupo). Isso esconde quando uma mensagem foi realmente enviada e confunde o contexto da conversa. O agrupamento deve respeitar uma janela de tempo curta, não apenas "mesmo remetente e mesmo dia" (docs/bugs.md, item 1).

## What Changes

- `buildTimeline` (`frontend/src/chat/logic/timeline.ts`) passa a considerar o intervalo entre `createdAt` da mensagem atual e da mensagem anterior do mesmo remetente: só continua o grupo se esse intervalo for **≤ 5 minutos**; caso contrário abre um novo grupo (novo avatar/cabeçalho), mesmo sendo o mesmo remetente e o mesmo dia.
- O requisito "Lista de mensagens agrupada e separada por dia" em `openspec/specs/frontend-v2/text-messaging/spec.md` passa a exigir explicitamente essa janela de tempo, com um novo cenário cobrindo a quebra de grupo por intervalo longo.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `frontend-v2/text-messaging`: o requisito "Lista de mensagens agrupada e separada por dia" passa a exigir que o agrupamento por remetente consecutivo só ocorra dentro de uma janela de tempo curta (5 minutos); mensagens do mesmo remetente fora dessa janela iniciam um novo grupo.

## Impact

- **Código**: `frontend/src/chat/logic/timeline.ts` (função `buildTimeline`) — passa a ler `createdAt` da mensagem anterior do grupo para decidir se continua o grupo.
- **Specs**: `openspec/specs/frontend-v2/text-messaging/spec.md` — requisito de agrupamento ganha critério de tempo e novo cenário.
- **Testes**: não há suíte de testes automatizados para `timeline.ts` hoje; a change deve introduzir cobertura (unitária) para o comportamento de agrupamento, incluindo o novo critério de tempo.
- **Sem impacto em API/backend**: `createdAt` já está disponível no `ChatMessage` recebido pelo frontend.
