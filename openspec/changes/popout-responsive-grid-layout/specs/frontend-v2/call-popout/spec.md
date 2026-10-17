# Spec Delta

## MODIFIED Requirements

### Requirement: Abrir o popout cria uma janela do sistema independente
Ao accionar "Abrir em nova janela", o sistema SHALL abrir uma nova janela do sistema operativo, redimensionável e arrastável para qualquer monitor independentemente da janela principal, mostrando só a grade de vídeo da chamada activa (sem barra lateral, chat, ou resto da aplicação). A janela SHALL poder ser redimensionada até um mínimo de 240×180 pixels, permitindo uma coluna estreita de tiles.

#### Scenario: Popout aberto é uma janela própria
- **WHEN** o utilizador acciona "Abrir em nova janela"
- **THEN** uma nova janela do sistema operativo abre, mostrando a grade de vídeo, e pode ser movida para outro monitor sem mover a janela principal

#### Scenario: Popout pode ser encolhido até um tamanho mínimo pequeno
- **WHEN** o utilizador arrasta a borda da janela de popout para a tornar mais pequena
- **THEN** a janela encolhe até, no mínimo, 240 pixels de largura por 180 pixels de altura, sem ficar mais pequena do que isso

### Requirement: A grade do popout divide o espaço disponível em partes iguais

Dentro da janela de popout, quando a grade não tem nenhum ecrã partilhado em destaque, o sistema SHALL dimensionar todos os tiles de participantes (com ou sem câmara ligada) com exactamente o mesmo tamanho, SHALL distribuí-los de forma a preencher toda a área disponível da janela (sem espaço vazio sobrante nem scroll), e SHALL recalcular esse tamanho sempre que o número de participantes ou o tamanho da janela mudar — reduzindo o tamanho dos tiles conforme a janela encolhe, em vez de cortar conteúdo ou introduzir barras de deslocamento.

Quando a área disponível da grade for estreita e alta (a proporção largura/altura for inferior a um limiar fixo de 0.7, ou seja, a altura for mais do que ~1.4× a largura) e houver mais de um tile, o sistema SHALL dispor todos os tiles numa única coluna vertical, empilhados de cima para baixo, em vez de usar a disposição em múltiplas colunas que a maximização de tamanho escolheria noutras proporções. A ordem de empilhamento SHALL seguir a mesma ordem em que os tiles já são exibidos na grade hoje (participante local primeiro, participantes remotos depois na ordem já exposta pela ligação da chamada, partilhas de ecrã por último).

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
