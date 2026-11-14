# Tasks

## 1. Preparar os arquivos de áudio

- [x] 1.1 Usar as três fontes v2 aparadas externamente para cerca de 2 segundos cada e publicar cópias diretas como `mention.mp3`, `call-join.mp3` e `call-leave.mp3` em `assets/audio/`, mantendo as fontes v2 separadas.
- [x] 1.2 Atualizar `assets/audio/README.md` e `docs/operar-instancia.md` com os três arquivos finais e sua origem; verificar que os nomes e durações documentados correspondem aos arquivos gerados.

## 2. Integrar reprodução e controles

- [x] 2.1 Adicionar `callLeave` a `frontend/src/sound/effects.ts` com preload, caminho, janela de silêncio e pré-escuta; ampliar `frontend/scripts/verify-sound.mjs` e verificar que a limitação de frequência é independente para os três efeitos.
- [x] 2.2 Adicionar a pré-escuta de saída em `AudioVideoSettings.tsx` e os rótulos nos idiomas suportados; verificar na interface que cada botão toca somente o seu efeito, inclusive com a preferência desligada.

## 3. Disparar a saída da chamada

- [x] 3.1 Em `frontend/src/voice/callSession.tsx`, dar a `E.ParticipantDisconnected` um handler próprio: atualizar participantes, remover a identidade de `seenRemotes` e tocar `callLeave` para remoto previamente visto na chamada ativa, espelhando `announceArrivals`, `alive()`, `viewer`, `deafened()` e `status() === "live"` do handler de entrada. Adiar o toque com `queueMicrotask` até após a remoção do tile e repetir as guardas antes de tocar. A verificação automática em `verify-sound.mjs` fica limitada à janela de silêncio independente de `callLeave` em `effects.ts` (task 2.1).
  - Smoke plan: em dois clientes, A numa chamada ativa e B a sair → A vê o tile de B desaparecer antes de ouvir um `callLeave`; saídas quase simultâneas de B e C → um toque na rajada; lista inicial de participantes e entrada própria → nenhum toque de saída; B sai de outro canal ou chamada sem A → A fica em silêncio; reconectar B sem saída real e reiniciar internamente a sessão de A → nenhum toque indevido. Repetir com A ensurdecido e no popout viewer → silêncio; a janela proprietária mantém um único toque quando elegível.
- [x] 3.2 Tocar `callLeave` uma vez no caminho de saída voluntária de `frontend/src/voice/callSession.tsx`, preservando silêncio em teardown e reconexão internos; verificar os fluxos de sair, desconexão involuntária e reconexão.

## 4. Verificação integrada

- [ ] 4.1 Executar a verificação de som, o build do frontend e uma sessão com dois clientes; confirmar três efeitos curtos, respeito a ensurdecimento, preferência e dispositivo de saída, sem toques duplicados ou alteração dos avisos visuais.
