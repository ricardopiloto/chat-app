# Proposal

## Why

A pill "Saltar para o presente" existe em código (`frontend/src/chat/ChannelPage.tsx:315-317`, CSS em `frontend/src/chat.css:108`) e implementa fielmente o requisito actual — `openspec/specs/frontend-v2/text-messaging/spec.md:131-132`, que diz: *"O sistema SHALL apresentar uma pill... quando o utilizador está desviado do fundo da lista de mensagens **e chegam mensagens novas**"*. Isto é condicionado por dois sinais em `ChannelPage.tsx:77-78` (`pinned`, `away`): a pill só aparece quando `!pinned() && away() > 0` (linha 315). `away` só é incrementado dentro do `createEffect` da linha 134-150, que só corre quando uma mensagem **nova chega** enquanto o utilizador não está fixo no fundo (linha 149: `else if (fromOthers > 0) setAway((n) => n + fromOthers)`).

O utilizador reportou (e o requisito original, confirmado por `docs/v2/parity-checklist.md:117`, TXT-14, não impõe essa restrição) que simplesmente rolar para mensagens mais antigas — sem nenhuma mensagem nova chegar nesse meio tempo — deveria já mostrar a opção de voltar ao presente. Hoje isso não acontece: `pinned()` fica `false` ao rolar para cima, mas `away()` permanece em `0` indefinidamente até (se alguma vez) chegar uma mensagem nova, e a pill nunca aparece só por causa do scroll. Isto é uma lacuna no requisito tal como está escrito, não um bug de implementação — o código faz exactamente o que o requisito pede; é o requisito que precisa de mudar.

## What Changes

- `openspec/specs/frontend-v2/text-messaging/spec.md`, requisito "Saltar para o presente": a condição de aparecimento deixa de exigir mensagens novas — passa a ser "sempre que o utilizador está desviado do fundo da lista", com a contagem de mensagens novas a aparecer **quando houver alguma**, não como pré-condição para a pill existir.
- `frontend/src/chat/ChannelPage.tsx:315`: a condição do `<Show>` passa de `!pinned() && away() > 0` para `!pinned()`; o badge de contagem (`<Badge>`) passa a ter a sua própria condição interna (`away() > 0`), para continuar a mostrar o número quando houver mensagens novas e não mostrar nada quando não houver.
- Sem alteração a `pinned`/`away`/`nearBottom`/`toBottom`/`jump` em si — a lógica de detectar "estou no fundo" e de "voltar ao fundo" já está correcta; só a condição de visibilidade da pill muda.

## Capabilities

### Modified Capabilities
- `frontend-v2/text-messaging`: requisito "Saltar para o presente" deixa de depender de mensagens novas chegarem — passa a reagir só ao desvio do fundo da lista.

## Impact

- **Frontend** (`frontend/src/chat/ChannelPage.tsx`): mudança de uma condição de renderização; sem mudança de API, sem mudança de backend.
- **Sem impacto**: qualquer outro comportamento do canal de texto (agrupamento, anexos, menções, etc.).
