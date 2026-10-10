# Design

## Context

Ver `proposal.md` — Why, para a investigação completa. Pontos de código que ancoram este design:

- `frontend/src/voice/callSession.tsx:3-6,76`: `CallSession`/`Room` é um objecto único por renderer, não serializável, partilhado via Context (`CallProvider`, montado em `frontend/src/shell/AppShell.tsx:66`). Não pode atravessar processos.
- `frontend/src/voice/FloatingPlayer.tsx`: o PiP existente lê a mesma `CallSession` (via `useCall()`) e anexa os mesmos objectos `Track` do LiveKit a elementos `<video>` próprios — nunca resubscreve. É o padrão para "segunda vista da mesma ligação dentro da mesma janela"; o popout precisa do padrão oposto ("segunda ligação, janela diferente").
- `backend/src/api/voice.rs:242-307` (`join`): além de emitir o token, regista ocupação, atribui slot de grade e difunde `grid.updated`. Confirmado por leitura directa — não é um endpoint seguro para chamar uma segunda vez pela mesma conta.
- `backend/src/token/mod.rs` (`mint`): já constrói `VideoGrants` com `can_publish`/`can_subscribe`; falta só `hidden` e uma identidade alternativa.
- `livekit-token 0.1.1` (via `livekit-api 0.6.4`, já em `Cargo.lock`): `VideoGrants.hidden: bool` já existe no crate pinado — confirmado por leitura directa do código-fonte em `~/.cargo/registry`, não assumido. Nenhuma dependência nova.
- `frontend/src/index.tsx` `Gate` (linhas 40-42): já demonstra bypass do `AppShell` para uma rota especial (`/__foundation`) — precedente directo para a rota do popout.
- `db::voice_occupancy::find_by_account` (usado em `voice.rs`, função `leave`): já existe, usado para confirmar se uma conta está activa num canal — reaproveitável para a verificação de autorização do novo endpoint.
- `frontend/src/crypto/channelKey.ts`: `loadChannelKey(channelId)`/`rememberChannelKey(channelId, key)` — a chave simétrica do canal (E2EE de media) é mantida em memória **por renderer**; `frontend/src/voice/E2ee.tsx:65,69,99` já usa exactamente estas duas funções para a ensinar ao processo actual. Achado da revisão: sem chamar `rememberChannelKey` no renderer do popout, a decifragem dos frames de vídeo/áudio que ele subscreve falharia — a janela mostraria ecrã preto, não a grade.
- `frontend/src/voice/GridView.tsx:6,11`: lê `useCall()`/`useCallPeople()` directamente de um `Context` do Solid — não aceita `room`/participantes por props. Para funcionar no popout sem modificação, a árvore desse renderer precisa de estar dentro de um `CallProvider` (`callSession.tsx:512`) com a `Room` própria do popout.

## Goals / Non-Goals

**Goals:**
- Mover a grade de vídeo para uma janela do SO separada, movível para outro monitor, sem duplicar a ligação da conta como um participante visível.
- Reaproveitar `GridView`/`Tile` tal como já existem — o popout não reimplementa a grade, só a monta numa rota/janela diferente.
- Zero efeito colateral no backend ao abrir um popout (nenhum evento espúrio, nenhuma duplicação de ocupação).

**Non-Goals:**
- Controlar mic/câmara a partir do popout — fica só na janela principal (token `can_publish: false` torna isto também tecnicamente impossível, não só uma escolha de UI).
- Mais do que um popout em simultâneo, ou lembrar posição/tamanho entre sessões.
- Qualquer alteração a `voice-grid`/`voice-composition`/`floating-voice-pip` em si — são reaproveitadas, não modificadas.

## Decisions

### 1. Segunda ligação LiveKit (hidden, view-only) em vez de partilhar a ligação principal

Alternativa descartada: tentar transferir os `MediaStreamTrack`/`Room` da janela principal para o popout via IPC do Electron. Rejeitada porque não é tecnicamente possível — tracks de media estão ligados ao pipeline WebRTC do processo/renderer que os criou; o IPC do Electron (structured clone) não transfere este tipo de objecto entre processos. A alternativa viável é o popout estabelecer a sua própria ligação à mesma sala LiveKit, como um segundo participante.

### 2. `hidden: true` + `can_publish: false`, identidade derivada — não um endpoint que reutiliza a identidade principal

Ver Requirements em `specs/voice/popout-viewer-token/spec.md`. Alternativa descartada: usar a mesma identidade da ligação principal para a ligação de popout. Rejeitada porque o LiveKit garante identidade única por sala — uma segunda ligação com a mesma identidade desliga a primeira (comportamento do próprio LiveKit, não configurável), o que destruiria a chamada em vez de a espelhar. `hidden: true` evita que outros participantes vejam uma entrada fantasma na lista de participantes; `can_publish: false` evita que o popout tente capturar câmara/microfone próprios (que nem sequer deviam estar disponíveis a um processo renderer sem controlos para tal).

### 3. Endpoint novo (`voice/popout-token`), não um parâmetro no `join()` existente

Alternativa descartada: acrescentar um parâmetro (ex. `role: "viewer"`) ao `join()` existente, com um ramo condicional que salta os efeitos colaterais. Rejeitada por risco de regressão: `join()` já tem lógica não trivial (ocupação, slots de grade, permissões de falar) — introduzir um ramo condicional ali arrisca um bug subtil que afecta a entrada normal. Um endpoint novo, pequeno e sem efeitos colaterais (só verifica ocupação existente + chama `token::mint` com `hidden: true`) é mais fácil de verificar isoladamente e impossível de confundir com o caminho principal.

### 4. Rota de popout bypassa `AppShell` por completo

Mesma técnica já usada por `Gate` para `/__foundation` (`index.tsx:40-42`) — um `Match` dedicado antes do resto do `Switch`, que renderiza só a grade, sem `Topbar`/`Sidebar`/`ServerRail`. Alternativa descartada: reaproveitar `AppShell` e esconder os elementos à volta com CSS. Rejeitada por ser mais frágil (depende de CSS específico a esconder elementos que continuam montados, incluindo potencialmente a `CallProvider` da janela de popout a tentar inicializar coisas que não precisa) do que simplesmente nunca montar essas partes.

### 5. Coordenação PiP↔popout via o estado já existente de `CallSession`, não um canal IPC novo

A janela principal já sabe "há popout aberto para este canal?" se essa informação for guardada no próprio `CallSession`/estado do canal (um sinal local, actualizado quando o IPC confirma que a janela de popout abriu/fechou) — `Hosts.tsx`/`FloatingPlayer` só precisam de verificar esse sinal antes de decidir mostrar o PiP. Não é preciso um mecanismo de coordenação novo entre janelas para isto, porque a decisão "mostrar PiP ou não" só importa à janela principal, que já sabe se foi ela a abrir o popout.

### 6. Transportar a `channel_key` via IPC ao abrir o popout, reaproveitando `rememberChannelKey` (achado da revisão)

Alternativa descartada: fazer o popout passar pelo fluxo normal de obtenção de chave (o mesmo ecrã/handoff que `E2ee.tsx` usa quando um dispositivo novo entra num canal). Rejeitada porque esse fluxo existe para um *dispositivo*/*identidade* nova sem a chave — aqui a chave já está decifrada e em memória na janela principal, segundos antes; pedir ao popout para a voltar a obter pelo canal normal (que pode exigir outro membro online para selar a chave de novo) seria mais lento e, nalguns casos, nem funcionaria de imediato. Em vez disso: o IPC que abre o popout (`desktop-electron-shell`, mesmo canal de confiança entre dois processos da mesma aplicação local, do mesmo utilizador) transporta os bytes da `channel_key` já carregada pela janela principal (`loadChannelKey(channelId)`); o renderer do popout, ao arrancar, chama `rememberChannelKey(channelId, bytesRecebidos)` antes de montar `GridView` — reaproveita inteiramente o mecanismo já existente em `channelKey.ts`, sem inventar transporte de chave novo.

### 7. O popout monta o seu próprio `CallProvider`, com a sua `Room`

`GridView`/`useCallPeople()` (Decisão em Context) exigem estar dentro de um `CallProvider`. O renderer do popout monta um `CallProvider` próprio (mesmo componente, `callSession.tsx:512`), inicializado já ligado à `Room` de visualização (token de `voice/popout-viewer-token`) — não o `CallProvider` da janela principal (impossível, processos diferentes), um novo, local a esse renderer. Quanto à prop `subscribe` que `CallProvider` exige: o popout não tem (nem precisa de) a sua própria ligação WS geral da aplicação — passa um `subscribe` no-op (nunca invoca o handler). Isto é seguro porque a reactividade que `GridView` precisa (participantes a entrar/sair, câmara a ligar/desligar) chega pelos eventos nativos da própria ligação LiveKit do popout (`room.on(...)`, dentro de `createCall()`), não pelos eventos da aplicação via WS (`grid.updated`, etc., que servem para coisas como a posição dos slots da grade com nomes, não a presença de tracks de vídeo em si). Risco residual registado em "Risks/Trade-offs".

## Risks / Trade-offs

- [O popout, como segunda ligação LiveKit, consome largura de banda/recursos do SFU como um participante a mais (mesmo sem publicar) — em chamadas grandes, isto soma-se] → Mitigação aceite: o caso de uso (um utilizador a abrir a própria chamada numa segunda janela) é por desenho um a mais por conta activa com popout aberto, não um problema de escala imprevisível; não é diferente, em custo de SFU, de abrir a mesma chamada em duas abas de um browser normal hoje.
- [Se a conta sair do canal (fechar a chamada) na janela principal enquanto o popout está aberto, a ligação de popout fica órfã — já não há um "dono" activo] → Mitigação: a janela principal, ao sair da chamada, pede ao processo principal para fechar o popout também (mesmo IPC que o abre), evitando uma janela de popout a mostrar uma grade de uma chamada já terminada.
- [`token::mint` ganha um parâmetro novo — risco de confundir chamadas existentes se a assinatura mudar de forma incompatível] → Mitigação: acrescentar um parâmetro com valor por omissão explícito nas chamadas existentes (`hidden: false`), não mudar o comportamento de quem já chama a função sem o passar.
- [Decisão 7 assume que um `subscribe` no-op no `CallProvider` do popout é suficiente — i.e., que nenhuma reactividade de `GridView` depende de eventos WS da aplicação (`grid.updated`, etc.), só de eventos nativos da ligação LiveKit. Não verificado a fundo nesta revisão] → Mitigação: a Tarefa correspondente em `tasks.md` tem de confirmar isto cedo (ex.: desligar/ligar câmara de outro participante com o popout aberto, sem nenhuma outra interacção, e confirmar que a grade do popout actualiza) — se se revelar falso, o popout precisa de uma ligação WS própria (mais complexo, mas ainda viável — o endpoint de autenticação por header já serve qualquer cliente que o use).

## Migration Plan

Mudança aditiva — nenhum endpoint, rota, ou comportamento existente muda. Depende de `desktop-electron-shell` estar implementada (precisa do processo principal Electron e da sessão configurada para abrir uma segunda janela). Pode ser implementada em qualquer momento depois disso, independentemente de `desktop-packaging-ci`.
