# Contrato: Visibilidade do painel de Notificações

Âmbito: UI do topbar. Sem API.

## Aberto

| Regra | Obrigatório |
|-------|-------------|
| Painel visível na viewport após clicar «Notificações» | Sim |
| Lista/secções/estado vazio **não** cortados pela barra do topbar | Sim |
| Itens clicáveis (navegação 062) | Sim |
| `aria-expanded` reflecte estado aberto | Sim (já existente) |

## Fechado

| Regra | Obrigatório |
|-------|-------------|
| Painel ausente da árvore interactiva | Sim |
| Sem overlay residual sobre o conteúdo principal | Sim |

## Empilhamento

- O painel MUST pintar por cima do conteúdo da app na região sob o botão.
- Não MUST exigir redesenho do conteúdo das notificações (rótulos 062 OK).

## Viewports

- Estreito: painel utilizável; scroll interno se a lista exceder altura disponível.

## Fora deste contrato

- Novos tipos de notificação, backend, unread rules.
