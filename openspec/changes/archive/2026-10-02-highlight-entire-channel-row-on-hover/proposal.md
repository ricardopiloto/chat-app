# Proposal

## Why

Na lista de canais, os controlos de renomear e opções podem sobrepor-se ao nome quando ele é curto, interceptando o clique destinado a abrir o canal. Destacar a linha inteira no hover torna clara a área de seleção e evita que o realce dependa do comprimento do nome.

Medido na aplicação em execução (sidebar com ~224 px de largura útil): a linha de "geral" tem só **89 px** e a de "mesa" 171 px, porque o contentor do menu de contexto da linha é `inline-flex` e encolhe ao conteúdo. O realce de hover já existe no contentor da linha, mas só cobre essa largura. Os controlos (56 px, posicionados à direita da linha encolhida) ficam por cima do nome: em "geral" cobrem 29 a 85 px e o texto ocupa 44 a 77 px. Como estão com `opacity: 0` mas ainda recebem ponteiro, **interceptam o clique mesmo sem hover** (toque, ou clique antes de o ponteiro se mover): tocar em "geral" abre renomear ou definições em vez de abrir o canal.

## What Changes

- Alterar o realce de hover dos canais para cobrir toda a linha da sidebar.
- Fazer a linha ocupar a largura inteira da lista (causa raiz: o contentor do menu de contexto encolhe ao conteúdo), em vez de depender do comprimento do nome.
- Manter os controlos de renomear e opções acessíveis sem impedir a seleção do canal quando o ponteiro está sobre a área do nome.
- Controlos escondidos não recebem ponteiro: só passam a ser clicáveis quando estão visíveis (hover ou foco).
- Realce também no foco por teclado e feedback de hover coerente na linha do canal selecionado.

## Capabilities

### New Capabilities

### Modified Capabilities
- `frontend-v2/channel-management`: especificar que o hover destaca a linha inteira e que a área do canal continua selecionável mesmo quando os controlos aparecem.
- `frontend-v2/app-shell`: requisito novo para a linha de canal da sidebar (largura total, realce em hover e foco, controlos escondidos sem ponteiro, toque).

## Impact

- Sidebar/lista de canais do frontend v2 (`shell/Sidebar.tsx`), incluindo os estilos da linha e os controlos contextuais de canal.
- `components/ui/Overlay.tsx` (`ContextMenu`) e `components/ui.css` (`.context-target`): o contentor passa a poder ocupar a largura do pai. A página de fundação (`pages/Foundation.tsx`) usa o mesmo componente e não deve mudar de aspeto.
- Sem backend, sem permissões novas e sem alteração de textos.
