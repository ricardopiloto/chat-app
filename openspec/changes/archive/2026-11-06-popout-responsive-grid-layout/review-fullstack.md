# Review — Desenvolvedor Fullstack

**Change:** popout-responsive-grid-layout
**Data:** 2026-10-16
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Nenhuma rota, migração ou lógica de domínio do `backend/` é tocada. Confirmado pelo `Impact` do `proposal.md` ("Sem impacto em backend, API, ou formato de mensagens") e pela leitura do código: o popout já é um visualizador LiveKit independente (`voice/popout-viewer-token`), e esta change só muda o `BrowserWindow` do Electron e o cálculo de layout no cliente. Nada a avaliar aqui.

## 2. Desenvolvimento do frontend

Veredito: OK

- **Implementabilidade confirmada no código real**, não só no design:
  - `frontend/electron/main.ts:321-325` tem exactamente `new BrowserWindow({ width: 960, height: 640, minWidth: 640, minHeight: 480, ... })` dentro de `registerPopoutIpc`. Trocar `minWidth`/`minHeight` para `240`/`180` é a mudança de uma linha que `tasks.md` 1.1 descreve — nada mais no construtor depende desses valores, e `width: 960, height: 640` (tamanho inicial) continua válido acima do novo mínimo.
  - `frontend/src/voice/gridSize.ts` é uma função pura de 15 linhas, sem estado, sem I/O — exactamente o tipo de função onde um early-return por `width/height < 0.7 && n > 1` é seguro e localizado, como o `design.md` descreve.
  - `frontend/src/voice.css:211` já tem `.call-grid.is-fill{grid-auto-rows:unset;grid-template-rows:repeat(var(--rows,1),minmax(0,1fr))}`, combinado com `.call-grid{grid-template-columns:repeat(var(--cols,2),minmax(0,1fr))}`. Com `cols=1`, isso já produz uma única coluna que preenche a largura, e `rows=N` empilha os tiles verticalmente — **nenhuma mudança de CSS é necessária**, confirmando a afirmação do `design.md`/`proposal.md` de que só `gridSize.ts` muda. Bom escopo, sem surpresa escondida.
- **Verifiquei a lógica da nova regra contra o algoritmo actual e não encontrei regressão**: simulei os 4 casos do script de verificação existente (ver §4) contra a regra proposta (`width/height < 0.7 ⇒ cols=1`) — nenhum dos casos hoje passantes muda de resultado (o caso "tall window" já cai em `cols=1` pela maximização actual; os demais têm proporção ≥ 0.7 e não activam o novo ramo). Ou seja, a mudança é aditiva sobre os casos já cobertos, não um redesenho que arrisca quebrar o que já funciona.
- Responsividade: única superfície de UI é o próprio popout (já usa `ResizeObserver`, já reage a mudanças de tamanho); não há caminho mobile para esta janela (é exclusiva do shell nativo desktop), então não se aplica.

## 3. Deploy e operação

Veredito: N/A

- Sem variável de ambiente, porta, container ou processo novo. `minWidth`/`minHeight` do Electron e um threshold numérico em TS não exigem nada em `infra/docker-compose.yml` nem mudança em `docs/deploy-producao.md`/`docs/operar-instancia.md`. Não há nada para monitorar em produção além do que já existe (a janela é só do cliente desktop).

## 4. Qualidade de código

Veredito: Atenção

- **Achado**: `tasks.md` 2.1-2.3 pede para "adicionar um teste unitário (ou adicionar, se ainda não houver suite para este ficheiro)" para `computeGridSize`. Isso é impreciso — **já existe** o mecanismo certo para isso neste projecto: `frontend/scripts/verify-popout-grid.mjs`, rodado via `npm run verify:popout-grid` (script já registado em `frontend/package.json`), que importa `computeGridSize` directamente (via bundle esbuild, mesmo padrão de `verify-instance.mjs`) e já tem 4 checagens no mesmo espírito das que `tasks.md` propõe (inclui até um teste de desempate "tie keeps smaller column count" adjacente ao caso que a change vai tocar). Este projecto **não tem** um test runner tipo vitest/jest configurado (confirmado em `frontend/package.json`: não há `vitest`/`jest` nas dependências nem script `test`) — "criar uma suite" se interpretado literalmente levaria a introduzir uma dependência de teste nova e desnecessária para um ajuste de 3-4 linhas numa função já coberta pelo padrão de scripts `verify:*` do projecto.
  - **Recomendação** (não bloqueante, fácil de ajustar antes de implementar): reescrever as tasks 2.1-2.3 para dizer explicitamente "estender `frontend/scripts/verify-popout-grid.mjs` com casos para a regra de coluna única, e rodar `npm run verify:popout-grid`" em vez de "teste unitário"/"suite". O conteúdo do que verificar (caso estreito/alto, caso-limite `n=1`, transição no limiar) continua válido — só o mecanismo precisa apontar para o script certo.
- Fora esse ponto, o padrão "tarefa + como verificar" de `tasks.md` está alinhado com a convenção já usada em changes arquivadas (ex. `password-recovery/tasks.md`), e os grupos estão ordenados por dependência (tamanho mínimo → algoritmo → verificação visual → validação da spec) sem deixar testes acumulados só no fim.
- Tratamento de erro/resiliência: não se aplica de forma relevante — `computeGridSize` já trata `n < 1`/`width <= 0`/`height <= 0` como guarda de entrada (linha 3), e a nova regra não introduz novo caminho de falha (é um early-return puro, sem I/O, sem promise, sem estado compartilhado).

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente as decisões do `design.md`: threshold 0.7 implementado como early-return dentro de `computeGridSize` (Decisão 1), nenhuma mudança em `callSession.tsx`/`people.ts` para ordem de chegada (Decisão 2, Non-Goal explícito), e `minWidth`/`minHeight` 240×180 (Decisão 3) — não há tarefa reabrindo nenhuma dessas decisões sem justificar.
- Nenhuma limitação técnica nova foi encontrada na implementação real que não estivesse já antecipada no `design.md`.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- nenhuma
