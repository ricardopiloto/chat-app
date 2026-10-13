# Design

## Context

Ver `proposal.md` e `openspec/changes/fix-voice-join-freeze-linux/design.md` (secção "Regressão nova e correcção") para o achado original. Resumo do padrão em cada ficheiro, confirmado por leitura directa nesta sessão (via agente de auditoria):

- `frontend/src/chat/thread.ts` — `open()`, `refresh()`, `loadOlder()`, `send()`, `remove()`, `onEvent()`: todos capturam `channelId` antes de um `await` e comparam com `options.channelId()` (ou equivalente) depois, desistindo silenciosamente se mudou. **Já seguro.**
- `frontend/src/voice/sceneStore.ts:18` — `if (ticket === latest && id === channelId())` depois de `await gridApi.get(id)`. **Já seguro.**
- `frontend/src/voice/E2ee.tsx` (`ReenableDialog.confirm()`) — lê `props.channel.id` depois de `await voiceApi.channelKey(...)`, sem guarda explícita de "mudou?", mas o diálogo é modal e específico a um canal; risco considerado baixo pelo fullstack review, não endereçado nesta change.
- `frontend/src/chat/Composer.tsx:192` — loop de upload de vários anexos, relê `props.channelId` em cada iteração depois do `await uploadAttachment(...)` anterior, **sem guarda nenhuma**. É o único caso com um `TypeError` real alcançável (troca de canal/servidor a meio do envio de 2+ imagens), não só uma falha silenciosa.

## Goals / Non-Goals

**Goals:**
- Adicionar a mesma guarda "ainda é o mesmo canal?" ao loop de upload de anexos do `Composer.tsx`, parando o envio dos anexos restantes sem lançar excepção se o utilizador trocou de canal a meio.

**Non-Goals:**
- Não mexer em `thread.ts`/`sceneStore.ts` (já seguros) nem em `E2ee.tsx` (risco aceito como baixo, fora do escopo).
- Não mudar o comportamento do caminho feliz (upload sem trocar de canal).
- Não re-desenhar o fluxo de anexos (ex. cancelamento explícito, barra de progresso) — é só parar de forma segura quando o canal muda.

## Decisions

### D1: Parar silenciosamente em vez de continuar a enviar para o canal antigo

Ao detectar que `props.channelId` mudou a meio do loop, parar de enviar os anexos restantes e não marcar como enviados os que ainda não foram, em vez de continuar a enviá-los para o canal onde o envio começou. Alternativa descartada: continuar o envio para o `channelId` capturado no início (enviar "em segundo plano" para o canal antigo) — descartada porque a UI do Composer já mudou de canal nesse ponto (a composição pertence ao canal novo), e enviar para um canal que o utilizador já não está a ver é uma surpresa maior do que simplesmente não enviar o resto.

## Risks / Trade-offs

- [Parar a meio do upload pode deixar alguns anexos enviados e outros não, sem aviso ao utilizador] → aceito como a mesma limitação que já existe no caminho feliz (um upload pode falhar a meio por rede); não é pior do que o comportamento actual, só evita o crash.

## Migration Plan

Correctiva, sem migração de dados.

## Open Questions

Nenhuma.
