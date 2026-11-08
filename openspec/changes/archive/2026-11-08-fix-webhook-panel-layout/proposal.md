# Proposal

## Why

O painel de gestão de webhooks (`frontend/src/admin/channel/WebhookPanel.tsx`, implementado pela change já arquivada `channel-webhooks`) usa `<label>`/`<input>`/`<section>` crus em vez das classes do sistema de design já usadas pelos outros painéis de gestão de canal. Isso produz exatamente os sintomas relatados: a URL de publicação e o token aparecem desalinhados, o botão de copiar fica sobreposto ao campo de endereço, o campo de renomear a integração e o campo de nome opcional não têm o estilo de input do resto da app, e o seletor de avatar é um `<input type="file">` sem nenhum estilo.

## What Changes

- Envolver a URL de publicação e o token (mostrados uma única vez) na faixa de cópia padrão já usada por `InviteDialog.tsx` para o mesmo cenário («mostrar um segredo uma vez com botão de copiar»): `.mg-block` + `.mg-key-row` (`<code>` + botão), em vez de `<label>`/`<input readOnly>`/`<Button>` soltos.
- Envolver os campos de texto (nome ao reativar/renomear, nome opcional na criação) em `<label class="mg-field">` com `<span class="mg-label">`, igual a `AccessPanel.tsx`, para herdar o estilo de input de `frontend/src/mgmt.css`.
- Trocar o `<input type="file">` cru de troca de avatar pelo padrão já usado em `pages/Account.tsx` (botão visível que dispara um input de arquivo oculto via `sr-only`), mantendo a mesma validação de tipo/tamanho já implementada.
- Envolver cada bloco logico (estado "mostrar segredo uma vez", "webhook ativo", "criar/reativar") em `<section class="mg-card compact">` com `<h3 class="mg-card-title">`, e usar `<p class="mg-note">`/`<p class="mg-error">` em vez de `<p>` cru, igual ao resto de `AccessPanel.tsx`/`MutePanel.tsx`/`InspectPanel.tsx`.
- Puramente markup e classes CSS já existentes em `frontend/src/mgmt.css` — nenhuma rota, comportamento, texto i18n ou contrato de API muda. Nenhuma classe nova é criada.

## Capabilities

Sem mudança de comportamento observável a nível de especificação — é uma correção de fidelidade visual de implementação (o painel já fazia o que a spec de `frontend-v2/channel-webhooks` exige, só não seguia o sistema de design). `skip_specs: true` em `.openspec.yaml`.

## Impact

- `frontend/src/admin/channel/WebhookPanel.tsx` (único ficheiro de código a mudar).
- Nenhuma migração, rota, i18n ou dependência nova.
