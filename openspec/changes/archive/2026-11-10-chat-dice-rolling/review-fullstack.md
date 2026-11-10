# Review — Desenvolvedor Fullstack

**Change:** chat-dice-rolling
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- Tarefa 7.1 está correctamente ancorada ao código real: `backend/src/db/channel.rs` tem de facto `struct Row` (linha ~7), `fn map_row` (~22), `SELECT_COLS` (~52), `create` (~58), `find_by_id` (~107) e `list_by_server` (~121) — os seis pontos que a tarefa pede para confirmar existem com esses nomes. Também confirmado por leitura: há um segundo sítio que constrói `Channel { ... }` directamente, em `backend/src/api/channel_provision.rs:54` (provisionamento do canal `geral` por omissão ao criar um servidor) — a formulação da Tarefa 7.1 ("confirmar todos os construtores de `Channel`") já cobre isto em prosa, mas vale nomear este ficheiro explicitamente para quem for implementar não ter de redescobri-lo.
- **Achado concreto de não-atomicidade em `patch_channel`** (Tarefa 7.3, "fazer a validação antes de persistir qualquer campo do mesmo pedido"): por leitura de `backend/src/api/channels.rs:112-115`, `patch_channel` já persiste `name` imediatamente (`db::channel::update_name(...).await?`) **antes** de chegar ao bloco `if body.visibility.is_some() || body.visible_to_new_members.is_some() { ... }` que faz a validação (incluindo o erro 400 de "privado + visível a novos membros"). Ou seja, a função actual **já não é atómica** entre `name` e o resto do body — um PATCH com `name` válido e `visibility`/`visible_to_new_members` inválidos hoje já persiste o nome antes de recusar o resto. A Tarefa 7.3, ao prometer "validação antes de persistir qualquer campo do mesmo pedido" para `dice_animations_enabled`, promete uma garantia mais forte do que a função já cumpre para os campos existentes. **Recomendação**: ou (a) suavizar a Tarefa 7.3 para "antes de persistir o próprio campo `dice_animations_enabled` ou qualquer campo do bloco de visibilidade", replicando o comportamento real já existente (não atómico com `name`, atómico dentro do novo bloco), ou (b) se se quiser mesmo atomicidade completa do PATCH, isso é um refactor maior de `patch_channel` (validar tudo antes de persistir qualquer coisa) que afecta campos já existentes, não só o novo — e devia ser uma tarefa/decisão à parte, não implícita dentro da 7.3.

## 2. Desenvolvimento do frontend

Veredito: OK

- Tarefa 7.4 aponta correctamente para `frontend/src/api/types.ts` (`Channel`) e `frontend/src/api/endpoints/channels.ts` — confirmado por leitura que `channels.update` tem hoje um tipo inline `{ name?: string; visibility?: Channel["visibility"]; visible_to_new_members?: boolean }` (não uma interface nomeada); acrescentar `dice_animations_enabled?: boolean` a este literal é uma mudança pequena e exactamente onde a tarefa diz.
- `AccessPanel.tsx` já tem o padrão exacto que a Tarefa 7.4 pede reaproveitar: `const text = () => props.channel.type === "text"` e `const [listed, setListed] = createSignal(props.channel.visible_to_new_members)` — o novo interruptor segue a mesma forma, sem desenhar um padrão novo.
- Tarefa 7.5 referencia correctamente as Tarefas 6.4/6.5/6.6 da secção anterior pelos números já renumerados — sem referência cruzada quebrada.

## 3. Deploy e operação

Veredito: OK

- Migração nomeada como `backend/migrations/NNNN_channel_dice_animations.sql` — consistente com a numeração sequencial já usada (`0029_channel_pinned_message.sql` é a mais recente); o número real só se define no momento de criar o ficheiro, o que é normal nesta fase de planeamento.
- Nenhuma mudança de deploy/infra além da migração — coerente com o resto da change.

## 4. Qualidade de código

Veredito: OK

- Tarefa 7.6 já prevê o teste mais importante (PATCH do campo num canal de Dados devolve 400 **e não altera dados**) — se a Tarefa 7.3 for ajustada conforme a recomendação da secção 1, o teste desta tarefa deve reflectir a semântica final escolhida (atomicidade só dentro do novo bloco, ou atomicidade total do PATCH).
- Secção 7 mantém o formato `- [ ] N.M ... Verificar:` já consistente com o resto do `tasks.md`.

## 5. Execução das decisões arquiteturais

Veredito: OK

- D1-D5 do `design.md` estão fielmente implementadas nas Tarefas 7.1-7.6, sem reabrir nenhuma decisão das rondas anteriores (RNG do servidor, tipos de canal, biblioteca 3D).
- Tarefa 7.5 liga correctamente a nova condição (tipo + interruptor) ao ponto exacto de disparo do overlay já decidido na ronda anterior (Tarefa 6.5/`thread.ts` `onEvent`), sem duplicar a lógica de filtragem por canal montado.

## Bloqueantes antes de implementar

- Nenhum.

## Limitações técnicas a reportar ao Arquiteto

- A mesma lacuna de consistência eventual do cache (D5/Tarefa 7.5: o cliente decide com o valor de `dice_animations_enabled` que já tiver em cache no momento de `message.new`, que pode estar momentaneamente atrasado face a um `patch_channel` muito recente) — convergente com o achado do Arquiteto (`review-architect.md`, dimensão 3). Recomenda-se a mesma acção: nomear o risco em `Risks / Trade-offs`, aceitar a mitigação "impacto de, no máximo, uma rolagem".
