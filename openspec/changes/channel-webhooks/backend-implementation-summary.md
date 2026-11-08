# Implementação backend — channel-webhooks

Secção 1.1–1.6 implementada na árvore actual, branch `main`, sem commit. Secções 2 e 3 não marcadas. Nenhum ficheiro frontend foi alterado por esta implementação.

## Ficheiros

- `backend/migrations/0028_channel_webhooks.sql`: adiciona `account.is_system_account`, `channel_webhook` com unicidade por canal/conta e `revoked_at`, mais três colunas de snapshot em `message`. Nenhuma coluna de snapshot prévia tinha estes nomes; a FK do remetente não foi alterada.
- `backend/src/domain/account.rs`, `backend/src/db/account.rs`, `backend/src/api/auth/register.rs`, `backend/src/api/auth/login.rs`: marcador de sistema no registo e INSERT/SELECT; contagem só de contas humanas; primeira conta humana continua operador sem convite; login de sistema devolve as mesmas credenciais inválidas. Os usos de `count()` em `api/mod.rs` e `auth/register.rs` continuam correctos com o filtro.
- `backend/src/domain/channel_webhook.rs`, `backend/src/db/channel_webhook.rs`, respectivos `mod.rs`: `ChannelWebhook` público sem segredo; `ChannelWebhookRow` interno com hash; `find_by_channel`, `find_by_id_active`, `create_or_reactivate`, `revoke`, `rename`, `rotate_token`, `public_view`; `CreateOutcome::{Created, Reactivated, AlreadyActive}`. Criação de conta e linha numa transacção, sem `membership`; reactivação mantém conta/linha.
- `backend/src/api/channels.rs`, `backend/src/api/avatars.rs`: expõe internamente a autorização de gestor e helpers de imagem já existentes.
- `backend/src/api/webhooks.rs`, `backend/src/api/mod.rs`: endpoints de gestão, envio público e avatar histórico; `Cache-Control: no-store` nas respostas que mostram segredo. `consent_cleartext: true` é obrigatório em criação e reactivação.
- `backend/src/domain/message.rs`, `backend/src/db/message.rs`: `kind=webhook`, conteúdo em claro, `sender_account_id` real e snapshots de nome/avatar; `create_webhook` e `webhook_avatar_snapshot`; `sender_avatar_url` é `/api/messages/{message_id}/webhook-avatar` somente quando há avatar; histórico e evento `message.new` usam a mesma forma serializada.
- `backend/src/domain/channel.rs`, `backend/src/db/channel.rs`, `backend/src/api/channel_provision.rs`: `has_active_webhook` é calculado por `LEFT JOIN` e exposto aos leitores do canal.
- `backend/src/rate_limit.rs`: `allow_webhook_post` com chave por webhook e IP, 10 pedidos por 60 segundos.
- `backend/tests/contract/channel_webhooks.rs`, `backend/tests/contract/mod.rs`: contratos de consentimento, segredo, publicação, histórico, rotação, revogação, reactivação, avatar histórico, rate limit, canal de voz, login de sistema, ausência de membership e primeira conta humana.
- `openspec/changes/channel-webhooks/backend-consent.md`: texto exacto recomendado para consentimento e indicação visível; documenta que campos JSON extras são ignorados.
- `openspec/changes/channel-webhooks/tasks.md`: 1.1–1.6 marcadas; 2 e 3 intactas.

## Rotas finais

| Método | Rota | Resultado |
|---|---|---|
| POST | `/api/channels/{channel_id}/webhooks` | 201 criado / 200 reactivado com `webhook` e `token` uma vez; 409 `webhook_already_active` |
| GET | `/api/channels/{channel_id}/webhooks` | 200 com webhook sem segredo, ou `null` |
| PATCH | `/api/channels/{channel_id}/webhooks/{webhook_id}` | altera `display_name` |
| DELETE | `/api/channels/{channel_id}/webhooks/{webhook_id}` | revoga, 204 |
| POST | `/api/channels/{channel_id}/webhooks/{webhook_id}/rotate` | novo token, invalida anterior |
| PUT | `/api/channels/{channel_id}/webhooks/{webhook_id}/avatar` | imagem raw, header `x-mesa-media-type` |
| POST | `/api/webhooks/{webhook_id}/{token}` | publicação pública, 201 `Message`; 429 com `Retry-After: 60` |
| GET | `/api/messages/{message_id}/webhook-avatar` | avatar snapshot, apenas leitor autorizado |

O nome inicial por omissão é o nome do canal. `ApiError::too_many_requests()` é convertido em resposta e recebe `Retry-After` somente no endpoint público, sem mudar a estrutura global de erro. O corpo público aceita apenas `content` para uso, ignorando outras chaves JSON. O avatar anterior não é apagado na substituição, pois mensagens antigas guardam o filename; isto acumula ficheiros órfãos ao longo do tempo, sem GC neste escopo.

## Verificações

- `cargo test --test contract channel_webhooks -- --nocapture`: **4 passaram, 0 falharam**.
- `cargo test`: **226 passaram e 9 falharam** na suite `contract`; todos os 9 falham ao abrir socket WebSocket real com `PermissionDenied (Operation not permitted)` neste sandbox. O comando pára nessa suite, portanto não há confirmação de 0 falhas do workspace. Os testes de contrato novos passaram também nesta execução (antes de acrescentar o quarto teste de avatar).
- `cargo fmt --check`: **passou** depois de `cargo fmt`.
- `cargo clippy --all-targets -- -D warnings`: **não passou** por avisos existentes em `api/auth/email.rs`, `api/auth/key_reminders.rs`, `api/channel_provision.rs`, `db/message.rs::create`, `domain/attachment.rs`, `domain/avatar.rs`, `domain/permissions.rs` e `token/mod.rs`. O aviso da nova `db/message.rs::create_webhook` foi resolvido com `#[allow(clippy::too_many_arguments)]`, pois a assinatura pedida tem nove parâmetros. Os avisos existentes não foram alterados nesta change.
- `openspec validate channel-webhooks --strict`: **passou**.
