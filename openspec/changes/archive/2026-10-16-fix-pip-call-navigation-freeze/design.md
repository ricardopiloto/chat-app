# Design

## Context

Ver `proposal.md` — Why. Estado real do código, confirmado por leitura:

- `FloatingPlayer` (`frontend/src/shell/Hosts.tsx:78-80`) fica montado ao nível do shell sempre que há uma chamada ao vivo cujo canal não é o canal visto na rota actual, e não há popout aberto para esse canal:
  ```tsx
  <Show when={voice.live() && voice.channelId() !== null && voice.channelId() !== shell.route().channelId}>
    <Show when={voice.popoutFor() !== voice.channelId()}><FloatingPlayer /></Show>
  </Show>
  ```
  Isto já existia antes de `popout-voice-navigation-handoff`; o que mudou nessa change foi remover o `CallElsewhere` do mesmo nível (ficou só em `Stage.tsx`, por canal).
- `FloatingPlayer` renderiza até 4 `Tile`/`TrackVideo` (`frontend/src/voice/tiles.tsx`) para quem tem câmara ligada. Cada `TrackVideo` cria o seu próprio `<video>` e chama `track.attach(video)`/`track.detach(video)` num `createEffect`/`onCleanup`. LiveKit suporta múltiplos `<video>` para a mesma faixa — isto por si só não é incomum.
- `join()`/`leave()`/`teardown()` em `callSession.tsx` foram reescritos em `popout-voice-navigation-handoff`: `teardown()` passou a devolver uma `Promise<void>` (resolve quando `room.disconnect(true)` termina), `leave()` passou a aguardar essa promise e, se havia popout aberto, a aguardar o fecho real da janela nativa antes de continuar; `join()` ganhou um guard (`joining`) contra chamadas concorrentes.
- Nenhum destes dois caminhos foi exercitado com uma câmara real antes da release `v1.3.2` — `popout-voice-navigation-handoff/tasks.md` continua com as tarefas 1.1-2.3 por marcar, exactamente por faltar esse teste ao vivo.

Não há, nesta leitura, nenhuma chamada síncrona bloqueante óbvia nem um ciclo de efeitos reactivos evidente. Um travamento desta natureza (processo preso, não uma excepção) tipicamente vem de: uma promise que nunca resolve e é aguardada em cadeia (ex. `closePopout()`/`onCallPopoutClosed` nunca disparar quando não há de facto popout aberto, se `pendingClose`/`popoutFor` ficarem nalgum estado inconsistente), um deadlock a nível nativo do LiveKit/WebRTC/Chromium no Linux (a mesma classe de problema que já motivou a troca de Tauri para Electron), ou re-render excessivo ao desmontar/montar `Tile`/`TrackVideo` durante a navegação. Nenhuma destas é confirmada — são hipóteses a eliminar por reprodução, não a causa.

**Pista nova (Windows, mesma sessão de teste)**: com o popout aberto, trocar de janela do sistema operativo (Alt+Tab, ou alternar entre a janela principal e o popout) também trava. Não há, nesta leitura, nenhum listener de `blur`/`focus`/`visibilitychange` a nível da janela em `frontend/electron/main.ts` nem em `callSession.tsx` — isto não descarta a hipótese, só significa que não é lógica JS explícita da aplicação a reagir ao foco. No Windows, uma `BrowserWindow` em segundo plano com uma faixa de vídeo WebRTC activa é um candidato real a suspensão/perda do contexto de GPU ao mudar de foco — a mesma classe de problema (pipeline de vídeo nativo a bloquear num SO específico) que já motivou trocar de Tauri para Electron no Linux. Vale tratar este cenário como possivelmente distinto dos de PiP/navegação, não assumir a priori que é a mesma causa.

**Pista nova (utilizador, mesma sessão de teste)**: com o popout aberto (não o PiP), trocar de canal e enviar mensagem funciona normalmente — só "voltar" à chamada não funciona. "Voltar" aqui é `CallElsewhere.tsx` → botão "Trazer de volta" → `call.closePopout()`. Esse componente só aparece em `Stage.tsx`, na própria página do canal de voz (`call.popoutFor() === props.channel.id`) — fora dessa página, com o popout aberto, `Hosts.tsx` não mostra `FloatingPlayer` nem nenhum atalho de volta (`popoutFor() !== channelId()` é falso), por isso a única forma de chegar ao botão é navegar manualmente de volta ao canal de voz pela barra lateral. `closePopoutOnce()` tem um timeout de 5s que garante que `setPopoutFor(null)` corre sempre, mesmo que `native.closeCallPopout()` rejeite — por isso este sintoma não deveria travar para sempre, o que sugere ou um ponto de falha diferente do PiP, ou a mesma causa a manifestar-se sem travar a thread principal desta vez (ex. a janela nativa do popout não fecha de facto, mesmo com o estado do renderer já a dizer que fechou). Vale reproduzir este cenário primeiro — não trava, por isso é mais fácil de instrumentar (consola, `--inspect` no processo principal) do que o travamento do PiP.

## Goals / Non-Goals

**Goals:**
- Confirmar a causa raiz por reprodução ao vivo, com evidência concreta (stack preso, log, ou profile), antes de alterar qualquer código de correcção.
- Corrigir essa causa especificamente, sem reescrever `join`/`leave`/`teardown` ou o `FloatingPlayer` por precaução.
- Cobrir os dois cenários relatados pelo utilizador na verificação.

**Non-Goals:**
- Adivinhar uma correcção sem reprodução confirmada — risco real de "corrigir" um sintoma diferente e deixar o travamento a acontecer por outro caminho.
- Reabrir o desenho de `popout-voice-navigation-handoff` (a sequência de fecho/reconexão que essa change define continua correcta em princípio; esta change corrige uma implementação ou interacção que falha num caso concreto).
- Alterar o comportamento do popout em janela separada — o relato é específico ao PiP.

## Decisions

### 1. Reprodução antes de correcção

Não escrever nenhuma linha de correcção antes de reproduzir o travamento com DevTools abertas (`Ctrl+Shift+I` na janela principal) ou `--inspect`, e capturar onde a thread fica presa. Alternativa descartada: ler o diff de `popout-voice-navigation-handoff` e tentar adivinhar o ponto exacto — descartada porque um travamento raramente está onde a leitura estática sugere primeiro, e uma correcção às cegas arrisca mascarar o sintoma sem resolver a causa.

## Risks / Trade-offs

- [Travamento pode ser específico de uma condição de hardware/driver no Linux do utilizador, difícil de reproduzir noutra máquina] → se a Tarefa 1 não conseguir reproduzir de forma fiável, documentar os passos tentados e pedir ao utilizador logs/vídeo da próxima ocorrência, em vez de fechar a change sem causa confirmada.
- [A correcção, uma vez encontrada a causa, pode exigir tocar `popout-voice-navigation-handoff` de novo antes dela estar arquivada] → aceitável; as duas changes tratam da mesma área e já estão sequenciadas uma a seguir à outra.

## Migration Plan

Correctiva, sem migração de dados. Depende de ter uma causa confirmada antes de qualquer alteração de código — ver Decisão 1.

## Open Questions

- Qual é exactamente o ponto onde a thread principal fica presa? Só a Tarefa 1 (reprodução) responde a isto.

## Evidência da reprodução (2026-10-12)

Sessão em modo de desenvolvimento (`MESA_ELECTRON_DEV=1`, Vite em `https://127.0.0.1:1421`, Electron com `--remote-debugging-port=9222` e `--inspect=9229`). O cenário pedido foi o primeiro: chamada de voz/vídeo, sair para outro servidor com o PiP, e tentar voltar. O utilizador reportou às 22:27 (UTC-3) que já não conseguia voltar à chamada. Não houve segundo nem terceiro cenário, nem o cenário de Windows.

O que a consola gravou (`evidence/console.log`), em UTC:

- 01:25:36 — profile da janela principal e do processo principal a gravar. A página estava em `/servers/a8415b01-2a7c-4e36-bdc9-3fc6f0af65d2/channels/a300c304-5693-400a-bd9a-df0c78a2c577`.
- 01:25:43 — LiveKit passa de `disconnected` a `connecting`.
- 01:25:48 — aparece um target `/call-popout/a300c304-5693-400a-bd9a-df0c78a2c577`.
- 01:26:13 — esse target regista `Page leave detected, disconnecting` e o websocket do popout fecha.
- 01:26:36 em diante, de 20 em 20 segundos, até 01:29:48 — `TypeError: Cannot read properties of undefined (reading 'id')`. A pilha nomeia `Object.channelId` em `ChannelPage.tsx` e `onEvent` em `thread.ts`, chamado a partir de `state.tsx` quando chega uma mensagem de `/ws`. No código actual essas funções são `channelId: () => props.channel.id` (`frontend/src/chat/ChannelPage.tsx`, cerca da linha 43) e `const channelId = options.channelId()` dentro de `onEvent` (`frontend/src/chat/thread.ts`, linha 164). O servidor de desenvolvimento reportou as linhas 46 e 126; o nome da função é o que identifica o ponto.
- 01:29:47 — a janela principal ainda emite `webrtc stats` da sala `a300c304-5693-400a-bd9a-df0c78a2c577`. O depurador continuou a receber eventos a cada segundo durante todo o intervalo. A thread principal do renderer não estava presa num bloqueio síncrono.
- 01:29:48 — `disconnect from room` e `connected -> disconnected`.
- 01:29:50 — a página fecha. O Vite foi terminado em seguida. `Profiler.stop()` da segunda gravação não chegou a correr: o websocket já tinha fechado. `evidence/ps.txt` e `evidence/proc-status.txt` foram escritos depois disso e já não tinham o processo Electron, por isso não há `State` do renderer.

O único `.cpuprofile` (`evidence/2026-10-13T01-25-36-107Z-page_Mesa_Frontend_v2.cpuprofile`) é o da gravação anterior, parada às 01:25:36 quando o capturador foi reiniciado — antes do relato. Dura cerca de 46 s e 42 018 de 43 352 amostras são `(idle)`. Não é o perfil de um travamento.

Conclusão desta passagem: o sintoma observado foi «não consigo voltar», com a chamada LiveKit ainda ligada e a interface a continuar a processar eventos. Não ficou demonstrado um bloqueio da thread principal. O erro repetido em `props.channel.id` é um sinal de consola durante esse estado, não uma pilha de CPU presa.

### Causa confirmada e corrigida (2026-10-13)

O erro aponta directamente para uma causa real, confirmada por leitura do código: `shell.channel` (`frontend/src/shell/state.tsx:69`) é `createMemo(() => channels.data?.find(c => c.id === route().channelId))` — ao trocar de servidor com uma chamada activa noutro canal, `channels.data` passa a ser da nova rota (ou fica momentaneamente vazio durante o refetch), mas `route().channelId` continua a apontar para o canal antigo enquanto a navegação de volta não se completa. Nessa janela, `shell.channel()` devolve `undefined`.

`frontend/src/shell/Content.tsx:44-62` usava `<Show when={shell.channel()?.id} keyed fallback={...}>` mas voltava a ler `shell.channel()!` directamente dentro dos filhos (`channel={shell.channel()!}`, duas vezes) em vez de usar o valor resolvido que o `Show` `keyed` já fornece ao callback. Essa releitura é uma expressão reactiva independente: quando `shell.channel()` oscila para `undefined` sem o `Show` chegar a trocar de ramo nesse preciso tick, `ChannelPage`/`VoicePage` continuam montados e recebem `channel={undefined}` — e `ChannelPage` declara `channel: Channel` como obrigatório, por isso `thread.ts:164` (`options.channelId()` → `props.channel.id`) rebenta sempre que chega qualquer evento de `/ws` (daí os ~20s, cadência de outro evento periódico do socket), em vez de mostrar o `fallback` de carregamento.

**Corrigido**: `Content.tsx` passou a usar `when={shell.channel()}` (o objecto, não só o `id`) e o parâmetro `channel` que o `Show keyed` fornece ao callback, em vez de reler `shell.channel()!`. Isto garante que `ChannelPage`/`VoicePage` só recebem um `Channel` definido, e que o `fallback` ("A carregar canal…") aparece em vez do erro sempre que `shell.channel()` fica `undefined`. Build (`npm run build`) confirmado a passar.

**Em aberto**: esta correcção resolve o erro de consola confirmado e o sintoma «não consigo voltar» que ele causava durante a reprodução.

### Tentativa de reprodução do cenário PiP (2026-10-13, interrompida)

Nova sessão de captura (CDP + profiler, `evidence/pip-*.*`) montada para o cenário do PiP (entrar numa chamada, ver o PiP, clicar noutro canal sem trocar de servidor). A app foi lançada com `MESA_ELECTRON_DEV=1 npx electron electron/dist/main.js --remote-debugging-port=9222 --inspect=9229`. A captura ligou-se à janela principal às 01:45:00.078Z — mas **o alvo fechou 1.7s depois** (01:45:01.739Z, evento `CLOSED`), e a porta de depuração (9222) deixou de responder a pedidos HTTP a partir daí (`POLL-FAIL fetch failed`, repetido). O utilizador reportou, em paralelo, que não conseguia sequer entrar numa chamada nesta execução — "o modo de execução trava o Mesa".

Isto é um achado distinto e não explicado: não é o mesmo sintoma (nem a mesma causa, necessariamente) do erro `props.channel.id` já corrigido, e aconteceu mais cedo no fluxo (ao entrar na chamada, não ao navegar com ela já activa). Pode ser um efeito das próprias flags de depuração (`--remote-debugging-port`/`--inspect`) a interferir com a negociação WebRTC/LiveKit — o mesmo tipo de interferência que esta sessão já viu antes, ao tentar automatizar uma chamada real com Playwright. Fica registado, mas **não foi investigado** — ver decisão abaixo.

### Decisão do utilizador: parar a reprodução (2026-10-13)

Com a causa do `props.channel.id`/`shell.channel()` já confirmada e corrigida, e cobrindo o padrão comum aos cenários relatados (navegar ou tentar voltar com uma chamada activa noutro canal, incluindo o caso do Windows — troca de janela do SO não muda a lógica do renderer), o utilizador decidiu não continuar a tentar reproduzir o travamento do PiP nem o cenário do Windows à parte. Os itens 1.2 e 1.3 de `tasks.md` ficam marcados com esta decisão, não com uma reprodução confirmada ponto-a-ponto — se o travamento do PiP voltar a acontecer depois desta correcção, é um bug novo a abrir à parte, não uma reabertura desta change.
