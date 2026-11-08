# Implementação frontend — channel-webhooks

Secção 2.1–2.3 implementada na árvore actual, branch `main`, sem commit. Secção 3 permanece por marcar. O backend não foi alterado nesta ronda.

## Ficheiros

- `frontend/src/api/types.ts`: `Channel.has_active_webhook`, snapshots de nome/avatar em `Message`, `ChannelWebhook` e `ChannelWebhookSecret` conforme os structs e respostas Rust.
- `frontend/src/api/endpoints/channels.ts`: cliente `webhooks` para leitura, criação/reactivação, nome, rotação, avatar raw e revogação. `endpoints/index.ts` já reexporta todo `channels.ts`.
- `frontend/src/admin/ChannelSettingsDialog.tsx`: tab Webhook apenas para canais de texto; repassa alterações do canal ao shell.
- `frontend/src/admin/channel/WebhookPanel.tsx`: leitura do estado; activação/reactivação com checkbox de consentimento; nome opcional; URL e token mostrados uma vez; cópia; gestão de nome/avatar; rotação; revogação com segunda confirmação e aviso de preservação do histórico; tratamento de conflito 409 com releitura do estado.
- `frontend/src/chat/ChannelPage.tsx`: badge de integração em claro para leitores e nome de webhook nas respostas.
- `frontend/src/chat/logic/timeline.ts` e `frontend/src/chat/thread.ts`: propagação do tipo webhook e snapshots no histórico e no evento `message.new`. O texto em claro já é lido de `content_plaintext` quando `content_ciphertext` está vazio. O agrupamento por `senderId` continua adequado à conta dedicada.
- `frontend/src/chat/MessageRow.tsx`: nome e avatar do snapshot sem consultar membros, selo de integração e nome do snapshot nas citações.
- `frontend/src/chat/SearchPanel.tsx`: nome, avatar e selo de integração nos resultados históricos.
- `frontend/src/components/ui/icon-map.ts`: alias `webhook` para `Bot`, confirmado como exportação da versão instalada de `lucide-solid`. O aviso do cabeçalho usa o alias existente `warning`.
- `frontend/src/i18n/catalogs/mgmt.en.ts` e `mgmt.pt-BR.ts`: tab, estado, consentimento, segredo, cópia, nome, avatar, rotação e revogação.
- `frontend/src/i18n/catalogs/chat.en.ts` e `chat.pt-BR.ts`: indicador de canal e selo de mensagem.
- `frontend/src/voice/callSession.tsx`: `has_active_webhook: false` no único canal sintético construído localmente; outras alterações já presentes neste ficheiro foram preservadas.
- `frontend/scripts/verify-entry-screens.mjs`: o guardião de ficheiros de UI permite apenas a adição de alias em `icon-map.ts`, mantendo a protecção dos restantes ficheiros.
- `openspec/changes/channel-webhooks/tasks.md`: 2.1–2.3 marcadas; 3.1–3.2 intactas.

## Chaves i18n

- `mgmt.channel.tabWebhook`
- `mgmt.channel.webhook.{loading,active,revoked,intro,cleartextNotice,consent,nameOptional,name,activate,reactivate,once,onceHint,url,token,done,rename,hasAvatar,noAvatar,avatar,photoType,photoSize,rotate,revokeHint,revoke,confirmRevoke}`
- `txt.header.webhookActive`, `txt.row.webhookBadge`

## Verificações

- `npx tsc --noEmit`: passou.
- `npx eslint src`: passou (0 erros, 1 aviso preexistente de `consistent-type-imports` em `voice/callSession.tsx:47`).
- `npm run verify:i18n-keys`: passou (918 chaves usadas; catálogos en e pt-BR com 1334 cada).
- `npm run verify:entry-screens`: passou (18 casos).
- `npm run build`: passou (Vite 2388 módulos); aviso informativo de chunks acima de 500 kB.
- `git diff --check`: passou.
- Não há testes `*.test.ts(x)` de `AccessPanel` ou `MutePanel` a seguir para o novo painel. Os quatro contratos backend de `channel_webhooks.rs` já existentes cobrem segredo, identidade/histórico, rate limit, avatar, revogação e reactivação; esta ronda não alterou esses testes. A verificação backend completa e a revisão dupla foram fornecidas como pré-condição desta tarefa.

## Verificação visual pendente

Em sessão com display, confirmar a tab e o consentimento, o badge do canal, o selo/avatar de uma mensagem e o fluxo criar → copiar → publicar por `curl` → ver mensagem em tempo real → rodar/revogar/reactivar.
