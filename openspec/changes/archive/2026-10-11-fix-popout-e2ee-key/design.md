# Design

## Context

Ver `proposal.md` — Why. Dois módulos de chave distintos no frontend, confirmados por leitura directa do código, fáceis de confundir pelo nome parecido:

- `frontend/src/crypto/serverKey.ts`: `rememberServerKey(serverId, key)`/`getServerKey(serverId)` — chave simétrica **por servidor**, é a que `callSession.tsx:325` (`const carried = request.e2ee ? getServerKey(request.serverId) : undefined`) passa ao `ExternalE2EEKeyProvider` do LiveKit em `join()` (linhas 337-349) — **esta é a chave realmente usada para cifrar/decifrar a mídia da chamada**. Também usada para cifrar mensagens de texto (`encryptMessage`/`decryptBytes`, mesmo ficheiro).
- `frontend/src/crypto/channelKey.ts`: `rememberChannelKey(channelId, key)`/`loadChannelKey(channelId)` — usada só em `frontend/src/voice/E2ee.tsx` (ecrã de definições de E2EE do canal — chave de custódia para religar E2EE depois de uma gravação, um conceito diferente, documentado em `docs/arquitetura-tecnica.md` §6 como a chave que "o criador recebe... e deve guardar... sem ela, não é possível reactivar a E2EE depois de desligada"). Confirmado por `grep` que nenhum ficheiro de renderização de vídeo (`GridView.tsx`, `Tile`/`people.ts`) toca neste módulo.
- `openPopout()` (`callSession.tsx:371-389`, introduzida por `desktop-call-popout`) foi escrita a verificar o módulo errado (`channelKey.ts` em vez de `serverKey.ts`) — por isso falha sempre que `channelKey.ts` nunca foi populado (o caso normal, já que nada no fluxo de entrada numa chamada o popula), mesmo com a chamada a funcionar perfeitamente via `serverKey.ts`.

## Goals / Non-Goals

**Goals:**
- O popout abrir com sucesso sempre que a chamada principal já está a funcionar com E2EE activa (i.e., sempre que `getServerKey(serverId)` já está populada, que é precisamente quando a chamada está a decorrer).
- Não introduzir nenhum campo/transporte de chave que não seja realmente usado (o erro original).

**Non-Goals:**
- Resolver ou simplificar a existência de dois módulos de chave parecidos (`serverKey.ts`/`channelKey.ts`) — são conceitos genuinamente diferentes (chave de sessão em uso vs. chave de custódia de recuperação), ambos têm razão de existir; esta change só corrige qual deles o popout consulta.
- Qualquer mudança ao fluxo normal de entrada em chamada, ao `E2ee.tsx`, ou à migração futura (em curso noutra change, `bots-channel-key-integration`) de chave-por-servidor para chave-por-canal — essa migração, quando acontecer, terá de actualizar `openPopout()` também, mas isso é trabalho dessa change, não desta.

## Decisions

### 1. Corrigir para `serverKey.ts`, não introduzir um terceiro mecanismo

Alternativa descartada: criar um novo transporte específico para o popout, à parte dos dois módulos já existentes. Rejeitada — o módulo certo (`serverKey.ts`) já existe, já é o que a chamada principal usa, e já estava parcialmente presente no código (`getServerKey`/`rememberServerKey` já eram chamados nos dois lados, só o `channelKey` sobrava a mais e o `serverKey` não era o que bloqueava a abertura). A correcção é subtractiva (remover o que não serve) mais um ajuste na condição de bloqueio, não aditiva.

### 2. Manter a salvaguarda "sem chave, não abre", só com a chave certa

A verificação "se E2EE está activo e não há chave, recusar abrir" continua a fazer sentido como rede de segurança (nunca deveria disparar na prática, já que a chamada principal não funcionaria sem a `serverKey` já carregada) — só a chave verificada muda.

## Risks / Trade-offs

- [Esta correcção fica obsoleta quando `bots-channel-key-integration` migrar de chave-por-servidor para chave-por-canal — `openPopout()` teria de voltar a mudar, desta vez para `channelKey`/um módulo renomeado] → Mitigação: fora de escopo aceite (ver Non-Goals); registar como nota para quem implementar essa migração verificar `openPopout()` na lista de pontos a actualizar.

## Migration Plan

Correcção pontual, sem migração de dados nem mudança de comportamento observável além de "o popout passa a abrir". Aplicável de imediato, independente de qualquer outra change em curso.
