# Proposal

## Why

No painel de gestão de webhook (`frontend/src/admin/channel/WebhookPanel.tsx:104`), o estado do avatar só mostra texto ("Avatar definido"/"Sem avatar"), nunca a imagem em si. Quem gere o canal não consegue ver qual avatar está realmente configurado antes de decidir trocá-lo.

## What Changes

- Mostrar o avatar real do webhook (componente `Avatar` já usado em `MessageRow.tsx`, com `avatarUrl(webhook().account_id)` envolvido em `useAuthedSrc` — o mesmo padrão já usado em todo o projecto para avatares de conta) ao lado do botão "Trocar avatar", em vez do texto "tem/não tem avatar" isolado.
- `Avatar` já tem fallback próprio (mostra a inicial do nome quando não há `src`), por isso não é preciso nenhuma lógica condicional nova de UI além de só pedir a imagem quando `has_avatar` é verdadeiro.
- Puramente markup e reuso de dados já disponíveis (`ChannelWebhook.account_id`/`has_avatar` já existem) — nenhuma rota, API, i18n ou comportamento muda.

## Capabilities

Sem mudança de comportamento a nível de especificação — a capability `frontend-v2/channel-webhooks` já exige poder "alterar nome/avatar"; isto só completa a fidelidade visual de ver o estado actual, não muda nenhum requisito. `skip_specs: true` em `.openspec.yaml`.

## Impact

- `frontend/src/admin/channel/WebhookPanel.tsx` (único ficheiro a mudar).
