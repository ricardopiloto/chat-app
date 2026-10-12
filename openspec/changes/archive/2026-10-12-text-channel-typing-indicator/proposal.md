# Proposal

## Why

Num canal de texto, os membros não conseguem perceber que outra pessoa está a preparar uma mensagem. Um indicador discreto ajuda a coordenar a conversa sem interromper a leitura.

## What Changes

- Mostrar os nomes de membros que estão a digitar no canal de texto actualmente aberto, imediatamente acima da caixa de composição.
- Actualizar o indicador em tempo real, incluindo vários membros, e removê-lo ao parar de digitar, sair do canal ou após inactividade.
- Manter o indicador no fluxo do rodapé, sem cobrir mensagens, a resposta em composição ou o botão «Saltar para o presente».
- Encaminhar apenas estado efémero de digitação pelo WebSocket existente, respeitando a visibilidade e as permissões do canal, sem transmitir o conteúdo digitado nem o persistir.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/text-messaging`: presença de digitação em canais de texto e apresentação do indicador sem sobreposição dos controlos existentes.

## Impact

- Frontend: composer e página do canal, estilos, catálogo de traduções, ligação WebSocket e estado do shell.
- Backend: recepção de eventos de digitação no `/ws`, autorização por canal e difusão apenas aos membros com acesso de leitura.
- Sem migração de base de dados nem alteração do formato das mensagens cifradas.
