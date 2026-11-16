# Review — Desenvolvedor Fullstack

**Change:** update-call-and-notification-sounds
**Data:** 2026-11-14
**Veredito geral:** Bloqueado

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma task toca `backend/`; `proposal.md` declara "Não requer alteração de API ou dependência de servidor". Nada a avaliar.

## 2. Desenvolvimento do frontend

Veredito: Bloqueante

- As partes mecânicas são triviais de implementar sobre o código real: `frontend/src/sound/effects.ts` já estrutura `Effect`/`FILES`/`QUIET_MS` como `Record` por efeito (adicionar `callLeave` é uma entrada a mais em cada um, a "janela de silêncio própria" da Decisão 2 já é a forma como o módulo funciona hoje, não exige desenho novo); `frontend/src/voice/AudioVideoSettings.tsx:172-176` já tem o padrão `<Button onClick={() => previewEffect("mention")}>` a replicar para a saída.
- O problema real está na task 3.1 e na Decisão 3 do `design.md`: pedem para ligar a deteção de saída remota a `frontend/src/sound/triggers.ts` por diferença de listas de ocupância. Abri o ficheiro real: hoje `triggers.ts` **já não tem nenhuma lógica de ocupância** — foi removida pela change `sync-join-sound-with-participant-arrival` (todas as tasks `[x]`, já no código), e o que sobra no ficheiro é só a subscrição de `notification.created` para menções, com um comentário explícito a dizer que o som de entrada agora vem de `callSession.tsx` via `ParticipantConnected`, "not from HTTP occupancy". Implementar a task 3.1 como está significa reintroduzir em `triggers.ts` exactamente o mecanismo que acabou de ser removido dali — concordo com o achado bloqueante do `review-architect.md` e confirmo-o a partir do código actual, não só da leitura das duas propostas.
- Caminho correcto, já visível no próprio ficheiro: `frontend/src/voice/callSession.tsx:777-807` tem `ParticipantConnected` (com `seenRemotes`/`announceArrivals`/`alive()`) a tocar `callJoin`, e logo a seguir `ParticipantDisconnected` (linha 797) só entra num `onChange` genérico de refresh. É ali, não em `triggers.ts`, que `callLeave` deve ligar — a task 3.1 precisa de mudar de ficheiro-alvo, não só de abordagem.

## 3. Deploy e operação

Veredito: OK

- Sem porta, variável de ambiente, ou serviço novo. Todos os ficheiros tocados (`effects.ts`, `triggers.ts`/`callSession.tsx`, `AudioVideoSettings.tsx`) são renderer puro — ao contrário da change de close-button revista nesta mesma sessão, aqui não há nada em `frontend/electron/`, por isso o HMR normal do Vite cobre o ciclo de desenvolvimento sem reinícios especiais.
- Debug em produção: N/A, é um efeito local, sem necessidade de log novo.

## 4. Qualidade de código

Veredito: Atenção

- `tasks.md` 3.1 pede para "cobrir com `verify-sound.mjs`" os cenários de saída única, rajada, primeira lista, utilizador próprio, canal alheio e reconexão sem mudança. Olhei o `verify-sound.mjs` real: ele só testa as partes puras de `effects.ts` (janela de silêncio, persistência de preferência), construídas via `esbuild` isolado — não existe, em lado nenhum deste repositório, infra-estrutura para simular eventos de `Room`/`RemoteParticipant` do LiveKit (`ParticipantConnected`/`ParticipantDisconnected`). Esses cenários dependem exactamente disso, depois da correcção de mecanismo.
- A própria change irmã `sync-join-sound-with-participant-arrival`, ao enfrentar o mesmo problema do lado da entrada, não tentou cobertura automatizada para esses cenários — usou um "Smoke plan" manual com dois clientes (`tasks.md` 2.1/2.2 dessa change). Recomendo que a task 3.1 siga o mesmo precedente em vez de prometer cobertura em `verify-sound.mjs` que a infra-estrutura de testes actual não suporta: mover os cenários de sequência de eventos (rajada, reconexão, canal alheio) para um "Smoke plan" manual na task 4.1, e deixar em `verify-sound.mjs` só o que já é puro (janela de silêncio independente para `callLeave`, que isso sim é mecânico de estender).
- Fora isso, a task 1.1 (duração via `ffprobe`) e a 2.1/2.2 estão bem especificadas e implementáveis directamente.

## 5. Execução das decisões arquiteturais

Veredito: Bloqueante

- Converge com `review-architect.md`: a Decisão 3 tal como escrita não é implementável sem reintroduzir, em `triggers.ts`, o mecanismo de ocupância que a change irmã já removeu daquele ficheiro — não é uma preferência de estilo, é uma contradição directa e verificável no código actual. Mesma conclusão a partir de ângulos diferentes (arquitectura vs. "vou escrever este código e o ficheiro-alvo já não tem o que a task pede para estender").

## Bloqueantes antes de implementar

- O mesmo bloqueante do `review-architect.md`: mecanismo de deteção de saída remota precisa de mudar de "diferença de listas de ocupância em `triggers.ts`" para `E.ParticipantDisconnected` em `callSession.tsx`, espelhando o padrão já implementado para `ParticipantConnected`.
- Ajustar a task 3.1 (e o plano de verificação) para não prometer cobertura de `verify-sound.mjs` em cenários de sequência de eventos LiveKit que a infra-estrutura de testes actual não cobre; seguir o precedente de "Smoke plan" manual já usado por `sync-join-sound-with-participant-arrival`.

## Limitações técnicas a reportar ao Arquiteto

- nenhuma além do já convergente acima.
