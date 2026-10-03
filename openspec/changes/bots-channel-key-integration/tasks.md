# Tasks

## 1. Migração de schema

- [ ] 1.1 Nova migração: recriar `key_envelope` com PK `(channel_id, account_id)` (FK → `channel.id`), removendo o acoplamento a `server_id`; verificar com `sqlx migrate run` limpo e `PRAGMA foreign_key_list(key_envelope)` mostrando a FK para `channel`.
- [ ] 1.2 Nova migração: `ALTER TABLE account ALTER COLUMN password_hash` para nullable (ou equivalente SQLite de recriar a tabela); verificar inserindo uma linha de teste com `password_hash = NULL` sem erro de constraint.
- [ ] 1.3 Nova migração: criar tabela `bot (account_id TEXT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE, owner_account_id TEXT NOT NULL REFERENCES account(id), token_hash TEXT NOT NULL, token_expires_at TEXT, created_at TEXT NOT NULL)` — `token_expires_at` nullable, `NULL` = sem expiração; verificar com `INSERT`/`SELECT` de uma linha de teste (com e sem expiração) e `ON DELETE CASCADE` ao apagar a `account` associada.
- [ ] 1.4 Confirmar explicitamente, por teste de integração, que a tabela `channel_key` (migração 0006, custódia de gravação) e `e2ee_audit_log` continuam com o schema e o comportamento inalterados após as migrações acima.

## 2. Backend — chave por canal

- [ ] 2.1 Reescrever `backend/src/db/key_envelope.rs` para operar por `(channel_id, account_id)` em vez de `(server_id, account_id)`; verificar com testes unitários de `upsert`/`get_for_account`/`delete_for_account` cobrindo o novo par de chaves.
- [ ] 2.2 Mover as rotas de `backend/src/api/key_envelopes.rs` de `/api/servers/{id}/key-envelopes` para `/api/channels/{id}/key-envelopes`; verificar com teste de contrato em `backend/tests/contract/` exercitando o novo path.
- [ ] 2.3 Actualizar os eventos WS `key_handoff.requested`/`key_handoff.completed` para carregar `channel_id` em vez de `server_id`; verificar com teste de integração em `backend/tests/integration/` que publica o evento e confirma o payload.
- [ ] 2.4 Na resolução de elegibilidade para handoff (quem recebe o pedido/deve ser resselado), consultar a ACL de canal existente (`backend/src/domain/channel_acl.rs`) em vez de "todo membro do servidor"; verificar com teste cobrindo um canal privado — membro sem ACL não aparece como elegível.
- [ ] 2.5 Ao conceder ACL de um canal privado a uma conta que antes não a tinha, disparar o mesmo fluxo de pedido de handoff dessa `channel_key`; verificar com teste de integração ACL→handoff.
- [ ] 2.6 Script/rota administrativa de migração de dados de teste: para cada canal existente, gerar `channel_key` nova e resselar aos membros elegíveis correntes; verificar correndo contra a base de dados de teste actual e confirmando que todo canal passa a ter pelo menos um `key_envelope`.

## 3. Backend — conta de bot

- [ ] 3.1 Endpoint de instalação de bot (cria `account` + linha `bot`, token gerado e devolvido uma única vez, `token_hash` persistido, aceita um parâmetro opcional de expiração escolhido pelo dono → `token_expires_at`) escopado a uma lista de canais — concede ACL nesses canais; verificar com teste de contrato que a resposta inclui o token em claro só nesta chamada, e que omitir o parâmetro resulta em `token_expires_at = NULL`.
- [ ] 3.2 Autenticação por token de bot: handshake HTTP/WS que troca o token por uma sessão equivalente à de login humano (reaproveitando `backend/src/token/`), recusando tokens com `token_expires_at` no passado; verificar com teste de integração cobrindo token válido, token expirado e token sem expiração.
- [ ] 3.3 Bloquear explicitamente o endpoint de login humano para contas presentes em `bot` (ver design D2); verificar com teste que tentar login por password numa conta de bot devolve erro claro, não um 500.
- [ ] 3.4 Endpoint de revogação (apagar a conta de bot); verificar com teste de integração que, após a chamada, nenhum `key_envelope` nem `channel_acl` resta para essa `account_id` em nenhum canal.

## 4. Frontend — cliente de chave por canal

- [ ] 4.1 Reescrever `frontend/src/crypto/serverKey.ts` para `channelKey.ts` (`Map<channelId, key>`); verificar com os testes existentes de cifra/decifra adaptados à nova chave de indexação.
- [ ] 4.2 Reescrever `frontend/src/crypto/keyHandoff.ts`: `ensureServerKey`/`loadAllServerKeys` tornam-se `ensureChannelKey`/carregamento lazy por canal aberto (ver design D4); verificar manualmente abrindo um canal de texto novo e confirmando no DevTools que o pedido de key-envelope só ocorre nesse momento, não no login.
- [ ] 4.3 Actualizar `frontend/src/voice/callSession.tsx`: troca de `channel.server_id` por `channel.id` na resolução da frame key (ver `mediaKeyFor`); verificar entrando numa sessão de voz e confirmando áudio decifrável entre dois clientes.
- [ ] 4.4 Actualizar UI de estado "sincronizando chave" (hoje por Servidor) para operar por Canal; verificar abrindo um canal recém-concedido antes de qualquer cliente sincronizado estar online e observando o estado pendente correcto.
- [ ] 4.5 Actualizar `docs/v2/contracts/crypto-formats.md` e os vectores em `docs/v2/contracts/vectors/` para reflectir o novo formato de envelope por canal, conforme a spec delta `frontend-v2/crypto-contracts`; verificar que o conjunto de verificação de formato citado nessa spec passa com os novos vectores.

## 5. Frontend — gestão de bots na shell de definições

- [ ] 5.1 Adicionar a capacidade de papel "Gerenciar bots" ao catálogo "Geral" (mesmo local de "Gerenciar canal"/"Gerenciar papéis", specs 047/063/056); verificar que o toggle aparece na página de permissões de um cargo não-sistema e persiste ao guardar.
- [ ] 5.2 Adicionar o item "Bots" à navegação lateral do modo de definições do servidor, visível só a quem tem "Gerenciar bots" ou é dono; verificar com uma conta sem a capacidade (item ausente) e uma com a capacidade (item presente).
- [ ] 5.3 Página "Bots" (lista): nome, canais com acesso, estado do token (activo/expirado), data de criação, acção "Revogar" por linha, ligada ao endpoint de revogação (task 3.4); verificar revogando um bot de teste e confirmando que desaparece da lista e perde ACL/envelopes (mesma verificação da task 3.4, agora pela UI).
- [ ] 5.4 Diálogo "Criar bot": nome, multi-select de canais do servidor, expiração do token (data específica ou "nunca"), ligado ao endpoint de instalação (task 3.1); ao confirmar, mostra o token em claro uma única vez com aviso de que não será mostrado de novo; verificar que fechar/reabrir o diálogo ou a página não volta a expor esse token.

## 6. Bot de música (referência externa)

- [ ] 6.1 Processo de referência (fora deste repositório), implementado em Rust com o SDK `livekit` (crate oficial, ver design D8 — escolhido para poder ser linkado directamente no futuro client desktop Tauri do item 14 do backlog, sem runtime adicional), que troca um token de bot pela chave do canal de voz instalado e entra na sala LiveKit correspondente como participante; verificar manualmente tocando um áudio de teste e confirmando que outro participante humano o ouve decifrado.
- [ ] 6.2 Documentar, em `docs/backlog/backlog.md` (item 10), o endpoint/fluxo real usado por este bot de referência depois de implementado, substituindo a descrição especulativa actual.

## 7. Bot de conversa (referência externa)

- [ ] 7.1 Processo de referência (fora deste repositório, reaproveitando a lógica do `discord-bot/`) que autentica por token, liga ao WS do canal de texto instalado, decifra mensagens novas e publica respostas cifradas; verificar manualmente enviando uma mensagem no canal e observando a resposta do bot.
- [ ] 7.2 Confirmar por teste manual que este bot não consegue decifrar mensagens de um segundo canal de texto onde não tem ACL/envelope.

## 8. Verificação integrada e documentação

- [ ] 8.1 Suite de regressão completa do backend (`cargo test`) e do frontend (testes existentes) a passar após as migrações 1–5; verificar com a execução completa sem falhas novas.
- [ ] 8.2 Actualizar `docs/e2ee-gaps.md` e `specs/002-fase-1-mvp/contracts/key-handoff.md`/`data-model.md` para descrever o modelo por Canal em vez de por Servidor, assinalando os documentos antigos como superados por esta mudança; verificar por leitura cruzada entre os documentos actualizados e o schema real.
- [ ] 8.3 Actualizar `docs/backlog/backlog.md` item 10 com o estado "implementado" (música + conversa) e manter o bot de transcrição como item separado/diferido.
