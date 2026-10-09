# Proposal

## Why

O selector de reações mede 320px e alinha-se à direita do botão. Numa janela de 390px ainda cabe. Numa janela de 320px o lado esquerdo fica 67px fora do ecrã, e o utilizador não alcança parte da grelha. A escolha acima/abaixo já está tratada; a largura ficou de fora de propósito.

## What Changes

- O selector de reações passa a caber na largura visível da lista, sem cortar emoji à esquerda.
- O selector do composer, o conjunto de emoji e a escolha acima/abaixo não mudam.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `frontend-v2/text-messaging`: novo requisito para o selector de reações caber na largura visível. Complementa o requisito de posicionamento vertical da change `reaction-picker-flip-placement`, sem o alterar.

## Impact

- `frontend/src/chat.css` (largura e alinhamento de `.ch-emoji` na linha de mensagem).
- Possivelmente `frontend/src/chat/MessageRow.tsx` se o alinhamento não chegar em CSS.
- Sem impacto no backend, na API ou no selector do composer.
