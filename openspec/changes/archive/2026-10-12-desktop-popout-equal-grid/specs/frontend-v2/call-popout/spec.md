# Spec Delta

## ADDED Requirements

### Requirement: A grade do popout divide o espaço disponível em partes iguais

Dentro da janela de popout, quando a grade não tem nenhum ecrã partilhado em destaque, o sistema SHALL dimensionar todos os tiles de participantes (com ou sem câmara ligada) com exactamente o mesmo tamanho, SHALL distribuí-los de forma a preencher toda a área disponível da janela (sem espaço vazio sobrante nem scroll), e SHALL recalcular esse tamanho sempre que o número de participantes ou o tamanho da janela mudar — reduzindo o tamanho dos tiles conforme a janela encolhe, em vez de cortar conteúdo ou introduzir barras de deslocamento.

#### Scenario: Um só participante preenche a janela

- **WHEN** a janela de popout está aberta e há exactamente um participante na chamada
- **THEN** o tile desse participante ocupa toda a área disponível da janela de popout

#### Scenario: Vários participantes dividem o espaço em partes iguais

- **WHEN** a janela de popout está aberta e há N participantes na chamada (N > 1), nenhum ecrã partilhado em destaque
- **THEN** todos os N tiles têm exactamente o mesmo tamanho entre si, e juntos preenchem toda a área disponível da janela, sem espaço vazio sobrante

#### Scenario: Janela de popout redimensionada para menor

- **WHEN** o utilizador redimensiona a janela de popout para um tamanho mais pequeno, com vários participantes na chamada
- **THEN** o tamanho de todos os tiles diminui de forma igual para continuar a preencher a janela, sem nenhum tile ser cortado e sem aparecer scroll

#### Scenario: Participante entra ou sai durante o popout

- **WHEN** um participante entra ou sai da chamada enquanto o popout está aberto
- **THEN** o tamanho de todos os tiles (incluindo os já existentes) é recalculado para o novo número de participantes, continuando a preencher toda a janela em partes iguais
