# Research: 038-floating-voice-pip

## R1 — Quando mostrar o PiP

**Decision**: Reutilizar o predicado exacto de `showConnectedBar` em `AppShell`:

```text
voice.live() && voice.channelId() && params.id !== voice.channelId()
```

PiP e barra partilham visibilidade (FR-001, FR-009). Esconder quando o utilizador está na rota do canal de voz activo ou quando `!live` (FR-004, Sair).

**Rationale**: Já cobre «texto ou outra vista ≠ mesa activa» sem nova máquina de estados de navegação.

**Alternatives considered**: Só canais `type=text` (rejeitado — spec assume qualquer não-mesa); esconder barra quando PiP (rejeitado — clarificação A coexistir).

## R2 — Onde montar o componente

**Decision**: `FloatingVoicePip` dentro de `AppShell` (junto à barra), posicionado `fixed`/`absolute` relativo a `.app` (área útil da aplicação), não ao viewport do browser se o shell tiver chrome próprio — preferir o rect do contentor `.app` / `shell-main` para FR-008.

**Rationale**: Shell já conhece `voice` + `params` + navigate «Voltar à mesa»; PiP deve sobreviver ao unmount de `VoiceChannel`.

**Alternatives considered**: Portal em `document.body` (mais simples, mas ignora bounds do shell); manter `VoiceChannel` montado oculto (pesado, fugas de layout).

## R3 — Vídeo sem `VoiceChannel` montado

**Decision**: Ao mostrar PiP, obter `voice.session()?.room` e:

1. Enumerar `remoteParticipants` → publicações de vídeo subscribed → `attachRemote` / `track.attach()` em contentores do PiP.
2. Local: usar `localCamTrack` / `localVideoEl` se disponíveis; senão attach a partir do local participant do room.
3. Escutar `RoomEvent.TrackSubscribed` / `TrackUnsubscribed` (ou re-scan em interval curto / effect) enquanto PiP montado.
4. Ao voltar à mesa, `VoiceChannel` volta a registar `setHandlers` e faz o layout do palco; PiP desmonta e **detach** dos nós do PiP (não `stop()` tracks — só mover/detach DOM).

**Rationale**: `setHandlers(null)` no cleanup do palco não destrói o Room; tracks continuam no LiveKit. FR-007 exige preview real.

**Alternatives considered**: Manter handlers do VoiceChannel num «ghost» (complexo); só avatar/nome sem vídeo (rejeitado — clarificação A).

## R4 — Layout do conteúdo PiP

**Decision**: Faixa compacta Discord-like:

- Cabeçalho: nome do canal (`channelName`) + acção «Voltar à mesa» (mesmo navigate da barra).
- Corpo: grelha pequena de até **4** vídeos com câmara (local + remotes); se 0 vídeos → fallback centrado com nome + «Em chamada» / timer opcional.
- Sem controlos mic/cam no PiP nesta entrega (barra/palco já os têm); Sair permanece na barra (FR-009).

**Rationale**: FR-007 + FR-006; evita duplicar toda a chrome da mesa.

**Alternatives considered**: Só speaker activo (mais trabalho de speaking focus); espelhar palco completo (demasiado grande).

## R5 — Drag + snap a 4 cantos

**Decision**:

- Tipo `Corner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'`.
- Durante drag: posição livre (`left`/`top` em px) a seguir o pointer; `pointercapture`.
- Ao `pointerup`: calcular centro (ou canto mais próximo do rect do PiP) vs os 4 cantos do contentor → `nearestCorner`; aplicar classes/insets CSS (ex. `top`+`right`, etc.) com margem segura (~12–16px).
- Soltar no centro → sempre um dos 4 (FR-003 / SC-003).
- `resize` window: reaplicar âncora actual (FR-008).

**Rationale**: Pedido explícito; sem ímans a arestas.

**Alternatives considered**: Bibliotecas de drag (overhead); free-float sem snap (fora de spec).

## R6 — Persistência de canto (FR-010)

**Decision**: Signal em memória (componente ou `VoiceSession`) `pipCorner`, default `'top-right'`.

- Reset para `'top-right'` em `hangup` / `dropped` / fim de `live`.
- **Não** gravar em `localStorage` (clarificação B).
- Enquanto `live` e mesmo `channelId` (ou qualquer chamada activa na sessão SPA), manter o valor ao esconder/mostrar PiP (voltar mesa → texto de novo).

**Rationale**: Spec clarificada; reload = memória perdida = default TR.

**Alternatives considered**: Persistência por browser (rejeitado); reset sempre que PiP remonta mesmo na sessão (pior UX dentro da mesma chamada).

## R7 — Z-order e acessibilidade

**Decision**: z-index do PiP acima do conteúdo do canal e da barra (`voice-connected-bar` ~2), **abaixo** de modais/toasts/diálogos críticos (ver tokens existentes ~80–90). Drag handle com `cursor: grab`; botão «Voltar» focável; `aria-label` da miniatura com nome da chamada. Clique no vídeo não deve navegar acidentalmente — só o botão / área de título explícita.

**Rationale**: Edge case sobreposição; SC-004.

## R8 — Testes

**Decision**: Quickstart manual (aparecer, sumir, 4 cantos, centro→nearest, coexistir barra, Sair, vídeo/fallback); `tsc --noEmit`. Sem contract HTTP.

**Rationale**: 100% UI/cliente.
