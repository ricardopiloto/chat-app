# Tasks

## 1. Frontend: corrigir a chave verificada/transportada

- [x] 1.1 Em `frontend/src/voice/callSession.tsx`, `openPopout()` (linhas 371-389): substituir a verificação de `loadChannelKey(current.id)` por `getServerKey(current.server_id)`, condicionada a `current.e2ee_enabled` (quando E2EE está desligada no canal, não há chave nenhuma a verificar — o popout deve abrir à mesma). Remover `channelKey: b64(key)` do payload passado a `native.openCallPopout`; manter `serverKey: serverKey ? b64(serverKey) : null`. Remover o import de `loadChannelKey` se não ficar mais nenhum uso no ficheiro. Verificar manualmente: entrar numa chamada com E2EE activa, confirmar que "Abrir em nova janela" já não mostra o aviso "chave não está neste dispositivo" e a janela abre.
- [x] 1.2 Em `frontend/src/voice/CallPopoutWindow.tsx`: remover a chamada a `rememberChannelKey(handed.channelId, fromB64(handed.channelKey))` (linha 23) e o import de `rememberChannelKey`; manter `rememberServerKey(handed.serverId, fromB64(handed.serverKey))`. Verificar que o popout continua a mostrar vídeo decifrado correctamente (não regressão — já funcionava para quem conseguia passar da verificação bloqueada).

## 2. Electron: remover o campo não usado do payload IPC

- [x] 2.1 Em `frontend/electron/preload.ts`, remover `channelKey: string;` da interface `CallPopoutRequest`.
- [x] 2.2 Em `frontend/electron/main.ts`, remover `channelKey` do tipo correspondente, a validação `typeof raw.channelKey !== "string" || raw.channelKey.length === 0` (linha ~255), e `channelKey: raw.channelKey` do objecto devolvido (linha ~259). Verificar que `npm run electron:build`/`electron:dev` continua a compilar sem erros de tipo depois da remoção em todos os ficheiros tocados.

## 3. Verificação end-to-end

- [x] 3.1 Numa instância com E2EE activa, entrar numa chamada, abrir o popout, confirmar que a janela abre e mostra vídeo decifrado correctamente — fecha o bug relatado (2026-10-10).
- [x] 3.2 Confirmar que entrar numa chamada **sem** E2EE activa (`current.e2ee_enabled === false`) também abre o popout sem exigir nenhuma chave — não regressão para canais sem E2EE.
- [x] 3.3 Confirmar que a chamada principal (sem popout) continua a funcionar exactamente como antes — a mudança não toca em `join()`/no caminho normal, só em `openPopout()`.
