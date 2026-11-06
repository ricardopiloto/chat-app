# Tasks

## 1. Preparar os arquivos de áudio

- [ ] 1.1 Selecionar trechos das três fontes v2, aplicar aparo, fades e ajuste de ganho, publicar `mention.mp3`, `call-join.mp3` e `call-leave.mp3` em `assets/audio/`; verificar com `ffprobe` que cada arquivo dura no máximo 0,7 s e ouvir os três em volume de conversa.
- [ ] 1.2 Atualizar `assets/audio/README.md` e `docs/operar-instancia.md` com os três arquivos finais e sua origem; verificar que os nomes e durações documentados correspondem aos arquivos gerados.

## 2. Integrar reprodução e controles

- [ ] 2.1 Adicionar `callLeave` a `frontend/src/sound/effects.ts` com preload, caminho, janela de silêncio e pré-escuta; ampliar `frontend/scripts/verify-sound.mjs` e verificar que a limitação de frequência é independente para os três efeitos.
- [ ] 2.2 Adicionar a pré-escuta de saída em `AudioVideoSettings.tsx` e os rótulos nos idiomas suportados; verificar na interface que cada botão toca somente o seu efeito, inclusive com a preferência desligada.

## 3. Disparar a saída da chamada

- [ ] 3.1 Adicionar detecção de saídas remotas baseada em listas consecutivas de ocupantes e ligar o gatilho em `frontend/src/sound/triggers.ts`; cobrir com `verify-sound.mjs` saída única, rajada, primeira lista, usuário próprio, canal alheio e reconexão sem mudança.
- [ ] 3.2 Tocar `callLeave` uma vez no caminho de saída voluntária de `frontend/src/voice/callSession.tsx`, preservando silêncio em teardown e reconexão internos; verificar os fluxos de sair, desconexão involuntária e reconexão.

## 4. Verificação integrada

- [ ] 4.1 Executar a verificação de som, o build do frontend e uma sessão com dois clientes; confirmar três efeitos curtos, respeito a ensurdecimento, preferência e dispositivo de saída, sem toques duplicados ou alteração dos avisos visuais.
