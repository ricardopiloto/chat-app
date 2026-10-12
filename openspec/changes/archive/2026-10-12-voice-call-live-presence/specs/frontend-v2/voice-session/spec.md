# Spec Delta

## ADDED Requirements

### Requirement: A entrada numa chamada actualiza o canal na hora

Quando uma pessoa entra num canal de voz ou vídeo, ou muda o estado da câmara, do microfone ou da partilha de ecrã, o sistema SHALL actualizar nesse momento todos os clientes que já têm esse canal aberto. A actualização SHALL incluir quem está na chamada, o estado de câmara, microfone e partilha, e o início da sessão. SHALL acontecer sem recarregar a página e sem sair do canal e voltar. Quem já está na chamada SHALL ver a pessoa no palco, e o vídeo assim que a faixa estiver disponível, sem sair e voltar a entrar. Um resultado de ocupação pedido antes desta entrada SHALL NOT substituir o estado mais recente.

#### Scenario: Quem está no canal vê a entrada

- **WHEN** uma pessoa entra na chamada de um canal de voz e outra pessoa já tem esse canal aberto, fora da chamada
- **THEN** a lista de quem está na chamada e o indicador de chamada activa passam a incluir a pessoa que entrou, sem refresh e sem mudar de canal

#### Scenario: A câmara aparece sem sair do ecrã

- **WHEN** uma pessoa que já está na chamada liga a câmara
- **THEN** os outros clientes com esse canal aberto passam a mostrar a câmara ligada, e quem está no palco passa a ver o vídeo, sem sair da chamada

#### Scenario: Um pedido antigo não apaga a entrada

- **WHEN** a resposta de um pedido de ocupação iniciado antes da entrada chega depois do aviso em tempo real
- **THEN** a pessoa que entrou continua visível nos ecrãs que já estavam abertos
