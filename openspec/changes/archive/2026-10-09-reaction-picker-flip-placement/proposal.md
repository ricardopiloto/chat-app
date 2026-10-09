## Why

Ao reagir a uma mensagem perto do fundo da área de mensagens, o selector de emoji abre sempre para baixo. Como está posicionado dentro do contentor rolável do chat, estende a altura rolável e força uma rolagem automática do chat para o tornar visível, o que desorienta o utilizador. O selector deve abrir para cima quando não há espaço abaixo.

## What Changes

- O selector de reações passa a escolher o lado de abertura (acima ou abaixo do botão de reagir) conforme o espaço disponível no viewport do chat, em vez de abrir sempre para baixo.
- Quando existe um lado com espaço suficiente, abrir o selector não altera a posição de rolagem do chat; quando nenhum lado cabe, o selector abre no lado com mais espaço e reduz a sua altura para caber.
- Sem alterações ao selector do composer, ao conjunto de emoji, nem à lógica de reações (API, tempo real, agrupamento).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `frontend-v2/text-messaging`: novo requisito "Posicionamento do selector de reações" (delta `ADDED`), que complementa o requisito existente "Reações com emoji em mensagens" sem o alterar.

## Impact

- `frontend/src/chat/logic/popover.ts` (novo): função pura que escolhe o lado e a altura máxima do selector.
- `frontend/src/chat/MessageRow.tsx`: chama essa função ao abrir o selector (hoje `placement="below"` fixo, linha ~203).
- `frontend/src/chat/EmojiPicker.tsx`: `placement` passa a aceitar `"above"` | `"below"`.
- `frontend/src/chat.css`: variantes `.ch-emoji` (acima/abaixo) e altura máxima da grelha.
- `frontend/scripts/verify-picker-placement.mjs` (novo) e script `verify:picker-placement` em `frontend/package.json`.
- Sem impacto no backend, API ou contratos criptográficos.
