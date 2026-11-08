# Review — Desenvolvedor Fullstack

**Change:** restrict-scene-edit-to-channel-creator
**Data:** 2026-11-07 (revisão do código implementado)
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: OK

- `require_scene_creator` passou de `async fn` (precisava de `db::server::find_by_id`) para `fn` síncrona, já que `channel` (com `created_by_account_id`) já está em scope em todos os 5 call sites antes da chamada — reduz uma query por mutação de cena face ao código anterior (`require_admin`/`can_activate` faziam `find_by_id` do servidor em cada chamada). Pequena melhoria de desempenho como efeito colateral, não pedida mas correcta.
- Confirmei por grep que não resta nenhuma referência a `require_admin`/`can_activate` no backend — remoção completa, sem código morto.

## 2. Desenvolvimento do frontend
Veredito: Atenção

- `Stage.tsx:30` usa `shell.meId() === props.channel.created_by_account_id`, e `created_by_account_id: Id` já existe no tipo `Channel` (`frontend/src/api/types.ts:127`) — implementação directa, sem gambiarra de tipos.
- **Achado pequeno, não bloqueante**: a troca do caminho de gravação (`PUT /grid` → `PATCH scene`) deixou `grid.save` (`frontend/src/api/endpoints/voice.ts`) sem nenhum chamador — confirmei por grep que `gridApi.save`/`fetchGrid`'s par de escrita não é mais usado em `frontend/src`. Não é um bug (o endpoint backend `PUT /grid` continua a existir e funcionar, só o cliente ficou órfão), mas é código morto que vale remover numa limpeza, já que o projecto evita deixar isso parado (visto em `docs/backlog/backlog.md`, que trata ficheiros não importados como "não implementados").
- `sceneStore.ts`'s `save()` agora faz `activeSceneId() || (await gridApi.scenes(channelId())).active_scene_id` como fallback — correcto para o primeiro save antes do `.then()` de `gridApi.scenes` ter resolvido, mas vale confirmar (tarefa 1.3 cobriu isto só no backend) que a UI não deixa o criador tentar gravar antes de `loaded()` ser verdadeiro, para não fazer essa chamada extra de rede sem necessidade em todo save.

## 3. Deploy e operação
Veredito: N/A

Sem migração, variável de ambiente ou processo novo.

## 4. Qualidade de código
Veredito: OK

- Corri a suite eu próprio: `cargo test` 232/232 (unit 25, contrato 232, integração 2, escala 1), `tsc --noEmit` limpo, `eslint src` só com o aviso pré-existente e não relacionado em `callSession.tsx:48`. Sem regressão.
- O teste novo (`only_recorded_channel_creator_can_mutate_scenes`) cobre a matriz pedida em `tasks.md` 1.3 por completo: canal histórico com backfill, dono não-criador, gestor com `can_manage_channels`, membro comum (todos os 5 endpoints, 403), leitura permitida aos três, e o criador real a conseguir as 5 operações. É o teste de contrato mais completo deste lote de changes revisto hoje.

## 5. Execução das decisões arquiteturais
Veredito: OK

- Fiel a D1/D2 do `design.md` original. O desvio do caminho de gravação está documentado em `implementation-summary.md` com motivo correcto e não contradiz nenhuma decisão tomada — é uma correcção de uma lacuna que a proposta não tinha previsto (o acoplamento ao `PUT /grid`), não uma mudança de rumo.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma nova. O código morto em `grid.save`/`fetchGrid`'s escrita é cosmético, não arquitectural.
