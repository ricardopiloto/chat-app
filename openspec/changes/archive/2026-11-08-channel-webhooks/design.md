# Design

## Context

`message.sender_account_id` é `TEXT NOT NULL REFERENCES account(id)` (`backend/migrations/0001_init.sql:75`). `backend/src/db/mod.rs` activa `foreign_keys(true)`. A API normal de mensagens exige sessão e ciphertext; webhooks precisam de identidade própria e publicação em claro.

## Goals / Non-Goals

**Goals:** publicação externa por canal, revogável, limitada e distinguível de pessoas.

**Non-Goals:** executar código externo, publicar anexos/embeds/menções, entrar em chamadas ou mudar a cifra das mensagens humanas.

## Decisions

### D1: URL secreta e gestão por canal

Criar token aleatório de alta entropia, mostrado uma vez em `POST /api/channels/{id}/webhooks`, e persistir só o hash. A gestão (criar, renomear, mudar avatar, rodar segredo, revogar e reactivar) exige permissão efectiva de gerir o canal. Há uma única identidade de webhook por canal; a reactivação reutiliza a mesma linha e conta com novo token. `POST /api/webhooks/{id}/{token}` autentica sem sessão. Redigir tokens em logs, omiti-los da listagem e usar `Cache-Control: no-store`. URL com token favorece interoperabilidade com n8n.

### D2: Payload pequeno, inspirado no Discord

Aceitar JSON `{ "content": "..." }`, UTF-8, comprimento e tamanho de corpo limitados. Nome/avatar vêm da configuração do webhook, não do POST; documentar se campos extras são rejeitados ou ignorados. Embeds e overrides ficam fora do escopo.

### D3: Conta dedicada por canal, snapshot e revogação

Cada canal de texto com webhook activo tem uma conta `account` dedicada com UUID, `handle` único e nome de apresentação/avatar próprios. Nunca é partilhada entre canais. Criar `channel_webhook` com `id TEXT PRIMARY KEY NOT NULL` (UUID da URL), `channel_id TEXT UNIQUE NOT NULL REFERENCES channel(id) ON DELETE CASCADE`, `account_id TEXT UNIQUE NOT NULL REFERENCES account(id)`, `token_hash TEXT NOT NULL`, `created_by_account_id TEXT NOT NULL REFERENCES account(id)`, `created_at TEXT NOT NULL` e `revoked_at TEXT`. IDs UUID e datas usam `TEXT` como nas migrações existentes. `UNIQUE(channel_id)` impõe um webhook por canal inclusive após revogação; reactivar reutiliza o registo. Criar a conta e o registo na mesma transacção, somente para `channel.type='text'`.

Adicionar `account.is_system_account INTEGER NOT NULL DEFAULT 0`. A conta do webhook recebe `1`, um `password_hash` gerado aleatoriamente e descartável e uma `identity_pubkey` gerada para satisfazer ambos os `NOT NULL`; não participa de login nem E2EE. `backend/src/api/auth/login.rs` deve recusar explicitamente `is_system_account` antes da verificação de senha/sessão, com o mesmo erro de credenciais inválidas. O segredo aleatório sozinho não é barreira suficiente. Propagar o marcador ao modelo de conta ou consultar a coluna no login.

`db::account::count` deve contar só `is_system_account = 0`. `backend/src/api/mod.rs:253` usa-o para `initial_setup`; `backend/src/api/auth/register.rs:177` usa-o para dispensar convite e atribuir `is_initial_operator` à primeira pessoa. Sem o filtro, uma conta de webhook anterior ao primeiro humano bloqueia o onboarding.

Nunca inserir a conta em `membership`. Os 11 pontos que listam membros dependem de `db::membership::list_by_server` (`channel_roles.rs`, `messages.rs` duas vezes, `mod.rs:359`, `channels.rs`, `roles.rs`, `ws/mod.rs`). Assim ela fica estruturalmente ausente de presença, @menção, convites e broadcast WS de membros, sem filtros nesses pontos. Publicar via `message.new` para espectadores autorizados, sem dar à conta permissões de membro.

Adicionar `kind=webhook` e snapshot de nome e avatar à mensagem no envio. Renomear ou mudar avatar não reescreve a identidade histórica; este é o motivo para preferir snapshot ao perfil ao vivo. Reter recurso de avatar local versionado/imutável ou usar fallback local estável. `MessageRow.tsx:134` lê `props.people.get(props.message.senderId ?? "")`, mapa de membros que não contém a conta do webhook. Para `kind=webhook`, API/WS e frontend devem fornecer e usar o snapshot como segunda fonte de identidade, também no histórico e nas citações; não é preciso endpoint de perfil público.

«Apagar» significa preencher `channel_webhook.revoked_at` e invalidar o token. Cada POST verifica estado activo. Nunca apagar a conta ou as mensagens anteriores: com `foreign_keys(true)`, `DELETE FROM account` falharia enquanto `message.sender_account_id` a referir. A revogação evita isso por construção. `message.sender_account_id` mantém a FK existente e a tabela `message` não é reconstruída. Rodar o token substitui o hash e invalida a URL antiga.

### D4: Cifra e limites

Todos os canais nascem com `e2ee_enabled=true` em `channel_provision.rs`. Exigir consentimento explícito na criação: conteúdo do webhook é recebido e guardado em claro como `kind=webhook`, visivelmente marcado; mensagens humanas continuam cifradas. A UI explica isto ao gestor e aos leitores. Rate limit por webhook e origem, limite de corpo, resposta 429 com `Retry-After`; verificar `revoked_at` em cada POST. Não incluir tokens em logs, eventos ou listagem. Revogação corta novos envios, preservando o histórico.

## Risks / Trade-offs

- URL vazada permite publicar até revogação; rotação e limites reduzem o dano.
- Conteúdo externo não tem sigilo ponta a ponta; consentimento e distinção visual são necessários.
- Avatar remoto pode rastrear leitores; armazenar/proxyar imagem validada ou usar avatar local padrão. Snapshots exigem retenção do recurso ou fallback estável.
- Se `account::count` incluir contas de webhook, `backend/src/api/mod.rs:253` falha em `initial_setup` e `backend/src/api/auth/register.rs:177` falha na primeira inscrição sem convite/`is_initial_operator`; filtrar `is_system_account = 0`.
- Revogação preserva conta e mensagens devido à FK activa; a linha de webhook permanece para garantir unicidade por canal.

## Open Questions

- Definir o texto exacto do aviso de consentimento e do indicador de conteúdo de integração em claro.
