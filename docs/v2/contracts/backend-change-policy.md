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

O `frontend-v2-polish-cutover` reconcilia esta tabela antes do corte (tarefa 4A.4).
