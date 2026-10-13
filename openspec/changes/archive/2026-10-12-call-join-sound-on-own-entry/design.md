# Design

## Context

Ver `proposal.md`. Mecanismo actual (`frontend/src/sound/triggers.ts`): um `createEffect` assina `shell.subscribeOccupancy`, cujo `arrivals()` (`frontend/src/sound/arrivals.ts`) filtra sempre `me` da lista de chegadas — por isso a própria entrada nunca dispara o efeito, para si próprio, por esse caminho. Esse mecanismo continua correcto e inalterado para "quem já estava ouve quem chega".

`callSession.tsx` tem dois caminhos que chamam `join()`/`joinOnce()`:
- `GreenRoom.tsx:57`, `call.join({...})` — a entrada genuína, accionada pela pessoa ao clicar para entrar na chamada.
- `onE2eeChanged` (`callSession.tsx:592-602`) — chamado quando `channel.e2ee_changed` chega por WebSocket a meio de uma chamada activa; a sala não troca de cifra em runtime, por isso a própria sessão volta a chamar `join()` com o novo `e2ee_enabled`, de forma transparente para quem está a usar a aplicação. Do ponto de vista da pessoa, ela nunca saiu da chamada — é um reajuste técnico interno.

## Goals / Non-Goals

**Goals:**
- Tocar o efeito de chegada para quem entra, sempre que a entrada for uma acção genuína da pessoa (chamada vazia ou já ocupada).
- Não tocar na reconexão interna causada por `onE2eeChanged` — não é uma entrada do ponto de vista de quem usa a aplicação.

**Non-Goals:**
- Mudar o mecanismo de detecção de chegada de terceiros (`arrivals()`/`subscribeOccupancy`) — continua a servir bem o caso já existente.
- Tocar som nalgum outro caminho de reconexão automática (ex. queda de rede e reconexão do LiveKit, tratada por `Reconnecting`/`Reconnected` em `wire()`, que não passa por `joinOnce()`).

## Decisions

### 1. Tocar sempre em `joinOnce()`, excepto quando chamado por `onE2eeChanged`

Em vez de verificar `next.remoteParticipants.size === 0` (que restringia o som só à primeira pessoa, já descartado pelo pedido revisto), `joinOnce()` chama `notify("callJoin")` sempre que a ligação LiveKit fica `live`, **excepto** quando o pedido de entrada veio de `onE2eeChanged`. Para distinguir os dois casos, `join()` ganha um parâmetro opcional (`silent?: boolean`), passado como `true` só pela chamada dentro de `onE2eeChanged`; `GreenRoom.tsx` continua a chamar `join()` sem esse parâmetro. Alternativa considerada: tocar sempre, sem excepção. Rejeitada porque faria o som tocar a meio de uma chamada sempre que outra pessoa ligasse ou desligasse o E2EE do canal, sem a pessoa ter feito nada — ruído sem motivo aparente para quem ouve.

### 2. Chamar `notify()` directamente em `callSession.tsx`

Mantida a decisão já tomada na versão anterior desta change: `notify("callJoin")` é chamado directamente no ponto onde a condição é conhecida, sem introduzir um sinal novo só para isto.

## Risks / Trade-offs

- [`join()` ganha um parâmetro novo, ainda que opcional] → aceitável; é a forma mais directa de distinguir "entrada genuína" de "reconexão interna" sem inferir a partir de outro estado reactivo.
- [Alguém podia achar que o som devia tocar também na reconexão do E2EE, como confirmação de que a chamada continua] → fora do pedido; se vier a ser pedido, é uma decisão de produto separada, não assumida aqui.

## Migration Plan

Nenhuma — mudança de comportamento de UI, sem dados persistidos nem migração.
