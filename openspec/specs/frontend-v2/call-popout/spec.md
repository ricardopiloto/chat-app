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
Ao accionar "Abrir em nova janela", o sistema SHALL abrir uma nova janela do sistema operativo, redimensionável e arrastável para qualquer monitor independentemente da janela principal, mostrando só a grade de vídeo da chamada activa (sem barra lateral, chat, ou resto da aplicação).

#### Scenario: Popout aberto é uma janela própria
- **WHEN** o utilizador acciona "Abrir em nova janela"
- **THEN** uma nova janela do sistema operativo abre, mostrando a grade de vídeo, e pode ser movida para outro monitor sem mover a janela principal

### Requirement: O popout liga-se à chamada de forma independente, só para visualizar
A janela de popout SHALL estabelecer a sua própria ligação à sala da chamada (token de `voice/popout-viewer-token`), SHALL mostrar os participantes e as suas câmaras/ecrãs partilhados tal como a grade principal, e SHALL NOT permitir controlar mic/câmara a partir dela — esses controlos continuam só na janela principal.

#### Scenario: Popout mostra os participantes em tempo real
- **WHEN** um participante liga ou desliga a câmara durante uma chamada com popout aberto
- **THEN** a grade no popout actualiza-se tal como a grade principal actualizaria

#### Scenario: Popout não tem controlos de mic/câmara
- **WHEN** o utilizador olha para a janela de popout
- **THEN** não há nenhum controlo para ligar/desligar o próprio mic ou câmara nessa janela

### Requirement: A janela principal não duplica a grade enquanto o popout está aberto
Enquanto um popout estiver aberto para uma chamada, a janela principal SHALL NOT mostrar o PiP flutuante nem a grade activa dessa chamada. A indicação de que a chamada está noutra janela, com a acção para a trazer de volta, SHALL aparecer somente quando a janela principal estiver na tela do canal de voz dessa chamada; SHALL NOT aparecer em canais de texto, outras áreas ou na pré-entrada de outro canal de voz.

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
Quando o utilizador confirma a entrada num canal de voz diferente do da chamada activa no popout, o sistema SHALL fechar o popout anterior, encerrar a chamada anterior e só então ligar-se ao novo canal de voz. O novo canal SHALL usar o modo e as escolhas de microfone e câmara feitas na sua pré-entrada, sem deixar a chamada anterior activa em paralelo.

#### Scenario: Troca confirmada de canal de voz
- **WHEN** o utilizador com popout aberto confirma a entrada em outro canal de voz
- **THEN** o popout anterior fecha, o utilizador sai da chamada anterior e entra na nova chamada com as escolhas feitas para ela

#### Scenario: Entrada no novo canal falha
- **WHEN** o popout e a chamada anteriores já foram encerrados e a entrada no novo canal falha
- **THEN** a pré-entrada mostra o erro da nova chamada, sem reabrir o popout nem voltar automaticamente à chamada antiga

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
