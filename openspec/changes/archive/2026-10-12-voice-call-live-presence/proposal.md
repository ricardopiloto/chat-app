# Proposal

## Why

Quando alguém entra numa chamada de voz ou vídeo, quem já está nesse canal não vê a mudança. A lista, o estado da câmara e o palco ficam como estavam até um refresh da página ou até sair do canal e voltar, que volta a pedir a ocupação ao servidor. A entrada e a câmara têm de aparecer na hora, para toda a gente que está no canal.

## What Changes

- Quem tem o canal de voz aberto vê, sem sair do ecrã, a pessoa que acabou de entrar, se a câmara ou o microfone estão ligados, e o início da sessão.
- Quem já está na chamada vê essa pessoa e o vídeo no palco assim que a faixa fica disponível, sem sair e voltar a entrar.
- A barra lateral do mesmo canal actualiza no mesmo momento.
- Um pedido de ocupação mais antigo, que chegue depois do evento em tempo real, não pode apagar essa actualização. Recarregar a página ou trocar de canal deixa de ser a forma de a ver.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/voice-session`: a ocupação e o vídeo de uma chamada passam a ser visíveis na hora em todos os ecrãs desse canal que já estão abertos.

## Impact

- O cliente que aplica `voice.occupancy` (`frontend/src/shell/state.tsx`) e os ecrãs que o lêem: pré-entrada, barra lateral, palco.
- A sessão LiveKit (`frontend/src/voice/callSession.tsx`) para quem já está na sala.
- O backend já emite `voice.occupancy` ao entrar e ao mudar câmara, microfone ou partilha. Esta change não acrescenta um endpoint. Não introduz polling.
