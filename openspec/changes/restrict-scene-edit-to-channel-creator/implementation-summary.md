# Implementação — restrict-scene-edit-to-channel-creator

## Ficheiros alterados

- `backend/src/api/scenes.rs`: substituídos os dois wrappers locais de autorização por uma comparação única com `channel.created_by_account_id`, aplicada a criar, alterar, apagar, duplicar e ativar cenas. Leituras mantidas. `permissions::is_channel_admin` não foi alterada.
- `backend/tests/contract/scenes.rs`: acrescentado teste de contrato para as cinco mutações, cobrindo criador, dono não criador, gestor de canais e membro comum; verifica também leituras de membros e o valor de criador preenchido segundo o backfill da migração 0006.
- `frontend/src/voice/Stage.tsx`: botão «Editar cena» visível apenas quando `shell.meId()` corresponde a `props.channel.created_by_account_id`.
- `frontend/src/api/endpoints/voice.ts`: adicionado cliente para `PATCH /api/channels/{channelId}/scenes/{sceneId}`.
- `frontend/src/voice/sceneStore.ts`: grava o layout na cena ativa pelo novo cliente, mantendo o erro de 403 propagado ao `SceneEditor` para feedback. Guarda o ID da cena ativa recebido na lista e nos eventos.
- `openspec/changes/restrict-scene-edit-to-channel-creator/tasks.md`: tarefas 1.1, 1.2 e 1.3 marcadas como concluídas; revisão dupla e validação permanecem abertas.

## Verificações

- `cargo test` em `backend/`: **não passa neste sandbox**. 223 testes de contrato passaram, incluindo o novo; nove testes de WebSocket falharam ao tentar abrir sockets com `Operation not permitted`. Os testes unitários passaram (25). Repetição com esses nove testes excluídos: **passou** (223 testes de contrato, dois de integração e um de escala).
- `npx tsc --noEmit` em `frontend/`: **passou**.
- `npx eslint src` em `frontend/`: **passou com um aviso pré-existente** em `src/voice/callSession.tsx:48` (`consistent-type-imports`), sem erros.

## Desvios e motivo

- O fluxo de gravação do editor foi alterado de `PUT /grid` para `PATCH` da cena ativa. O endpoint de grade mantém uma autorização própria para o dono do servidor; sem esta alteração o criador não dono veria o botão de edição mas receberia 403 ao guardar. A regra de autorização de grade e o helper partilhado permaneceram intactos.
- A passagem integral de `cargo test` não pôde ser confirmada como verde devido à restrição de sockets do sandbox. A passagem com os nove testes afetados excluídos e o teste novo isolado passaram.
