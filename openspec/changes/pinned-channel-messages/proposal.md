# Proposal

## Why

Mensagens importantes perdem-se no histórico do canal. Uma mensagem pinada dá a todos os membros um ponto de referência permanente e um caminho direto até o conteúdo original.

## What Changes

- Gestores do canal podem pinar ou despinar uma mensagem de texto; existe no máximo um pin por canal.
- A substituição de um pin exige aviso e confirmação antes de remover o anterior.
- Todos os membros com acesso ao canal veem um informativo persistente e podem clicar nele para ir à mensagem original com destaque temporário.
- O estado do pin é persistido e propagado em tempo real; a exclusão da mensagem pinada remove o informativo.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `frontend-v2/text-messaging`: pin único, indicação e navegação até a mensagem.
- `frontend-v2/channel-management`: gestão do pin sujeita à permissão de gestão do canal.

## Impact

Migração SQLite, modelos e consultas de canal/mensagem, rotas REST, autorização, evento WebSocket, estado e interface do canal, menu de mensagem, traduções e testes backend/frontend. Não há nova dependência nem edição de conteúdo de mensagem.
