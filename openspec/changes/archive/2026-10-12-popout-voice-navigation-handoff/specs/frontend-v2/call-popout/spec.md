# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Entrar em outro canal de voz encerra o popout anterior

Quando o utilizador confirma a entrada num canal de voz diferente do da chamada activa no popout, o sistema SHALL fechar o popout anterior, encerrar a chamada anterior e só então ligar-se ao novo canal de voz. O novo canal SHALL usar o modo e as escolhas de microfone e câmara feitas na sua pré-entrada, sem deixar a chamada anterior activa em paralelo.

#### Scenario: Troca confirmada de canal de voz

- **WHEN** o utilizador com popout aberto confirma a entrada em outro canal de voz
- **THEN** o popout anterior fecha, o utilizador sai da chamada anterior e entra na nova chamada com as escolhas feitas para ela

#### Scenario: Entrada no novo canal falha

- **WHEN** o popout e a chamada anteriores já foram encerrados e a entrada no novo canal falha
- **THEN** a pré-entrada mostra o erro da nova chamada, sem reabrir o popout nem voltar automaticamente à chamada antiga
