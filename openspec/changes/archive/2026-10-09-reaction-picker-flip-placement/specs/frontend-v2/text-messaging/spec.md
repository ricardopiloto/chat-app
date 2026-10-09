## ADDED Requirements

### Requirement: Posicionamento do selector de reações
O selector de emoji aberto a partir do botão de reagir de uma mensagem SHALL abrir no lado (acima ou abaixo do botão) que tenha espaço suficiente dentro da área visível da lista de mensagens, preferindo abaixo quando ambos os lados couberem. Quando existe um lado com espaço suficiente, abrir o selector SHALL NOT provocar rolagem da lista de mensagens nem alterar a sua posição de rolagem. Se nenhum dos lados couber por inteiro, o selector SHALL abrir no lado com mais espaço e SHALL reduzir a sua altura para caber nesse espaço (a grelha de emoji passa a rolar internamente), de modo a não ficar cortado nem alargar a área rolável do chat.

#### Scenario: Mensagem junto ao fundo da lista
- **WHEN** o utilizador abre o selector de reações de uma mensagem cujo espaço abaixo do botão, dentro da área visível do chat, é menor que a altura do selector e o espaço acima é suficiente
- **THEN** o selector abre acima do botão e a posição de rolagem do chat não muda

#### Scenario: Mensagem com espaço abaixo
- **WHEN** o utilizador abre o selector de reações de uma mensagem com espaço suficiente abaixo do botão
- **THEN** o selector abre abaixo do botão e a posição de rolagem do chat não muda

#### Scenario: Espaço insuficiente nos dois lados
- **WHEN** o utilizador abre o selector numa área visível em que nem acima nem abaixo cabe a altura completa do selector
- **THEN** o selector abre no lado com mais espaço, com a altura reduzida para caber nesse espaço, a grelha de emoji rola internamente e a posição de rolagem do chat não muda
