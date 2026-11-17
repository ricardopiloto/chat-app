# Review — Desenvolvedor Fullstack

**Change:** per-participant-volume-boost
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma rota, tabela ou lógica do `backend/` é tocada. A escolha de escopo local-only (`design.md` D2, já confirmada com o utilizador) elimina esta dimensão por completo.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Implementabilidade confirmada no código real**: `readJson`/`writeJson` (`frontend/src/lib/localPrefs.ts:15-20`) já tratam `localStorage` indisponível (janela privada, quota, política) devolvendo o fallback sem lançar — a task 1.1 pode reusar isto directamente, sem tratamento de erro novo. `TileData.handle?: string` e `TileData.isLocal: boolean` existem exactamente como o `design.md` descreve (`tiles.tsx:36-46`), e `Tile` já tem o slot `actions?: JSX.Element` (`tiles.tsx:54`) livre para o novo controlo.
- **Achado**: encontrei **quatro** locais onde `<Tile>` é renderizado, não três — `frontend/src/voice/CompositionView.tsx:26` (vista "Composição", `size="stage"`), `frontend/src/voice/GridView.tsx:115` (grade) e `:126` (faixa lateral do destaque), e também `frontend/src/voice/FloatingPlayer.tsx:98` (o mini-player/PiP, `size="mini"`). O `proposal.md`/`design.md` dizem "everywhere they are shown (grid, stage, strip)", que cobre os três primeiros, mas não mencionam o PiP. `Tile` já tem um padrão estabelecido de esconder elementos de UI menos essenciais quando `size() === "mini"` (ex. o chip "Muted" e o chip "You" já não aparecem nesse tamanho, `tiles.tsx:86,92`) — recomendo que `tasks.md` 3.1 decida explicitamente se o PiP também ganha o controlo (inconsistente com o resto, mas o PiP é pequeno/flutuante) ou fica de fora seguindo esse padrão já existente, em vez de deixar isso para quem implementar decidir sozinho.
- Boa notícia de implementabilidade: como a aplicação do volume acontece na camada de áudio (`attachAudio`, independente de qual vista está a renderizar o `Tile`), o controlo em qualquer um dos locais acima lê/escreve o mesmo valor partilhado por `handle` — não há risco de os quatro locais ficarem dessincronizados entre si.
- Sem problema de responsividade: é um controlo pequeno dentro de um tile já existente, no mesmo espírito dos outros controlos por tile já implementados (ex. o botão de spotlight em `GridView.tsx:86-95`).

## 3. Deploy e operação

Veredito: N/A

- Nenhuma porta, variável de ambiente, serviço ou build novo — confirmado, é só código de cliente.

## 4. Qualidade de código

Veredito: Atenção

- **Achado, relacionado ao ponto do Arquiteto sobre `AudioContext` partilhado**: confirmei que este projecto já usa `AudioContext` noutros dois sítios (`frontend/src/voice/devices.ts:147,173`, `meterStream`/`playTestTone`), mas ambos criam uma instância **nova e de curta duração** por uso pontual (medir nível do microfone, tocar um som de teste) — não há nenhum precedente de uma instância partilhada e duradoura como o Arquiteto recomenda para esta change. Ou seja, seguir "o padrão já existente" literalmente (um `AudioContext` novo por participante boostado, ou um por cada vez que se chama a função) seria consistente com o estilo local mas erradro para este caso, porque aqui pode haver vários participantes boostados ao mesmo tempo durante toda a duração de uma chamada, não um uso pontual e curto. Concordo com o Arquiteto: precisa de ser um `AudioContext` partilhado e de duração igual à da chamada, não copiado do padrão ad-hoc já existente.
- **Achado (novo, complementa o do Arquiteto)**: `callSession.tsx` já tem um ponto de limpeza bem definido no fim da chamada — `teardown()` (linha 171) chama `audioHost.replaceChildren()` (linha 186) e mais tarde `audioHost.remove()` (linha 738). Nenhuma task actual menciona fechar o `AudioContext` partilhado aí. Sem isso, entrar e sair de chamadas repetidamente na mesma aba acumula instâncias de `AudioContext` nunca fechadas — os browsers têm um limite prático de contextos simultâneos, e eventualmente `new AudioContext()` começa a falhar. Recomendo adicionar uma task explícita: fechar (`.close()`) o `AudioContext` partilhado dentro de `teardown()`.
- Fora estes dois pontos, `tasks.md` segue o padrão "tarefa + como verificar" já usado no projecto, e as verificações manuais propostas são consistentes com o facto de não existir nenhuma suite de teste automatizado para reprodução de áudio real neste repositório (confirmado: nenhum dos scripts `verify:*.mjs` toca áudio/DOM real).

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1-D4 sem reabrir nenhuma decisão. Os achados acima são lacunas de precisão/completude nas tasks (qual `AudioContext`, fechar no teardown, PiP sim/não), não contradições do que já foi decidido.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- O `AudioContext` partilhado (já recomendado pelo Arquiteto) precisa de um ponto de fecho explícito em `callSession.tsx`'s `teardown()` (linha 171/186) — sem isso, entrar/sair de chamadas repetidamente acumula contextos nunca fechados.
- Falta decidir se o mini-player/PiP (`FloatingPlayer.tsx:98`, quarto local onde `Tile` é renderizado, não mencionado em `proposal.md`/`design.md`) também recebe o controlo de volume, ou fica de fora seguindo o padrão já existente de `size() === "mini"` esconder chrome menos essencial.
