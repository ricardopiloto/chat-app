# Política de alteração de backend durante a reescrita do frontend

O backend da v1 (`backend/`) é reaproveitado como está. O frontend v2 consome os mesmos endpoints REST, o mesmo protocolo WebSocket e o mesmo modelo de dados.

## Quando uma alteração de backend é admitida

Só quando **todas** as condições se verificam:

1. Um requisito de um spec do frontend v2 (ou um item de `docs/v2/parity-checklist.md`) não pode ser satisfeito com os endpoints actuais.
2. Não existe alternativa razoável no cliente (por exemplo, compor chamadas existentes).
3. A necessidade vem do frontend. Elementos de mockup que exigiriam dados ou endpoints inexistentes são **fora de escopo** (AUDIT-fidelity §6) e não justificam alteração.

## Como a alteração tem de ser feita

- **Aditiva e retrocompatível**: novos campos opcionais, novos endpoints, novos eventos. Nenhum campo ou rota existente muda de significado ou é removido enquanto o rollback para a v1 (`frontend/dist`) estiver disponível.
- **Tarefa própria** no `tasks.md` do change que a exige, com o requisito que a motiva.
- **Contrato registado** na tabela abaixo e, se mudar a forma de dados, em `specs/002-fase-1-mvp/contracts/` (REST/WS) ou nesta pasta (formatos criptográficos).
- **Testes**: `cargo test` do backend a passar, com testes novos para o comportamento acrescentado.
- **Migração**: se houver migração de base de dados, é aditiva e aplicável sobre dados existentes.

## Registo de alterações

| Data | Change | Requisito que a exige | Alteração | Retrocompatível | Testes |
|---|---|---|---|---|---|
| 2026-10-01 | `frontend-v2-server-admin` (tarefa 8.4) | Onboarding de convidado: "handle com disponibilidade" (D4 do design e `mesa_convite_onboarding_de_convidado`). Decisão do responsável do projecto de acrescentar o endpoint, em excepção à condição 3 acima (elemento de mockup sem endpoint). | Novo `GET /api/invites/{code}/handle-available?handle=`, `{available}`; só para convite utilizável (404 caso contrário); 60 pedidos/min por IP | Sim (aditiva; nenhuma rota existente muda) | `backend/tests/contract/invites.rs`: livre/ocupado, convite inválido ou revogado, handle vazio, limite de pedidos |
| 2026-10-02 | `frontend-v2-voice-video` (tarefa 11.4) | VOZ-15 do `parity-checklist.md`: "Religar E2EE — chave certa religa; errada dá erro". O backend não expunha a chave de canal selada, logo o cliente só conseguia validar o formato da chave colada. Decisão do responsável do projecto. | Novo `GET /api/channels/{id}/voice/channel-key` → `{channel_key_sealed}` (base64 do blob já guardado em `channel_key.sealed_blob`); só o dono do servidor que é o custodiante da chave (403 caso contrário; 404 sem chave; 401 sem sessão). O cliente abre-o com a sua identidade e compara com a chave colada. | Sim (aditiva; nenhuma rota existente muda; sem migração) | `backend/tests/contract/channels_delete.rs::channel_key_is_readable_only_by_the_custodian` (custodiante, sem sessão, membro não custodiante). `cargo test`: contrato 139/139; `integration::server_isolation` já falhava antes (404 em vez de 403), alheio a esta alteração |
| 2026-10-03 | `frontend-v2-mention-everyone-and-voice-fixes` (tarefas 3.1 a 3.3) | Pedido do responsável do projecto: permissão de cargo para mencionar `@todos` num canal de texto, notificando todos os membros que o veem. O texto é cifrado no cliente, por isso o servidor não o pode ler e o cliente tem de declarar a intenção; a permissão só pode ser decidida no servidor, e o limite de 20 menções individuais não serve para notificar um canal inteiro. | Migração `0022`: `server_role.can_mention_everyone` (desligada por omissão, ligada no cargo de sistema Dono) e `message.mentions_everyone`. `RoleCapabilities.can_mention_everyone` em `GET/POST/PATCH .../roles`. `POST .../messages` aceita `mention_everyone` (opcional): só o dono ou um cargo com a capacidade o aplica (caso contrário é ignorado e a mensagem segue como texto simples); notifica, numa transação e com `notification.created`, todos os membros com acesso de ver o canal, menos o remetente. A mensagem passa a devolver `mentions_everyone: true` (omitido quando falso), também em `message.new`. | Sim (campos opcionais novos, nenhuma rota nem campo existente muda; clientes antigos não enviam nem leem os campos novos) | `backend/tests/contract/mention_everyone.rs` (8): capacidade desligada por omissão e ativável, dono notifica todos, sem permissão é texto simples, cargo com permissão, sem notificação dupla, canal privado, mais de 20 membros, remetente silenciado. `cargo test`: contrato 147/147; `integration::server_isolation` continua a falhar como antes, alheio a esta alteração |

O `frontend-v2-polish-cutover` reconcilia esta tabela antes do corte (tarefa 4A.4).

**Reconciliação (2026-10-02, `frontend-v2-polish-cutover` 4A.4):** as duas alterações acima são as únicas desde `main`, ambas aditivas e testadas; `cargo test`: unitários 10/10, contrato 139/139. Relatório em `docs/v2/closing-report.md`. O rollback para `frontend/dist` não é afetado.
