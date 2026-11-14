# Review — Desenvolvedor Fullstack

**Change:** sync-join-sound-with-participant-arrival
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma rota, payload WS ou tabela é tocada. `backend/src/api/voice.rs:242-276` continua emitindo occupancy exactamente como hoje; a change é inteiramente do lado do cliente.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- A troca de fonte do evento (occupancy → `ParticipantConnected` de `wire()`, `callSession.tsx:609-625`) é directamente implementável: o handler genérico `onChange` já existe ali, só precisa de um handler adicional e distinto, como a tarefa 1.1 descreve.
- **Achado (mesmo ponto levantado pelo Arquiteto, agora do ângulo de implementação):** `wire()` é partilhada entre a sessão dona da chamada e a sala view-only do popout (`watch()`). O handler novo precisa de uma guarda `!viewer` explícita — igual à já usada ao lado, em `TrackSubscribed` (`:627`) — para não emitir o evento de chegada também na sessão do popout. Hoje isso não causaria som audível porque `useSoundEffects()` só é montado em `frontend/src/shell/AppShell.tsx:24`, não em `CallPopoutWindow.tsx` — mas se algum dia o popout passar a consumir esse mesmo sinal (ex.: para um indicador visual), a ausência da guarda vira um bug real. Recomendo adicionar a guarda agora, já que o custo é uma linha e evita depender de "ninguém escuta isso no popout hoje" como garantia implícita.
- Sem impacto de responsividade/mobile — é lógica de evento, não layout.

## 3. Deploy e operação

Veredito: OK

- Nenhuma configuração, variável de ambiente ou processo novo. Nada a observar aqui além do que já existe.

## 4. Qualidade de código

Veredito: Atenção

- **Achado (código morto e teste obsoleto):** confirmei com `grep -rn "arrivals(" frontend/src frontend/scripts` que a função `arrivals()` (`frontend/src/sound/arrivals.ts`) só tem UM chamador em todo o repositório: exactamente a linha que a tarefa 1.2 manda remover (`triggers.ts:30`). Depois desta change, `arrivals.ts` fica sem nenhum chamador, e `frontend/scripts/verify-sound.mjs:1,18-31` — cujo próprio comentário diz "Checks the pure parts of the sound effects: arrival detection" — continua a passar, testando uma função que já não participa do som de chegada. Nem `design.md` nem `tasks.md` mencionam remover `arrivals.ts` nem actualizar/remover essa secção de `verify-sound.mjs`. Recomendo adicionar uma tarefa explícita para isso (remover o módulo morto, ou documentar por que fica, e ajustar o script de verificação) — do contrário a change termina com um ficheiro e um teste órfãos que ninguém pediu para manter.
- **Achado menor:** as tarefas 2.1/2.2 de verificação são só manuais ("In a two-client call, confirm..."). A lógica de dedupe por identidade/epoch que D1 descreve é uma função relativamente pura (dada uma sequência de eventos de conexão e um conjunto de identidades já vistas, decidir se cada uma é uma "chegada" nova) — do mesmo tipo que `arrivals()` já tinha um teste determinístico dedicado. Recomendo extrair essa lógica de decisão para algo testável isoladamente em `verify-sound.mjs` (ou um script novo), reservando o teste manual de dois clientes para o que só um LiveKit real pode confirmar (ordem real tile-antes-do-som).
- Organização: cabe nos módulos existentes; o único ponto de limpeza é o módulo `arrivals.ts` citado acima.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1/D2 na ordem certa e preserva explicitamente o que não deve mudar (deafen, self-join, limitador de frequência), consistente com os Non-Goals do `design.md`.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Confirmo o achado do Arquiteto sobre a guarda `!viewer` em `wire()` — concordamos que é de baixo risco prático hoje, mas vale registar no design.md para não depender de uma garantia implícita.
- Achado novo para o Arquiteto considerar: a remoção de `arrivals()` deixa um módulo e um teste órfãos (`sound/arrivals.ts`, `scripts/verify-sound.mjs`) que a change não menciona — vale decidir explicitamente (remover vs. documentar) em vez de deixar para quem implementar notar por acaso.
