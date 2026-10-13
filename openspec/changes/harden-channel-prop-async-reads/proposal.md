# Proposal

## Why

Durante a revisão dupla (arquiteto + fullstack) de `fix-voice-join-freeze-linux`, uma auditoria mais ampla encontrou um padrão repetido no frontend: ler `channel`/`channelId` de volta depois de um `await`, em código que originalmente assumia que o componente continuava montado e o canal continuava o mesmo. A correcção daquela change tornou este padrão seguro onde já existia uma guarda (`thread.ts`, `sceneStore.ts`, `E2ee.tsx` — comparam o valor relido com o capturado antes do `await` e desistem se mudou), mas achou um ponto sem guarda nenhuma: `frontend/src/chat/Composer.tsx:192`, no loop de upload de vários anexos.

Nenhum destes é o bug que motivou `fix-voice-join-freeze-linux` (esse já está corrigido e revisado). Isto é uma dívida de robustez encontrada em passagem, documentada em `openspec/changes/fix-voice-join-freeze-linux/design.md` ("Regressão nova e correcção") e nos dois relatórios de revisão daquela change, para não se perder em prosa.

## What Changes

- `Composer.tsx:192` (loop `for (const each of files) ids.push(await uploadAttachment(props.channelId, ...))`): adicionar a mesma guarda que já existe em `thread.ts`/`sceneStore.ts` — capturar o `channelId` antes do loop e, se `props.channelId` mudar a meio (utilizador trocou de canal/servidor durante o envio), parar o envio dos anexos restantes em vez de continuar a chamar `uploadAttachment` com um `channelId` ou prop potencialmente indefinido.
- Confirmar (sem reescrever código que já está correcto) que `thread.ts`, `sceneStore.ts` e `E2ee.tsx` continuam com a guarda "ainda é o mesmo canal?" depois da correcção em `fix-voice-join-freeze-linux` — não é esperado nenhuma mudança aqui, é verificação.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. Hardening de um caminho de erro já implicitamente coberto pelo envio de anexos existente, sem mudar o comportamento no caminho feliz.)

## Impact

- `frontend/src/chat/Composer.tsx` (upload de anexos).
- Sem impacto em backend, deploy ou specs. Risco baixo: o caminho feliz (sem trocar de canal a meio do upload) não muda.
