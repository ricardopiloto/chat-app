# Spec Delta

## Purpose

Permite, dentro do shell nativo (Electron), abrir a grade de vídeo de uma chamada numa janela do sistema operativo separada — ao contrário do PiP existente, que fica preso à janela principal — para o utilizador a poder mover para outro monitor.

## ADDED Requirements

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

Enquanto um popout estiver aberto para uma chamada, a janela principal SHALL NOT mostrar o PiP flutuante nem a grade activa para essa mesma chamada, e SHALL mostrar um estado que indica que a chamada está noutra janela, com uma acção para a trazer de volta (fechar o popout).

#### Scenario: Janela principal mostra o estado "noutra janela"

- **WHEN** o popout está aberto e o utilizador navega para fora do canal de voz na janela principal
- **THEN** em vez do PiP flutuante habitual, a janela principal mostra uma indicação de que a chamada está na janela de popout

#### Scenario: Trazer de volta fecha o popout

- **WHEN** o utilizador acciona a acção de trazer a chamada de volta à janela principal
- **THEN** a janela de popout fecha, e o PiP/grade principal volta a funcionar normalmente

### Requirement: Fechar o popout não termina a chamada

Fechar a janela de popout (pela acção de trazer de volta, ou pelo botão de fechar nativo da janela) SHALL NOT terminar a chamada nem afectar a ligação da janela principal — só termina a ligação de visualização desse popout.

#### Scenario: Fechar a janela de popout pelo X nativo

- **WHEN** o utilizador fecha a janela de popout directamente (botão de fechar do sistema operativo)
- **THEN** a chamada continua activa na janela principal, sem interrupção
