# Proposal

## Why

O utilizador escolheu entrar na chamada ao clicar num canal de voz, sem o passo manual da pré-entrada. Ligar a câmara deve ser uma escolha explícita já dentro da chamada.

## What Changes

- **BREAKING** (comportamento): abrir um canal de voz inicia a entrada imediatamente, sem tela de pré-entrada.
- Falantes entram com microfone ligado por omissão, respeitando a preferência guardada de microfone desligado. A câmara começa sempre desligada, mesmo que a preferência anterior fosse ligada; pode ser ligada depois.
- Quem só pode ouvir entra em modo de escuta, sem publicar microfone ou câmara.
- Falha de entrada mostra erro com acção de retry e acesso às definições de dispositivos, sem repetição automática.
- **Remoção de comportamento:** «Testar vídeo» com faixa sintética deixa de estar acessível nesta superfície. O teste local de câmara continua disponível nas definições.
- Actualizar os requisitos de pré-entrada em sessão de voz, popout e regresso das definições.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: entrada directa, câmara desligada, erro e remoção da pré-entrada/teste sintético.
- `frontend-v2/call-popout`: mudança directa para outro canal sem confirmação prévia.
- `frontend-v2/settings-return`: voltar a um canal de voz lembrado passa a iniciar a entrada.

## Impact

`VoicePage.tsx`, `GreenRoom.tsx`, `devices.ts`, `callSession.tsx`, traduções e `docs/v2/parity-checklist.md`. Sem alteração do protocolo ou das permissões do servidor.
