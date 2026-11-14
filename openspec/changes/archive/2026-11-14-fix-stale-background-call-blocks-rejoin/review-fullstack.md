# Review — Desenvolvedor Fullstack

**Change:** fix-stale-background-call-blocks-rejoin
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Nenhuma mudança de API é proposta nem necessária. Confirmei em `backend/src/api/voice.rs:194-237` (`upsert_occupant`) que, quando a mesma conta entra num canal diferente do que a ocupação registada, o backend já chama `apply_leave` na ocupação antiga antes de inserir a nova — a reivindicação do design.md ("server occupancy's account upsert can replace a stale seat") está correta e não exige nenhum trabalho de backend adicional.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Confirmei linha a linha o mecanismo descrito: `teardown()` (`callSession.tsx:171-197`) já zera `room`, pára hardware e limpa os signals de forma síncrona, retornando `disconnected = closing.disconnect(true).catch(() => undefined)` sem timeout algum. `leaveOnOnce()` (`:341-356`) e `join()`/`joinOnce()` (`:498-514`) de facto esperam essa promise (ou a `activeLeave`/`activeJoin` que a envolve) indefinidamente — se o `disconnect(true)` do LiveKit nunca resolver, `activeLeave` nunca limpa (bloco `finally` em `leave()` só executa quando a promise resolve) e todo `join()` seguinte trava. O diagnóstico do design.md está correto.
- `onPageHide` (`:713-717`) de fato só chama `teardown()`, sem tocar `status()`/`channel()` — confirma a Requirement "Page lifecycle teardown clears call state".
- **Achado:** o design.md (D1) propõe "an operation generation for ownership" como se fosse um conceito novo a introduzir. Já existe: `epoch` (`callSession.tsx:82`) já é incrementado em `leaveOnOnce()` (`:342`) e `joinOnce()` (`:362,516`), e já é checado como guarda contra trabalho obsoleto em `wire()` (`:611`, `alive = () => mine === epoch && room === next`) e nos handlers de WS (`:661,663,674`). A tarefa 1.2 já usa a redação mais segura "epoch or equivalent ownership", mas o `design.md` deveria dizer explicitamente que D1 estende o `epoch` já existente para também proteger o caminho `activeLeave`/`activeJoin`/`disconnect`, em vez de deixar ambíguo se é um mecanismo paralelo novo. Sem essa clareza, quem implementar corre o risco de criar um segundo contador de geração ao lado do `epoch` já usado, duplicando a lógica de invalidação.
- Sem impacto de UI/responsividade — esta change não toca componentes visuais, é lógica de sessão.

## 3. Deploy e operação

Veredito: OK

- `app.requestSingleInstanceLock()` e `backgroundThrottling` são configuração do próprio `BrowserWindow`/`app` do Electron já usado (`frontend/electron/main.ts:355-370` para `webPreferences`, `:675-693` para `whenReady()`), sem porta, variável de ambiente ou processo novo. Nenhum impacto no único pipeline de CI existente (`.github/workflows/desktop-release.yml`, que empacota, não testa comportamento).
- Observabilidade: recomendo (não bloqueante) um `console.warn`/log equivalente ao padrão já usado para a tray (`main.ts` "tray icon missing; tray may be invisible") no ponto em que uma segunda instância é rejeitada e no deadline do cleanup expirando — isso é exactamente o tipo de evento que a própria equipa vai precisar depurar depois, conforme o cenário relatado pelo usuário.

## 4. Qualidade de código

Veredito: Atenção

- **Achado:** todas as tarefas de 1.1 a 2.4 são verificadas só manualmente ("Verify manually...", "Exercise a two-client desktop call..."). O projeto já tem um padrão estabelecido de scripts deterministas para lógica sem UI (`frontend/scripts/verify-*.mjs`, `frontend/scripts/*.test.mjs`, `frontend/scripts/contracts/run.mjs`) — a change-irmã `per-participant-volume-boost` chega a sugerir isso explicitamente ("a small script in the style of the project's existing scripts/verify-*.mjs"). A lógica central desta change (guarda de `activeLeave`/`activeJoin` com timeout e invalidação por `epoch` quando um `disconnect()` nunca resolve) é um caso de máquina de estados determinístico, testável com uma sala/`Room` fake cujo `disconnect()` nunca resolve — não precisa de um ambiente Electron real. Recomendo adicionar à tarefa 1.2 um script no padrão `verify-*.mjs`/`*.test.mjs` para esse caminho, reservando a verificação manual (tarefas 2.2/2.4) para o que de fato só um build desktop real pode confirmar (tray, lock de instância, foco de janela).
- Tratamento de erro: o "deadline" de D1 cobre o caso de disconnect pendente, mas nem design.md nem tasks.md dizem o que a UI mostra se o deadline expirar e a pessoa não conseguir nem assim o novo join (ex.: erro de rede real, não apenas promise pendurada) — a Requirement só diz "reaches a successful new connection or a visible failure", o que é suficiente para especificar, mas vale confirmar na implementação que o `problem`/`setProblem` já existente (`callSession.tsx`, usado em `lost()`) é reaproveitado em vez de um novo canal de erro.
- Organização: tudo cabe nos módulos existentes (`callSession.tsx`, `main.ts`), sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue as decisões D1-D4 na ordem certa e task 2.3/2.4 implementam D4 fielmente (lock antes do `createWindow()`, `second-instance` chamando `showMainWindow()` já existente em `main.ts:67-74`).
- Task 2.3 menciona corretamente coordenar com a edição paralela de `close-button-behavior-preference` no mesmo bloco de `main.ts` — boa prática, evita que a dupla revisão precise repetir esse achado.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- O `epoch` já existente (`callSession.tsx:82` e usos) já cobre parte do que D1 pede como "operation generation" — vale o Arquiteto confirmar no design.md que D1 é uma extensão do mecanismo existente, não um novo, para não abrir espaço a duas lógicas de invalidação paralelas (ver achado na dimensão 2).
