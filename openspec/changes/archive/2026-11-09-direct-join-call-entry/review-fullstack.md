# Review — Desenvolvedor Fullstack

**Change:** direct-join-call-entry
**Data:** 2026-11-08 (revisão do código implementado)
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: N/A

Sem backend tocado.

## 2. Desenvolvimento do frontend
Veredito: OK

- Corri eu próprio, independentemente do relato do Codex: `tsc --noEmit`, `eslint src`, `npm run verify:i18n-keys` e `npm run build` (produção completa, `vite build`) — todos passaram sem erro. `npm run verify:popout-grid` também passou (confirma que remover `testPattern.ts` não afectou o cálculo de grade do popout, que é independente).
- `VoicePage.tsx` ficou pequeno e claro (um `Switch` de três ramos: `inThisCall`, "a preparar/ligar", erro). A guarda `pending`/`disposed` dentro do próprio componente, combinada com o novo parâmetro `valid` em `call.join()`, cobre o caso de desmontagem a meio de uma tentativa — testei mentalmente o cenário (navegar para um canal de texto a meio da entrada automática) e a chamada é correctamente abandonada sem deixar `status()` em `"connecting"` preso.
- `shell.go("/account#audio-video")` reaproveita um padrão de scroll-to-anchor já existente (`#recovery`, em `Account.tsx`) em vez de inventar um novo — confirmei que `id="audio-video"` já existe em `AudioVideoSettings.tsx`, não é uma referência pendurada.

## 3. Deploy e operação
Veredito: N/A

## 4. Qualidade de código
Veredito: Atenção

- Confirmei por grep em todo `frontend/src`, `frontend/electron` e `docs/` que não resta nenhuma referência viva a `GreenRoom`/`createTestPattern`/`testPattern` fora de dois documentos históricos (`docs/v2/closing-report.md`, o nome de uma pasta de mockup arquivada) — correctamente deixados intactos, são registo histórico, não código.
- Converge com o achado do Arquiteto sobre `parity-checklist.md` VOZ-09 ("partilha só Grade") estar desactualizado — confirmo que a causa é a change `improve-call-view-controls`, implementada antes desta, não esta aqui. Não bloqueia, mas é uma pequena dívida de documentação a saldar.
- Nenhuma tarefa de teste automatizado nova — consistente com o padrão já aceite neste projecto para fluxo de entrada em chamada (depende de LiveKit real).

## 5. Execução das decisões arquiteturais
Veredito: OK

- `activeJoin`/`activeLeave`/`valid` em `callSession.tsx` não reabrem nenhuma decisão de D1-D4; são a implementação concreta do Risk que o `design.md` já tinha antecipado ("limitar tentativa por activação... usar o cancelamento já previsto").

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma nova além da já registada por ele (linha desactualizada em `parity-checklist.md`, de outra change).
