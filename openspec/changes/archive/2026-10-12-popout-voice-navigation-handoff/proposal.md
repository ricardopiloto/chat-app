# Proposal

## Why

Com o popout aberto, a janela principal mostra «Bring it back» mesmo quando a pessoa navega para canais de texto ou outras áreas. Esse estado ocupa a interface fora da chamada e a troca para outra chamada precisa encerrar o popout anterior de forma previsível.

## What Changes

- Mostrar «Bring it back» somente na tela do canal de voz da chamada activa que está no popout.
- Ao navegar por canais de texto ou outras áreas, manter a chamada e o popout activos sem mostrar essa tela na área principal.
- Ao confirmar a entrada em outro canal de voz, fechar o popout, sair da chamada anterior e só então conectar a nova chamada.
- Manter a acção «Bring it back» no canal original e o encerramento normal da chamada ao fechar manualmente o popout.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/call-popout`: restringir o estado «noutra janela» ao canal da chamada activa e definir a transição para outra chamada de voz.

## Impact

- Frontend: condição de exibição em `frontend/src/shell/Hosts.tsx`, tela de chamada e sequência de `join`/`leave`/fecho em `frontend/src/voice/callSession.tsx`.
- Electron: reutilizar o comando existente de fecho do popout; sem nova API ou migração de dados.
