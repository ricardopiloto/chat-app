# Proposal

## Why

No canal de Dados, o composer actual (`DiceComposer`) obriga a editar notação `NdM` à mão para cada ajuste de quantidade. Em sessões de mesa, o jogador quer um atalho persistente: uma barra de dados favoritos, configurável, com cliques rápidos para subir/descer a quantidade — sem abandonar o formulário completo (modificador, rótulo, notação livre).

## What Changes

- Em canais do tipo **Dados** apenas: barra de dados (“taskbar”) junto ao composer existente; o formulário **mantém-se** e **reduz de tamanho** para encaixar a barra.
- O utilizador escolhe, via **checklist**, quais faces padrão ficam visíveis na barra (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`).
- Em cada dado visível: **clique esquerdo** aumenta a quantidade a rolar; **clique direito** diminui (mínimo **1**, máximo alinhado ao limite já existente de `count` 1–20).
- Por agora, **apenas um tipo de dado** entra na rolagem (continua `NdM+K` / um único `sides`); a barra não compõe pools multi-face. O tipo activo na barra sincroniza a notação do formulário.
- A lista de faces visíveis é **persistida no servidor por conta** (preferência do utilizador na instância), não em `localStorage`.
- Canais de Texto e o popover “Lançar dados” **não** ganham esta barra.
- Sem alteração ao RNG, ao overlay 3D, nem aos limites de notação do endpoint `POST /channels/{id}/dice`.

## Capabilities

### New Capabilities

- _(nenhuma — comportamento encaixa na messaging/composer de dados)_

### Modified Capabilities

- `frontend-v2/text-messaging`: requisitos do composer de canal de Dados passam a incluir a barra configurável de dados, interacção L/R-click, sincronização com a notação activa, e persistência server-side da checklist por utilizador.

## Impact

- **Depende de** `chat-dice-rolling` (canal `Dice`, `DiceComposer`, endpoint de rolagem). Esta change assume esse comportamento já entregue ou em paralelo estável.
- **Backend**: nova tabela de preferência por `account_id`; endpoints `GET`/`PUT /api/auth/dice-toolbar` (mesmo padrão de preferências da própria conta em `/auth/...`) para ler/gravar a checklist de faces; validação do conjunto permitido.
- **Frontend**: UI da barra + checklist no rodapé do canal Dados; layout compacto do `DiceComposer`; cliente da API de preferência; i18n.
- **Sem impacto**: popover de Texto, ACL, animação 3D, protocolo multi-`sides` (fora de escopo nesta ronda).
