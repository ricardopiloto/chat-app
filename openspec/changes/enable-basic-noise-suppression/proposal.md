# Proposal

## Why

O preview de microfone nas definições usa `getUserMedia` directamente e não pede a supressão de ruído nativa do navegador. A chamada real já pede `noiseSuppression: true` por omissão do LiveKit; o utilizador decidiu alinhar o teste local com esse comportamento e deixar um algoritmo avançado para o futuro.

## What Changes

- Tornar explícito `noiseSuppression: true` nas opções de captura da chamada, documentando o comportamento que o LiveKit já fornece por omissão, com ou sem dispositivo escolhido.
- Pedir `noiseSuppression: true` no `getUserMedia` do preview de microfone das definições, com ou sem dispositivo escolhido; esta é a mudança com efeito observável novo.
- Remover apenas «supressão de ruído» da frase de exclusão do mockup; eco, AGC e os demais itens permanecem excluídos.
- Registar processamento avançado no backlog, sem prazo.

## Capabilities

### Modified Capabilities

- `frontend-v2/audio-video-settings`: supressão nativa do microfone da chamada e do teste local.

## Impact

`frontend/src/voice/callSession.tsx`, `frontend/src/voice/preview.ts` e `docs/backlog/backlog.md`. O popout só visualiza e não publica microfone, logo não precisa de alteração. Sem nova dependência ou opção de UI.
