# Tasks

## 1. Implementação

- [x] 1.1 Em `frontend/src/chat/logic/timeline.ts`, extrair uma constante (ex. `GROUP_WINDOW_MS = 5 * 60 * 1000`) e alterar `continues` em `buildTimeline` para exigir também `when.getTime() - new Date(previous.createdAt).getTime() <= GROUP_WINDOW_MS`; verificar com `tsc --noEmit` (via `npm run build` ou `tsc --noEmit` direto) que o tipo ainda compila sem erros.

## 2. Testes

- [x] 2.1 Em `frontend/scripts/verify-chat.mjs`, adicionar casos cobrindo o cenário do bug: mesmo remetente às 09:24 e 09:26 (2 min de diferença) permanece no mesmo grupo, e a mensagem às 09:46 (20 min depois) inicia um novo grupo mesmo sendo o mesmo remetente e o mesmo dia; verificar executando `node scripts/verify-chat.mjs` e confirmando que todos os checks (incluindo os novos) passam com `all passed`.
- [x] 2.2 Corrigir os horários da fixture `a`/`b`/`c` em `verify-chat.mjs` para intervalos de 1 minuto e confirmar que o check de agrupamento existente continua passando dentro da janela de 5 minutos; verificar executando `node scripts/verify-chat.mjs`.

## 3. Documentação e fechamento

- [x] 3.1 Atualizar `docs/bugs.md` removendo ou marcando como resolvido o item 1 ("Agrupamento de mensagens ignora o intervalo de tempo"), já que o spec de texto e a implementação passam a exigir a janela de tempo; verificar lendo o arquivo e confirmando que o item não aparece mais como bug aberto.
