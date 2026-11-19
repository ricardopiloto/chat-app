# Review — Arquiteto de Soluções

**Change:** investigate-composition-edit-scene-freeze
**Data:** 2026-11-18
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A estrutura "gate de reprodução/instrumentação antes de qualquer fix" segue exatamente o padrão já estabelecido neste mesmo projeto em `add-linux-screen-share-system-audio` (feasibility gate antes de implementação condicional) — coerente com a arquitetura de decisão já aceita, não inventa um processo novo.
- Nenhuma stack ou dependência nova é necessária: `--inspect`, DevTools Performance recording e profiling V8 já são ferramentas padrão do Electron/Chromium que o projeto já usa para desenvolvimento.
- Escalabilidade: N/A — bug de reliability local ao renderer de um cliente, sem componente de servidor.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Confirmei que `frontend/package.json`'s `electron:dev` já invoca o binário `electron` diretamente (`PARLEY_ELECTRON_DEV=1 electron electron/dist/main.js`), então anexar `--inspect=<porta>` para a captura V8 mencionada em `design.md` ("Risks/Trade-offs") não exige nenhum script novo — é um argumento extra na mesma invocação já existente.
- Confirmei por leitura de `frontend/electron/main.ts:757-770` que o popout de chamada (`CallPopoutWindow`) é de fato uma `BrowserWindow` separada, com `contextIsolation: true`, `nodeIntegration: false` e sua própria rota (`/call-popout/${channelId}`) — ou seja, um processo de renderer Electron distinto do processo da janela principal onde `Stage`/`CompositionView`/`SceneEditor` vivem. Isto é relevante para a Dimensão 3 abaixo.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Achado (reordenar a Prioridade 1 da investigação)**: o `design.md` lista, como prioridade 1 de investigação, verificar se um elemento de vídeo de screen-share local permanece montado em `FloatingPlayer.tsx`, `CallElsewhere.tsx` ou o popout, causando reflow. Verifiquei os três:
  - `FloatingPlayer.tsx` não referencia screen-share em nenhum ponto — só mostra o estado da câmera (`call.cam()`, linha 109). Não há vídeo de tela ali.
  - `CallElsewhere.tsx` é só um banner de texto + botão ("Bring back"); não renderiza nenhuma track de vídeo.
  - `CallPopoutWindow` (confirmado na Dimensão 2) roda num processo de renderer Electron **separado** da janela principal. Pela arquitetura multi-processo do Electron/Chromium, um reflow ou loop *dentro* do popout não pode travar a thread de UI da janela principal onde o utilizador reportou o freeze (Composição + Editar cena) — a menos que o utilizador também tivesse o popout aberto e o freeze fosse relatado *nele*, o que o relato original não indica.
  - **Conclusão**: nenhum dos três candidatos nomeados na Prioridade 1 sustenta, por leitura direta do código, o mecanismo de freeze descrito (a janela principal fica sem resposta). Recomendo rebaixar esta prioridade e investigar primeiro a Prioridade 2 (`setScreen` sem guarda de concorrência) e/ou abrir uma nova linha de investigação focada em efeitos reativos do SolidJS especificamente disparados pela transição `editing() = true` + uma screen-share local já ativa, antes de gastar o primeiro ciclo de reprodução na hipótese 1 como está ordenada hoje.
- **Achado (reforça a Prioridade 2, não a invalida)**: a mesma lógica "`call.setScreen(on).then(started => { if (on && started) setCallView("grid") })`" existe duplicada em dois pontos independentes — `frontend/src/voice/Stage.tsx:64` e `frontend/src/voice/CallControls.tsx:132`. Dois pontos de entrada distintos para a mesma ação (ligar a partilha de ecrã) aumentam a plausibilidade de uma dupla invocação de `setScreen` em algum fluxo de UI ainda não mapeado, reforçando (sem confirmar) a hipótese já levantada de que a falta de uma guarda tipo `cameraQueue` para `setScreen` merece ser verificada com prioridade mais alta do que o `design.md` atual sugere.
- Segurança: N/A.
- Performance: a própria natureza do bug (freeze total) já é o problema de performance/reliability que esta change investiga; nenhum achado adicional de performance fora do escopo já coberto.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- `design.md` segue bem o padrão de ADR do projeto (Decisions com alternativa e porquê, Risks/Trade-offs) e cita corretamente o precedente (`add-linux-screen-share-system-audio`) para justificar a estrutura de gate em vez de corrigir às pressas.
- Recomendação: emendar a secção "Priority order for the reproduction pass" com o achado da Dimensão 3 acima antes de iniciar `tasks.md` 1.1, para que o primeiro ciclo de reprodução não gaste tempo na hipótese 1 como está ordenada hoje.

## 5. Ponte entre produto e técnico

Veredito: OK

- A change está corretamente desenhada para não prometer um fix antes de confirmar a causa — dado a severidade (freeze total exigindo reinício forçado) e o facto de duas outras changes nesta mesma sessão já terem sofrido do mesmo padrão ("shipped-but-unverified assumptions"), tal como o próprio `design.md` reconhece. O novo requisito adicionado a `frontend-v2/voice-composition` ("Scene editor stays responsive during an active screen share") é uma tradução correta e testável do relato do utilizador para uma garantia de produto explícita.

## Bloqueantes antes de implementar
- nenhum — a reordenação recomendada na Dimensão 3 é sobre eficiência da investigação, não um impedimento para começar o gate de reprodução.
