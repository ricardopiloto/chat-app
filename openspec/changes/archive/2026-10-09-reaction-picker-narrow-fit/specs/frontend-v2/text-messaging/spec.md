# Spec Delta

## ADDED Requirements

### Requirement: O selector de reações cabe na largura visível
O selector de emoji aberto a partir do botão de reagir SHALL permanecer inteiro dentro da largura visível da lista de mensagens. Nenhum emoji da grelha SHALL ficar fora do ecrã à esquerda ou à direita. A escolha de abrir acima ou abaixo do botão SHALL permanecer a já definida.

#### Scenario: Janela estreita
- **WHEN** o utilizador abre o selector de reações numa janela em que 320px alinhados à direita do botão ultrapassam o bordo esquerdo da área visível
- **THEN** o selector inteiro fica dentro dessa área e a grelha de emoji continua utilizável

#### Scenario: Janela com largura de sobra
- **WHEN** o utilizador abre o selector de reações numa janela em que os 320px cabem à direita do botão
- **THEN** o selector mantém a largura e o alinhamento actuais
