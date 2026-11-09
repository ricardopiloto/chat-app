# Tasks

## 1. Correção em `state.tsx`

- [x] 1.1 Em `frontend/src/shell/state.tsx`, trocar os dois usos de `membersChoice() ?? true` (linha ~261, dentro de `membersOpen`; linha ~263, dentro de `toggleMembers`) por `membersChoice() ?? false`. Confirmar por leitura que são exactamente estes dois sítios e que não há um terceiro uso do mesmo padrão a esquecer (`grep -n "?? true" frontend/src/shell/state.tsx`). Não tocar em `remembered()`/`MEMBERS_KEY`/`sessionStorage` — a persistência por sessão não muda, só o valor por omissão quando não há nada guardado ainda. Feito: `grep` encontrou só os dois usos previstos; ambos foram alterados, sem tocar na persistência.
- [x] 1.2 Confirmar por leitura que `focusMember` (que chama `setMembersChoice(true)` para trazer um membro à vista) continua a funcionar sem alteração — abrir o painel explicitamente quando é preciso focar alguém deve continuar a funcionar independentemente do valor por omissão. Feito: `focusMember` continua a chamar `setMembersChoice(true)` sem alteração.

## 2. Verificação

- [x] 2.1 Correr `npx tsc --noEmit`, `npx eslint src`, `npm run build` em `frontend/`; confirmar que passam. Feito: os três comandos passaram (ESLint com um aviso, build com aviso de tamanho de chunks).
- [x] 2.2 Verificar manualmente: limpar `sessionStorage` (ou abrir numa aba nova), entrar num servidor em viewport largo e confirmar que o painel de Membros começa colapsado; alternar com o botão do cabeçalho e confirmar que abre/fecha e que a escolha persiste ao navegar entre canais do mesmo servidor nessa sessão. Confirmado pelo usuário em teste manual real: sessão nova em viewport largo, painel começa colapsado; alternância funciona; escolha persiste ao navegar entre canais na mesma sessão.

## 3. Revisão

- [x] 3.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`). Revisão dupla pós-implementação registada em review-architect.md/review-fullstack.md (secção 'Revisão pós-implementação'), veredito Aprovado.
- [x] 3.2 `openspec validate members-panel-collapsed-by-default --strict`. Confirmado: `openspec validate --strict` passou.
