# Proposal

## Why

Com o popout aberto, quem está a falar ouve a própria voz de volta. A janela de popout entra na sala com outra identidade e trata o microfone da janela principal como áudio remoto, por isso reproduz-o. O popout é só para ver a grade. O som da chamada fica na janela principal.

## What Changes

- A janela de popout não reproduz nenhuma faixa de áudio, incluindo o microfone de quem a abriu.
- A janela principal continua a ser o único sítio onde se ouve a chamada. Fechar o popout não muda isso.
- A grade, a câmara e a partilha de ecrã no popout mantêm-se.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/call-popout`: o popout deixa de reproduzir áudio, para quem fala não ouvir o próprio microfone.

## Impact

- A ligação só de visualização em `frontend/src/voice/callSession.tsx`, que hoje prende o áudio remoto também no popout.
- Sem alteração do token, da identidade `account:popout`, nem de quem publica o microfone.
