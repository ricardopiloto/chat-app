# Review — Desenvolvedor Fullstack

**Change:** add-message-reactions
**Data:** 2026-10-09
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: Atenção

- Migração nova encaixa sem atrito na numeração existente (`backend/migrations/0024_invite_key_seed.sql` é a última; esta seria `0025_message_reactions.sql`), e a tabela `message_reaction` com FK `ON DELETE CASCADE` é suportada pelo SQLite já configurado (`sqlx` com feature `migrate`). Autorização está bem especificada: D6 reaproveita exatamente o `authz::channel_access` já usado em `post_message`.
- **Atenção — `enrich()` real não casa com o `reactions_for_messages(message_ids)` em lote de `tasks.md` 1.3**: lendo `backend/src/db/message.rs:57` (`enrich(pool, message: &mut Message)`) e os dois pontos onde é chamado — `find_by_id` (linha 143) e `list_since` (linha 173, dentro de um loop `for message in &mut messages { enrich(pool, message).await?; }`) — o enriquecimento de `attachment_ids`/`mentioned_account_ids` já é feito **uma mensagem de cada vez** (N+1 por campo, por mensagem), não em lote. A tarefa 1.3 propõe uma função `reactions_for_messages(message_ids) -> HashMap<...>`, que é um formato em lote incompatível com a forma como `enrich()` é efetivamente chamado hoje — para usá-la seria preciso refatorar as assinaturas/pontos de chamada de `enrich()` e `list_since`, o que não está nas tasks nem no design.
  - **Recomendação**: alinhar com o padrão real já aceito no código — uma função `reactions_for_message(pool, message_id) -> Vec<ReactionSummary>` chamada dentro do próprio `enrich()`, exatamente como `list_ids_for_message`/`list_mentions` já são chamadas. Isto é consistente com D1 ("segue o mesmo padrão já usado para `attachment_ids`/`mentioned_account_ids`"), só que a tarefa 1.3 atual descreve a implementação de forma diferente do que D1 promete. Ajustar `tasks.md` 1.3/1.4 antes de começar evita descobrir isto no meio da implementação.

## 2. Desenvolvimento do frontend
Veredito: Atenção

- Viável com a stack atual: `EmojiPicker.tsx` (Solid.js) e `EMOJI_GROUPS`/`BY_CODE` de `emoji.ts` são exatamente o que a tarefa 3 precisa, sem dependência nova. O botão de reagir na barra de ações de `MessageRow.tsx`/mensagem é um acréscimo de UI dentro do padrão já existente (responder/apagar).
- **Atenção — strings novas sem tarefa de i18n**: o projeto mantém catálogos por área (`frontend/src/i18n/catalogs/chat.pt-BR.ts` e o par `.en.ts`) e um script de verificação dedicado (`npm run verify:i18n-keys`) que outras changes já correm como parte do fecho (ex. `frontend-v2-mention-everyone-and-voice-fixes/tasks.md` 5.1). Esta change introduz pelo menos três strings visíveis (rótulo/título do botão "Reagir", texto "e mais N" da tooltip, eventual aviso de reação indisponível em canal só-de-leitura/silenciado), mas nenhuma tarefa em `tasks.md` menciona adicionar as chaves correspondentes em `chat.pt-BR.ts`/`chat.en.ts`. Sem isso, `verify:i18n-keys` falharia (chave só num idioma) ou as strings ficariam hardcoded, fora do padrão do resto da área de chat.
  - **Recomendação**: adicionar as chaves de i18n como parte das tarefas 3.2/4.2/4.4 (onde cada string é introduzida), não como tarefa separada ao final.

## 3. Deploy e operação
Veredito: OK

- Sem porta, serviço, variável de ambiente ou passo de deploy novo: a migração aplica-se ao mesmo SQLite/Postgres já em produção, os dois endpoints novos são sub-rotas da API já servida pelo mesmo processo, e os dois eventos novos usam o mesmo `WsHub`. `docs/deploy-producao.md`/`docs/operar-instancia.md` não precisam de nenhuma alteração.
- Observabilidade: nada específico de reações é proposto (ex. métrica de contagem), mas também não é o padrão do projeto ter telemetria dedicada por feature — consistente com o resto do backend.

## 4. Qualidade de código
Veredito: Atenção

- `tasks.md` segue bem o padrão "tarefa + como verificar" já usado em changes anteriores (ex. `password-recovery`, `mention-everyone`), com testes de contrato explícitos para os dois endpoints (2.1/2.2) e para o fan-out WS (2.3). Concorrência do toggle está endereçada (`INSERT ... ON CONFLICT DO NOTHING` / `DELETE` idempotente, tarefa 1.3) — bom, evita um achado óbvio de corrida numa tarefa como esta.
- **Atenção — falta o "fecho" de verificação final que os changes anteriores sempre incluem**: `frontend-v2-mention-everyone-and-voice-fixes/tasks.md` grupo 5 ("Fecho") roda `tsc --noEmit`, `eslint src`, `npm run check:v1-overlap`, `npm run verify:i18n-keys` e `cargo test` antes de dar a change como concluída. O grupo 6 ("Documentação e fidelidade") desta change cobre a atualização do `parity-checklist.md` e a fidelidade visual, mas não inclui essa sweep final — sem ela, é fácil a change ficar "pronta" com `tsc`/`eslint`/`verify:i18n-keys` quebrados sem ninguém notar antes de mesclar.
  - **Recomendação**: acrescentar uma tarefa 6.3 (ou um novo passo no grupo 6) que corre a sweep completa, análoga à do precedente.
- Tratamento de erro/resiliência da reconexão de WS está coberto explicitamente pela tarefa 5.3 (reconciliação via `list_messages`/`list_since` como fonte de verdade) — bom, evita deixar isso implícito.

## 5. Execução das decisões arquiteturais
Veredito: Atenção

- As tarefas seguem fielmente as decisões D2–D7 do `design.md` (identidade por `code`, metadado em claro, eventos de delta mínimo, REST com dois verbos, permissão de escrita, validação server-side) sem reabrir nenhuma sem justificar.
- A única decisão que a implementação revelaria como só parcialmente executável é D1: a promessa de "seguir o mesmo padrão já usado" para `attachment_ids`/`mentioned_account_ids` é textualmente verdadeira (mesmo `enrich()`), mas a tarefa 1.3 descreve uma assinatura em lote que o padrão real não usa — ver dimensão 1. Não é um problema de arquitetura (a decisão em si — agregar no `enrich()` — está correta e é a escolha certa), é um detalhe de tasks.md que não bate com o código real; fica resolvido ajustando a tarefa, não o design.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma que exija revisitar uma decisão de `design.md` — os dois achados de "Atenção" (assinatura de `enrich()`/agregação em lote, e i18n/fecho ausentes de `tasks.md`) são correções de `tasks.md`, não do desenho técnico em si.

**Reconciliação (2026-10-09):** `tasks.md` 1.3/1.4 ajustadas para `reactions_for_message` por-mensagem (consistente com `enrich()` real); 3.2/4.4 passaram a incluir as chaves de i18n; nova tarefa 6.3 cobre a sweep de fecho (`tsc`, `eslint`, `check:v1-overlap`, `verify:i18n-keys`, `cargo test`). Todos os achados de "Atenção" resolvidos antes do início da implementação.
