# Tasks

## 1. Ocupação no ecrã aberto

- [ ] 1.1 Fazer com que `voice.occupancy` actualize, no mesmo momento, a lista da pré-entrada, o indicador de chamada na barra lateral e o início da sessão, para um cliente que já está nesse canal. Verificar com dois clientes: o que fica no canal vê a outra pessoa entrar, com câmara ligada ou desligada, sem refresh e sem mudar de canal.
- [ ] 1.2 Impedir que uma resposta REST de ocupação iniciada antes desse evento substitua a lista mais recente. Verificar que, se a resposta antiga chega depois, a pessoa que entrou continua na lista.

## 2. Palco

- [ ] 2.1 Quem já está na chamada vê o novo participante no palco, e o vídeo quando a faixa fica disponível, sem sair e voltar a entrar. Verificar com dois clientes já na mesma chamada: ligar a câmara de um faz o vídeo aparecer no palco do outro sem trocar de canal.
