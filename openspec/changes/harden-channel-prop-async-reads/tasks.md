# Tasks

## 1. Guarda no upload de múltiplos anexos

- [ ] 1.1 Em `frontend/src/chat/Composer.tsx` (loop de envio de anexos, perto da linha 192), capturar `channelId` antes do loop e, em cada iteração, parar o envio dos anexos restantes (sem lançar excepção) se `props.channelId` já não for o mesmo — seguindo o mesmo padrão de guarda usado em `thread.ts`/`sceneStore.ts` (ver `design.md`).
- [ ] 1.2 Verificar manualmente: começar o envio de 2-3 imagens num canal, trocar de canal (ou de servidor) antes de terminar, e confirmar que não há `TypeError` no console e que o composer do canal novo continua utilizável.
- [ ] 1.3 Rodar `npm run build` no frontend como regressão mínima.

## 2. Confirmação dos pontos já seguros (sem alterar código)

- [ ] 2.1 Reler `frontend/src/chat/thread.ts`, `frontend/src/voice/sceneStore.ts` e `frontend/src/voice/E2ee.tsx` e confirmar que a guarda "ainda é o mesmo canal depois do `await`?" continua presente e a funcionar como descrito no `design.md`, agora que `fix-voice-join-freeze-linux` trocou a fonte de `channel`/`channelId` em `Content.tsx` para um memo simples. Se algo tiver mudado de forma inesperada, documentar aqui antes de fechar esta change.
