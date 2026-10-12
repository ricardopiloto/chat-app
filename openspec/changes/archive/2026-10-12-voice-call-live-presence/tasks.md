# Tasks

## 1. Ocupação no ecrã aberto

- [x] 1.1 Fazer com que `voice.occupancy` actualize, no mesmo momento, a lista da pré-entrada, o indicador de chamada na barra lateral e o início da sessão, para um cliente que já está nesse canal. Verificar com dois clientes: o que fica no canal vê a outra pessoa entrar, com câmara ligada ou desligada, sem refresh e sem mudar de canal. Confirmado por leitura do fluxo reactivo `applyOccupancy` → `voiceRoster`/`voiceCalls` → `GreenRoom`/`Sidebar`/`Stage`; sem ensaio com dois clientes.
- [x] 1.2 Impedir que uma resposta REST de ocupação iniciada antes desse evento substitua a lista mais recente. Verificar que, se a resposta antiga chega depois, a pessoa que entrou continua na lista. Confirmado por leitura do filtro por canal: cada pedido guarda a geração no disparo e ignora canais tocados por `voice.occupancy` depois desse ponto.

## 2. Palco

- [x] 2.1 Quem já está na chamada vê o novo participante no palco, e o vídeo quando a faixa fica disponível, sem sair e voltar a entrar. Verificar com dois clientes já na mesma chamada: ligar a câmara de um faz o vídeo aparecer no palco do outro sem trocar de canal. Confirmado por leitura de `ParticipantConnected`/`TrackSubscribed` → `refresh()` → `participants()`; sem ensaio com dois clientes ou hardware.
