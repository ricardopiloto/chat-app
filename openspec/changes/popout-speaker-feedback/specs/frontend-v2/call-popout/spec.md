# Spec Delta

## ADDED Requirements

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
