# Proposal

## Why

O PiP existente (`frontend-v2/floating-voice-pip`, `frontend/src/voice/FloatingPlayer.tsx`) é um elemento flutuante **dentro da mesma janela** — mostra até 4 câmaras quando o utilizador navega para fora do canal de voz, mas fica preso à janela principal da aplicação. Pedido do utilizador: um "popout" ao estilo do Discord — uma **janela do sistema operativo separada**, que o utilizador pode arrastar para outro monitor sem mover a aplicação inteira. Isto só faz sentido no shell nativo (Electron, `desktop-electron-shell`) — uma página web não consegue abrir uma segunda janela com o mesmo nível de confiança/controlo que `window.open()` de um browser normal (bloqueadores de popup, sem acesso aos mesmos mecanismos de rede configurados para a instância).

Investigação de código feita antes desta proposta: a chamada vive numa única `CallSession`/`Room` (LiveKit) partilhada por toda a janela, montada uma vez em `AppShell` (`frontend/src/voice/callSession.tsx:3-6`, "a call outlives navigation... Screens never touch the room"), guardada numa variável de closure não serializável (`let room: Room | null`, `callSession.tsx:76`). Um `MediaStreamTrack`/`Room` do LiveKit não pode ser transferido entre processos — uma janela de popout no Electron é um **renderer separado**, com o seu próprio processo. A única via realista é a janela de popout estabelecer a sua **própria ligação LiveKit à mesma sala**, como um segundo participante.

Isso, por sua vez, exige cuidado no backend: `POST /channels/{id}/voice/join` (`backend/src/api/voice.rs:242-307`) não é um simples "emitir token" — também regista ocupação (`upsert_occupant`), atribui automaticamente um slot na grade (`auto_assign_first_empty`) e transmite `grid.updated` a todo o servidor. Chamar o mesmo endpoint outra vez para o popout duplicaria esses efeitos (pareceria uma segunda pessoa a entrar). A biblioteca de token já usada (`livekit-token 0.1.1`, via `livekit-api 0.6.4`, já uma dependência existente — confirmado em `Cargo.lock` e no código-fonte da crate) já suporta exactamente o caso de uso: `VideoGrants.hidden: bool` ("participant is not visible to other participants (useful when making bots)") e `can_publish: false`/`can_subscribe: true` para uma ligação só-de-visualização. O LiveKit exige identidade única por sala (uma segunda ligação com a mesma identidade desliga a primeira) — o popout usa uma identidade derivada, não a mesma do participante principal.

## What Changes

- **Backend**: novo endpoint `POST /api/channels/{id}/voice/popout-token` — confirma que a conta já está activa como ocupante desse canal (via `db::voice_occupancy::find_by_account`, já existe), e emite um token LiveKit com `hidden: true`, `can_publish: false`, `can_subscribe: true`, identidade `"{account_id}:popout"`, para a mesma sala. **Sem** nenhum dos efeitos colaterais de `join()` (sem `upsert_occupant`, sem atribuição de slot, sem `grid.updated`) — a conta já está registada como ocupante pela ligação principal.
- **Backend**: `token::mint` (`backend/src/token/mod.rs`) ganha um parâmetro/variante para `hidden`, reaproveitando a mesma função em vez de duplicar a construção do `AccessToken`.
- **Frontend**: botão "Abrir em nova janela" junto dos controlos existentes do PiP/palco, visível **só em modo nativo** (`isNative()` — não faz sentido no build web). Accionar o botão pede ao processo principal Electron (via IPC) para abrir uma segunda `BrowserWindow`, carregando uma rota dedicada e mínima do mesmo `frontend/dist` (sem `AppShell`/sidebar/chat — só a grade de vídeo), ao estilo de como `Gate` já faz excepção para `/__foundation` (`frontend/src/index.tsx:40-42`).
- **Frontend**: essa rota liga-se à mesma sala LiveKit de forma independente (`Room.connect()` próprio, token obtido de `voice/popout-token`), reutilizando `GridView`/`Tile` (`frontend/src/voice/`) para renderizar os participantes — não transplanta tracks da janela principal, estabelece a sua própria subscrição.
- **Frontend**: enquanto o popout estiver aberto, a janela principal deixa de mostrar o `FloatingPlayer`/grade activa para esse canal (evita renderizar a mesma coisa duas vezes) e mostra um estado "A chamada está noutra janela" com uma acção para a trazer de volta (fecha o popout). O PiP existente continua a funcionar normalmente quando não há popout aberto — as duas funcionalidades não competem, o popout é uma opção adicional.
- **Electron** (`desktop-electron-shell`, `frontend/electron/main.ts`): novo handler IPC para abrir/fechar a janela de popout (segunda `BrowserWindow`, mesma sessão — herda a injecção de header já configurada a nível de sessão, não por janela).
- **Fora de escopo explícito**: mover controlos de mute/câmara para dentro do popout (a janela principal continua a ser onde se controla mic/câmara — o popout é só visualização, consistente com o token `can_publish: false`), arrastar-largar tiles individuais para fora como janelas próprias (só a grade inteira), lembrar posição/tamanho do popout entre sessões, suportar mais do que um popout aberto em simultâneo.

## Capabilities

### New Capabilities

- `voice/popout-viewer-token`: emissão de um token LiveKit só-de-visualização (oculto, sem publicar) para uma sala em que a conta já é ocupante, sem os efeitos colaterais de entrada normal num canal.
- `frontend-v2/call-popout`: a janela de popout em si — o botão, a rota dedicada, a ligação independente à sala, e a coordenação com a janela principal (PiP) enquanto está aberta.

### Modified Capabilities

(nenhuma — `frontend-v2/floating-voice-pip` continua válida tal como está; o popout é uma opção adicional, não substitui o PiP)

## Impact

- **Backend** (`backend/src/api/voice.rs`, `backend/src/token/mod.rs`, `backend/src/api/mod.rs` para a nova rota): novo endpoint aditivo, sem alteração aos existentes.
- **Frontend** (`frontend/src/voice/`, novo componente de rota de popout; `frontend/src/index.tsx` `Gate`; `frontend/src/shell/Hosts.tsx` para coordenar com o `FloatingPlayer`).
- **Electron** (`frontend/electron/main.ts`): novo handler IPC para janela secundária.
- **Depende de** `desktop-electron-shell` (precisa do processo principal e da sessão já configurados) — implementável só depois dessa change.
- **Sem impacto**: `frontend-v2/voice-grid`/`voice-composition` (reaproveitados tal como estão, não modificados), `frontend-v2/floating-voice-pip` (continua a existir para quem não usar popout).
