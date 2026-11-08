# Tasks

## 1. Backend

- [x] 1.1 Definir e documentar o consentimento explícito para mensagens de integração em claro em canais cujas mensagens humanas usam E2EE.
- [x] 1.2 Criar migração aditiva: `channel_webhook` com `channel_id TEXT UNIQUE`, conta dedicada por canal, hash de token e `revoked_at`; adicionar `account.is_system_account INTEGER NOT NULL DEFAULT 0` e campos snapshot de nome/avatar para mensagens `kind=webhook`. Não alterar a FK `message.sender_account_id` nem reconstruir `message`; manter leitura das mensagens existentes.
- [x] 1.3 Ajustar `db::account::count` para contar só `is_system_account = 0` e verificar os dois usos em `backend/src/api/mod.rs:253` (`initial_setup`) e `backend/src/api/auth/register.rs:177` (primeira conta/operador). Recusar explicitamente contas de sistema em `login.rs`, mesmo com hash descartável.
- [x] 1.4 Implementar gestão autenticada por permissão efectiva de gerir canal: criação transaccional de conta exclusiva sem `membership`, segredo mostrado uma vez, listagem sem segredo, alteração de nome/avatar, rotação, revogação por `revoked_at` e reactivação da mesma linha/conta. Revogar nunca apaga conta ou mensagens históricas.
- [x] 1.5 Implementar POST público com comparação segura de token e verificação de `revoked_at` em cada pedido, validação de payload, limite de corpo, rate limit e `Retry-After`.
- [x] 1.6 Persistir `kind=webhook` com snapshot imutável de nome/avatar e `sender_account_id` da conta dedicada; distribuir `message.new` aos espectadores autorizados. Testar que rotação/revogação impedem publicação pela URL antiga e que histórico e identidade continuam visíveis.

## 2. Frontend e verificação

- [x] 2.1 Criar gestão por canal com aviso de segredo, consentimento para conteúdo em claro e indicação aos leitores.
- [x] 2.2 Propagar snapshots de nome/avatar pela API e WS e adaptar `MessageRow.tsx:134` para usar essa segunda fonte em `kind=webhook`, pois `props.people` só contém membros; cobrir histórico, citações, notificações e selo de integração. Reter avatar local versionado ou fallback estável após alteração/revogação.
- [x] 2.3 Testar autorização, uma conta por canal, ausência de `membership`, primeiro registo humano, login de conta de sistema, token inválido/revogado, limites, distinção de E2EE, tempo real, histórico preservado e migração de mensagens antigas; incluir testes automatizados backend para token revogado/rate limit.

## 3. Revisão

- [x] 3.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 3.2 `openspec validate channel-webhooks --strict`.
