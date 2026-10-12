# Proposal

## Why

Bug encontrado em teste real (instalação `.deb`, Fedora, 2026-10-10) depois de `desktop-call-popout` implementada e arquivada: o botão "Abrir em nova janela" falha sempre, mostrando "This channel's key is not on this device, so the window did not open." mesmo numa chamada E2EE activa e a funcionar normalmente na janela principal.

Causa raiz, confirmada por leitura directa do código: `openPopout()` (`frontend/src/voice/callSession.tsx:371-389`) verifica `loadChannelKey(current.id)` (`frontend/src/crypto/channelKey.ts`) para decidir se há chave disponível — mas essa não é a chave realmente usada para cifrar/decifrar a chamada. A chamada activa usa `getServerKey(current.server_id)` (`frontend/src/crypto/serverKey.ts`, usada em `callSession.tsx:325` para configurar o `ExternalE2EEKeyProvider` do LiveKit). `channelKey.ts` só é usado por `E2ee.tsx` (ecrã de definições, chave de custódia para religar E2EE depois de gravação — um conceito diferente) — nunca por `GridView`/`Tile`, confirmado por pesquisa no código (`grep` não encontra `channelKey`/`loadChannelKey`/`rememberChannelKey` em nenhum ficheiro de renderização de vídeo).

A proposta original de `desktop-call-popout` (`design.md` Decisão 6, change já arquivada) conflou os dois mecanismos — assumiu, sem verificar contra o código real na altura, que `channel_key`/`channelKey.ts` era a chave da chamada. Esta change corrige esse erro de desenho, directamente no código (o requisito já descrito em `openspec/specs/frontend-v2/call-popout/spec.md` — "o popout liga-se à chamada de forma independente, só para visualizar" — já estava correcto; só a implementação não o cumpria).

## What Changes

- `frontend/src/voice/callSession.tsx` (`openPopout`): passa a verificar/transportar `getServerKey(current.server_id)` em vez de `loadChannelKey(current.id)`. Quando `current.e2ee_enabled` é verdadeiro e não há `serverKey` em memória, continua a recusar abrir o popout (mesmo aviso ao utilizador) — isso nunca deveria acontecer numa chamada E2EE já activa (se a chamada está a funcionar, a `serverKey` já está carregada), mas a validação fica como salvaguarda.
- `frontend/src/voice/CallPopoutWindow.tsx`: deixa de chamar `rememberChannelKey` (nunca foi preciso) — só `rememberServerKey`, já presente.
- `frontend/electron/preload.ts` (`CallPopoutRequest`) e `frontend/electron/main.ts` (handler `mesa:open-call-popout`): o campo `channelKey` (hoje obrigatório, validado como string não-vazia) é removido — deixa de fazer parte do payload IPC.
- **Fora de escopo**: qualquer outra parte do fluxo de popout (janela, rota, `CallProvider`, `GridView`) — já funcionam correctamente, não tocadas.

## Capabilities

(sem deltas de capability — `skip_specs: true`. O requisito relevante, já aceite em `openspec/specs/frontend-v2/call-popout/spec.md` ("O popout liga-se à chamada de forma independente, só para visualizar"), já descreve correctamente o comportamento pretendido; esta change só corrige a implementação para o cumprir, sem alterar nenhum requisito.)

## Impact

- **Frontend** (`frontend/src/voice/callSession.tsx`, `CallPopoutWindow.tsx`): troca de chave verificada/transportada.
- **Electron** (`frontend/electron/preload.ts`, `main.ts`): remoção de um campo do payload IPC já implementado.
- **Sem impacto**: backend, qualquer outra capability, UI/UX do popout (o comportamento observável correcto, quando funcionar, é exactamente o já especificado — só deixa de falhar).
