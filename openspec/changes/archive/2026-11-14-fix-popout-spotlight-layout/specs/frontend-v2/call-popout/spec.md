# Spec Delta

## MODIFIED Requirements

### Requirement: A grade do popout divide o espaço disponível em partes iguais

Dentro da janela de popout, quando a grade não tem nenhum ecrã partilhado em destaque, o sistema SHALL dimensionar todos os tiles de participantes (com ou sem câmara ligada) com exactamente o mesmo tamanho, SHALL distribuí-los de forma a preencher toda a área disponível da janela (sem espaço vazio sobrante nem scroll), e SHALL recalcular esse tamanho sempre que o número de participantes ou o tamanho da janela mudar — reduzindo o tamanho dos tiles conforme a janela encolhe, em vez de cortar conteúdo ou introduzir barras de deslocamento.

Quando a área disponível da grade for estreita e alta (a proporção largura/altura for inferior a um limiar fixo de 0.7, ou seja, a altura for mais do que ~1.4× a largura) e houver mais de um tile, o sistema SHALL dispor todos os tiles numa única coluna vertical, empilhados de cima para baixo, em vez de usar a disposição em múltiplas colunas que a maximização de tamanho escolheria noutras proporções. A ordem de empilhamento SHALL seguir a mesma ordem em que os tiles já são exibidos na grade hoje (participante local primeiro, participantes remotos depois na ordem já exposta pela ligação da chamada, partilhas de ecrã por último).

Quando um ecrã partilhado estiver em destaque ("spotlight"), o sistema SHALL continuar a preencher toda a área disponível da janela de popout com o palco principal e a faixa lateral, do mesmo modo que preenche a grade sem destaque — SHALL NOT colapsar para uma faixa fina com espaço vazio sobrante.

#### Scenario: Um só participante preenche a janela

- **WHEN** a janela de popout está aberta e há exactamente um participante na chamada
- **THEN** o tile desse participante ocupa toda a área disponível da janela de popout

#### Scenario: Vários participantes dividem o espaço em partes iguais

- **WHEN** a janela de popout está aberta e há N participantes na chamada (N > 1), nenhum ecrã partilhado em destaque, e a proporção da janela não é estreita/alta
- **THEN** todos os N tiles têm exactamente o mesmo tamanho entre si, dispostos em uma grade de múltiplas colunas quando couber, e juntos preenchem toda a área disponível da janela, sem espaço vazio sobrante

#### Scenario: Janela de popout redimensionada para menor

- **WHEN** o utilizador redimensiona a janela de popout para um tamanho mais pequeno, com vários participantes na chamada
- **THEN** o tamanho de todos os tiles diminui de forma igual para continuar a preencher a janela, sem nenhum tile ser cortado e sem aparecer scroll

#### Scenario: Participante entra ou sai durante o popout

- **WHEN** um participante entra ou sai da chamada enquanto o popout está aberto
- **THEN** o tamanho de todos os tiles (incluindo os já existentes) é recalculado para o novo número de participantes, continuando a preencher toda a janela em partes iguais

#### Scenario: Janela estreita e alta empilha os tiles numa coluna única

- **WHEN** a janela de popout está estreita e alta (proporção largura/altura abaixo de 0.7) e há mais de um participante ou partilha de ecrã
- **THEN** todos os tiles são dispostos numa única coluna vertical, cada um ocupando toda a largura disponível, empilhados na ordem já usada pela grade (local, depois remotos, depois partilhas de ecrã)

#### Scenario: Janela deixa de ser estreita e volta a usar múltiplas colunas
- **WHEN** o utilizador redimensiona uma janela de popout que estava em coluna única para uma proporção que já não é estreita/alta
- **THEN** a grade volta a dispor os tiles em múltiplas colunas, escolhendo o número de colunas que maximiza o tamanho dos tiles, como acontecia antes de entrar em coluna única

#### Scenario: Destacar uma partilha de ecrã preenche a janela

- **WHEN** a janela de popout está aberta e o utilizador destaca ("spotlight") uma partilha de ecrã, promovendo-a a palco principal
- **THEN** o palco principal e a faixa lateral continuam a preencher toda a área disponível da janela, sem colapsar para uma faixa fina nem deixar espaço vazio

#### Scenario: Remover o destaque volta a preencher a grade normal

- **WHEN** o utilizador remove o destaque de uma partilha de ecrã na janela de popout
- **THEN** a grade volta ao comportamento de partes iguais já especificado, continuando a preencher toda a janela
