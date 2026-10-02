# Spec Delta

## ADDED Requirements

### Requirement: Linha de canal na sidebar
O sistema SHALL apresentar cada canal da sidebar como uma linha que ocupa a largura inteira da lista, com a mesma largura qualquer que seja o comprimento do nome, de modo que a área realçada e a área clicável para abrir o canal coincidam. A linha SHALL ser realçada em hover e em foco por teclado, e a linha do canal selecionado SHALL manter o seu estado de selecionado e continuar a reagir ao hover sem perder o contraste. Os controlos contextuais de gestão (renomear e opções) SHALL ficar sobre a linha apenas quando estão visíveis; enquanto escondidos, NÃO SHALL receber cliques nem toques.

#### Scenario: Largura igual com nomes curtos e longos
- **WHEN** a lista mostra um canal de nome curto e outro de nome longo
- **THEN** as duas linhas têm a mesma largura, igual à da lista, e o hover realça a linha toda nos dois casos

#### Scenario: Clicar ao lado de um nome curto
- **WHEN** o utilizador clica na linha de um canal de nome curto, à direita do texto e fora dos controlos
- **THEN** o canal é aberto

#### Scenario: Controlos escondidos não interceptam
- **WHEN** o ponteiro ainda não está sobre a linha, ou o dispositivo é de toque e não tem hover, e o utilizador clica ou toca sobre o nome do canal
- **THEN** o canal é aberto e nem a renomeação nem as definições do canal são ativadas

#### Scenario: Toque na zona dos controlos
- **WHEN** o dispositivo não tem hover e o utilizador toca na zona da linha onde os controlos aparecem com um ponteiro
- **THEN** o canal é aberto e a renomeação e as definições só ficam acessíveis pelo toque longo (menu de contexto) ou por teclado

#### Scenario: Foco por teclado
- **WHEN** o foco do teclado chega à linha de um canal gerível
- **THEN** a linha fica realçada, os controlos tornam-se visíveis e acessíveis por teclado, e o botão do canal continua a poder ser ativado

#### Scenario: Canal selecionado com hover
- **WHEN** o ponteiro passa sobre a linha do canal que está selecionado
- **THEN** a linha continua a mostrar que está selecionada, com realce de hover distinguível, sem piscar para o estado de não selecionado

#### Scenario: Gaveta em ecrã pequeno
- **WHEN** a largura da janela é inferior a 768 px e a sidebar está na gaveta
- **THEN** as linhas ocupam a largura da gaveta e tocar no nome abre o canal sem ativar os controlos
