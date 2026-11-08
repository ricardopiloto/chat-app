# Review — Arquiteto de Soluções

**Change:** restrict-scene-edit-to-channel-creator
**Data:** 2026-11-07 (revisão do código implementado)
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica
Veredito: OK

- Implementação confere com o `design.md`: `backend/src/api/scenes.rs` substitui os dois wrappers locais (`require_admin`, `can_activate`) por uma única função `require_scene_creator(account_id, &channel)` que compara `channel.created_by_account_id`. `permissions::is_channel_admin` deixou de ser importada neste ficheiro e não foi tocada — confirmei por `grep` que `channel_roles.rs`, `grid.rs` e `invites.rs` continuam a usá-la sem alteração.
- **Desvio não previsto, mas correcto e bem justificado**: o editor de cena gravava via `PUT /api/channels/{id}/grid`, que tem a sua própria verificação (dono do servidor, em `grid.rs`, não tocada por esta change). Sem ajustar isso, um criador não-dono veria o botão «Editar cena» mas receberia 403 ao guardar. A correcção foi acrescentar um cliente para `PATCH /api/channels/{id}/scenes/{sceneId}` (endpoint que já existia e já persiste `layout`, código pré-existente não alterado por esta change) e religar `sceneStore.ts` a ele. Verifiquei que `patch_scene` já tratava `body.layout` antes desta change — não é lógica nova, é redireccionamento do cliente para o endpoint que já tinha a regra certa.

## 2. Integração com a infraestrutura existente
Veredito: N/A

- Sem infraestrutura nova, confirmado na implementação real.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- Segurança: verifiquei pessoalmente, correndo a suite, que o teste novo (`only_recorded_channel_creator_can_mutate_scenes`) cobre as cinco rotas de mutação × três perfis (dono não-criador, gestor com `can_manage_channels`, membro comum) todas recusadas com 403, leitura permitida aos três, e o criador real a conseguir as cinco operações — inclusive o caso de canal histórico com backfill da migração 0006. `cargo test` (232 testes de contrato, 25 unitários, 2 de integração, 1 de escala) passa a 100% neste ambiente — os 9 testes de WebSocket que o Codex reportou como falhados eram uma restrição do sandbox dele (sem permissão para abrir socket), não uma regressão: confirmei correndo a suite completa, que passou integralmente.
- Nenhum ponto de autorização de cena ficou por trocar — os cinco `pub async fn` de `scenes.rs` (`create_scene`, `patch_scene`, `delete_scene`, `duplicate_scene`, `activate_scene`) usam todos `require_scene_creator` agora.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `implementation-summary.md` documenta o desvio do `PUT /grid` → `PATCH scene` com o motivo certo. `tasks.md` 1.1-1.3 marcadas como concluídas, consistente com o código real.

## 5. Ponte entre produto e técnico
Veredito: OK

- O pedido original ("editar cena só para o criador do canal, não o dono do servidor") está implementado ponta a ponta — backend, frontend e persistência da gravação, não só o botão visível.

## Bloqueantes antes de implementar
- Nenhum. Falta só `openspec validate` (tarefa 3.2, farei a seguir) antes de considerar a change pronta para arquivar.
