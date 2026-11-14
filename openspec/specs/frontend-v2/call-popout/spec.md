# call-popout Specification

## Purpose

Permite, dentro do shell nativo (Electron), abrir a grade de vídeo de uma chamada numa janela do sistema operativo separada — ao contrário do PiP existente, que fica preso à janela principal — para o utilizador a poder mover para outro monitor.

## Requirements

### Requirement: A opção de popout só aparece em modo nativo
O sistema SHALL apresentar a acção "Abrir em nova janela" só quando a aplicação corre dentro do shell nativo, e SHALL NOT a apresentar no build web (onde uma segunda janela confiável não é possível).

#### Scenario: Build web não mostra a opção
- **WHEN** a aplicação corre num browser comum, numa chamada activa
- **THEN** não existe nenhuma acção de "abrir em nova janela" visível

#### Scenario: Shell nativo mostra a opção
- **WHEN** a aplicação corre dentro do shell nativo, numa chamada activa
- **THEN** a acção "Abrir em nova janela" está visível junto dos controlos existentes do PiP/palco

### Requirement: Abrir o popout cria uma janela do sistema independente
Ao accionar "Abrir em nova janela", o sistema SHALL abrir uma nova janela do sistema operativo, redimensionável e arrastável para qualquer monitor independentemente da janela principal, mostrando só a grade de vídeo da chamada activa (sem barra lateral, chat, ou resto da aplicação). A janela SHALL poder ser redimensionada até um mínimo de 240×180 pixels, permitindo uma coluna estreita de tiles.

#### Scenario: Popout aberto é uma janela própria
- **WHEN** o utilizador acciona "Abrir em nova janela"
- **THEN** uma nova janela do sistema operativo abre, mostrando a grade de vídeo, e pode ser movida para outro monitor sem mover a janela principal

#### Scenario: Popout pode ser encolhido até um tamanho mínimo pequeno
- **WHEN** o utilizador arrasta a borda da janela de popout para a tornar mais pequena
- **THEN** a janela encolhe até, no mínimo, 240 pixels de largura por 180 pixels de altura, sem ficar mais pequena do que isso

### Requirement: O popout liga-se à chamada de forma independente, só para visualizar

The popout window SHALL establish its own view-only LiveKit room using the `voice/popout-viewer-token`, and SHALL display participants, cameras, and shared screens as the main grid would. Its viewer room SHALL NOT publish microphone or camera media. The popout MAY present controls for the owning main window's microphone, camera, deafen, and call leave; those actions SHALL execute in the owning session rather than the viewer room.

#### Scenario: Popout mostra os participantes em tempo real

- **WHEN** a participant changes camera state while the popout is open
- **THEN** the popout grid updates as the main grid would

#### Scenario: Popout microphone control

- **WHEN** an eligible user toggles the microphone in the popout
- **THEN** the owning main call changes microphone state and the viewer room remains receive-only

#### Scenario: Popout não tem controlos de mic/câmara

- **WHEN** the user looks at the popout controls
- **THEN** microphone and camera controls target the owner call, while the separate viewer LiveKit connection publishes no local microphone or camera track

### Requirement: A janela principal não duplica a grade enquanto o popout está aberto
Enquanto um popout estiver aberto para uma chamada, a janela principal SHALL NOT mostrar o PiP flutuante nem a grade activa dessa chamada. A indicação de que a chamada está noutra janela, com a acção para a trazer de volta, SHALL aparecer somente quando a janela principal estiver na tela do canal de voz dessa chamada; SHALL NOT aparecer em canais de texto, outras áreas ou no estado de ligação de outro canal de voz.

#### Scenario: Janela principal mostra o estado "noutra janela"
- **WHEN** o popout está aberto e o utilizador vê o canal de voz da chamada activa na janela principal
- **THEN** essa tela mostra a indicação de que a chamada está na janela de popout e a acção para a trazer de volta, sem duplicar a grade

#### Scenario: Navegação para canal de texto ou outra área
- **WHEN** o popout está aberto e o utilizador navega para um canal de texto ou outra área da aplicação
- **THEN** essa área é mostrada normalmente, sem a indicação «Bring it back» ou PiP da chamada, e a chamada e o popout continuam activos

#### Scenario: Pré-entrada de outro canal de voz
- **WHEN** o popout está aberto e o utilizador navega para outro canal de voz sem confirmar a entrada
- **THEN** a pré-entrada desse canal é mostrada sem «Bring it back», e a chamada anterior continua activa no popout

#### Scenario: Trazer de volta fecha o popout
- **WHEN** o utilizador acciona a acção de trazer a chamada de volta à janela principal no canal original
- **THEN** a janela de popout fecha, e o PiP/grade principal volta a funcionar normalmente sem terminar a chamada

### Requirement: Entrar em outro canal de voz encerra o popout anterior
Quando o utilizador abre outro canal de voz enquanto a chamada activa está no popout, o sistema SHALL fechar o popout e encerrar a chamada anterior antes de entrar directamente no novo canal. A nova chamada SHALL começar com câmara desligada e microfone conforme a preferência, se for permitido falar.

#### Scenario: Troca confirmada de canal de voz
- **WHEN** o utilizador com popout aberto abre outro canal de voz
- **THEN** o popout fecha e a nova chamada inicia sem confirmação manual

#### Scenario: Entrada no novo canal falha
- **WHEN** a chamada antiga já terminou e a entrada no novo canal falha
- **THEN** aparece o erro com acção de tentar novamente, sem reabrir a chamada antiga

### Requirement: Fechar o popout não termina a chamada
Fechar a janela de popout (pela acção de trazer de volta, ou pelo botão de fechar nativo da janela) SHALL NOT terminar a chamada nem afectar a ligação da janela principal — só termina a ligação de visualização desse popout.

#### Scenario: Fechar a janela de popout pelo X nativo
- **WHEN** o utilizador fecha a janela de popout directamente (botão de fechar do sistema operativo)
- **THEN** a chamada continua activa na janela principal, sem interrupção

### Requirement: O popout não devolve o áudio de quem fala

Enquanto a janela de popout está aberta, ela SHALL NOT reproduzir áudio de nenhum participante, incluindo o microfone da pessoa que abriu o popout. O som da chamada SHALL continuar a sair só da janela principal. Fechar o popout SHALL NOT cortar esse som. A grade de vídeo do popout SHALL continuar a mostrar câmaras e partilhas de ecrã.

#### Scenario: Quem fala não se ouve pelo popout

- **WHEN** uma pessoa está na chamada com o microfone ligado e abre o popout
- **THEN** não ouve a própria voz a sair pela janela de popout

#### Scenario: Os outros continuam a ouvir-se na janela principal

- **WHEN** o popout está aberto e outro participante fala
- **THEN** essa voz ouve-se uma vez, na janela principal, e a janela de popout não a reproduz outra vez

#### Scenario: Fechar o popout mantém o som

- **WHEN** a pessoa fecha a janela de popout durante a chamada
- **THEN** a chamada continua e o áudio dos outros participantes continua na janela principal

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

### Requirement: Popout controls reveal within reserved window edges

The desktop popout SHALL place its microphone, camera, deafen, and Hang Up controls in a fixed bottom-edge overlay, with a small empty top inset and no top information bar. The grid and spotlight layout SHALL reserve both edge insets while controls are hidden or visible. Controls SHALL be hidden by default, visible while the pointer hovers anywhere within the popout or keyboard focus is within the controls, and hidden again after the pointer leaves and focus is outside the controls. Revealing controls SHALL NOT cover tiles or shift their layout. At the 240×180 minimum window size, all four controls SHALL fit in one row and at least 80px of tile area SHALL remain below the native title bar.

#### Scenario: Reveal and hide controls

- **WHEN** the popout is idle, then the pointer enters anywhere in the popout and later leaves without control focus
- **THEN** the controls are initially hidden, appear on entry, and hide again on leave

#### Scenario: Keyboard access

- **WHEN** keyboard focus enters a popout control while the pointer is outside the window
- **THEN** the controls remain visible until focus leaves them

#### Scenario: Stable grid at minimum size

- **WHEN** controls are revealed in a 240×180 popout with a grid or spotlight layout
- **THEN** the controls occupy their reserved bottom strip without covering or shifting tiles, and at least 80px of tile area remains

### Requirement: Popout controls act on the owning call

While the desktop popout is open for a live call, it SHALL provide accessible microphone, camera, deafen, and Hang Up controls with authoritative state from the owning session. Mic and camera controls SHALL be disabled for listen-only users. Hang Up SHALL end the whole call; closing the popout window SHALL only close that view. Commands for a stale channel or unavailable owner SHALL NOT change another call.

#### Scenario: Toggle and state feedback

- **WHEN** a user toggles mic, camera, or deafen in the popout
- **THEN** the real call changes and the popout button reflects the owner's resulting state

#### Scenario: Listen-only call

- **WHEN** a listen-only user views the popout controls
- **THEN** microphone and camera controls are disabled with an explanation

#### Scenario: Hang up versus close

- **WHEN** the user selects Hang Up in the popout
- **THEN** the owning call ends; when the user only closes the popout window, the call remains active

#### Scenario: Owner unavailable

- **WHEN** the owning main renderer is gone or has moved to a different call
- **THEN** popout commands are disabled or rejected and do not affect any other session
