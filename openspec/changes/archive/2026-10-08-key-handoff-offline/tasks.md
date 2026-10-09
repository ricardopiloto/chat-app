# Tasks

## 1. Contrato e formato

- [x] 1.1 Documentar a semente de convite (par efémero, selagem, base64url, limites de tamanho, valor de verificação da chave) em `docs/v2/contracts/crypto-formats.md` e atualizar `specs/002-fase-1-mvp/contracts/key-handoff.md` (incluindo que a recuperação por código do operador permanece no handoff online); verificar com revisão dos docs e `openspec validate key-handoff-offline --strict`.
- [x] 1.2 Adicionar vectores da semente em `docs/v2/contracts/vectors/crypto-vectors.json` e o caso em `frontend/scripts/contracts/`; verificar com o runner de contratos a passar.

## 2. Backend (aditivo)

- [x] 2.1 Migração `0024` com `invite.key_seed` anulável; a revogação existente continua a bloquear novas aceitações e não retira a elegibilidade de quem já aceitou; verificar com teste de migração e de revogação antes e depois do aceite em `backend/tests/contract/invites.rs`.
- [x] 2.2 `POST /servers/{id}/invites` aceita `key_seed` opcional com limite de tamanho; preview e listagem nunca o devolvem; verificar com testes em `backend/tests/contract/invites.rs` (presente, ausente, preview).
- [x] 2.3 `accept_invite` devolve `key_seed` nos dois ramos (utilizador com sessão e visitante via `register_inner`) e não o devolve a quem já é membro; verificar com testes em `backend/tests/contract/invites.rs` para os três casos.
- [x] 2.4 `post_envelope` aceita o envelope próprio de um membro `pending` com `joined_via_invite_id` de convite com semente e sem envelope, dentro do `BEGIN IMMEDIATE` e antes do ramo `own`, sem alterar a regra `others > 0`; verificar com testes em `backend/tests/contract/key_envelopes.rs`: sucesso, sem convite com semente (409), segundo envelope, revogado depois do aceite, e regressão do 409 existente.
- [x] 2.5 Log `info` de convite aceito com semente e sem semente, sem conteúdo do blob; verificar por leitura do log num teste de contrato.
- [x] 2.6 Registar a alteração na tabela de `docs/v2/contracts/backend-change-policy.md` com o requisito do frontend que a motiva, a retrocompatibilidade e os testes; verificar por revisão do doc.
- [x] 2.7 Teste de contrato de que `replay_pending_handoffs` entrega todos os pendentes a quem liga; verificar com teste de integração WS com 3 pendentes.

## 3. Frontend

- [x] 3.1 Novo `crypto/inviteSeed.ts` (gerar, selar, abrir, verificar a chave) com testes unitários contra os vectores.
- [x] 3.2 `InviteDialog.tsx` gera o link com fragmento, aviso e expiração curta por omissão; criador `pending` cai sem semente; verificar com teste de componente e manualmente no navegador.
- [x] 3.3 `Invite.tsx` e `session.tsx::joinWithInvite`: ler o fragmento antes da navegação, limpar o hash com `history.replaceState`, abrir e verificar a chave, publicar o envelope e entrar `synced`; falha de verificação ou de publicação cai em `pending` sem bloquear a entrada; verificar com teste e que nenhum pedido contém o fragmento.
- [x] 3.4 Preservar o fragmento no roteador e no deep link do Tauri; verificar abrindo o link no navegador e no cliente Tauri. Navegador verificado: o hash `#k=` chega à página de convite, sai da barra depois do mount e o aceite ainda sincroniza. O cliente Tauri fica fora desta entrega, por decisão de 2026-10-08; `ingestDeepLink` permanece para um shell futuro.
- [x] 3.5 `keyHandoff.ts`: deduplicar por conta, limitar a 4 envelopes em voo e tratar 409 repetido como sucesso; verificar com teste unitário de 20 pedidos.
- [x] 3.6 Estado de espera: reutilizar `noKey` de `chat/thread.ts` com mensagem "aguardando um membro online" e retoma automática em `key_handoff.completed`, com i18n `pt-BR` e `en`; verificar manualmente com membro pendente e depois com um membro a ligar, incluindo largura mobile.

## 4. Integração

- [x] 4.1 Cenário ponta a ponta: convidar com todos os membros offline e confirmar leitura e envio imediatos (utilizador com sessão e visitante novo); convite antigo sem semente fica pendente e conclui quando um membro liga; verificar no navegador. Base descartável `/tmp/mesa-handoff-e2e.db`. Com o anfitrião offline, `sessionuser` e `visitor` leram e enviaram; `pendingguest` ficou pendente no convite sem semente e passou a ler o histórico quando o anfitrião voltou, sem recarregar a página.
- [x] 4.2 Só iniciar a implementação depois de `password-recovery` ser integrado (mesmos `keyHandoff.ts` e `key_envelopes.rs`); correr a suíte completa de backend e frontend no fim. O arranque foi autorizado com `password-recovery` ainda aberto. Suíte: `cargo test` unitários 12/12, contrato 174/174, scale 1/1; `integration::server_isolation` continua 404 em vez de 403. Frontend: `test:contracts`, `invite-handoff`, `verify:i18n-keys`, `lint` (aviso pré-existente em `callSession.tsx`), `build`.
