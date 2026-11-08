# Tasks

## 1. Correções de markup em `WebhookPanel.tsx`

- [x] 1.1 Envolver cada bloco lógico (segredo mostrado uma vez, webhook ativo, criar/reativar) em `<section class="mg-card compact">` com `<h3 class="mg-card-title">` no topo, igual ao padrão de `AccessPanel.tsx`/`MutePanel.tsx`/`InspectPanel.tsx`; verificar visualmente que cada bloco aparece como um cartão com borda e espaçamento consistentes com os outros painéis da `ChannelSettingsDialog`.
- [x] 1.2 Trocar o `<label>{t(...)}</label><input readOnly .../>` da URL e do token (bloco "mostrado uma vez") pela faixa `.mg-block` + `.mg-key-row` já usada em `InviteDialog.tsx` (`<span class="mg-label">` + `<div class="mg-key-row">` com `<code>` e o botão de copiar dentro); verificar que o botão de copiar fica ao lado do endereço, sem sobreposição, e que `createCopy`/`copy()` continuam a funcionar (texto "Copiado"/ícone de confirmação).
- [x] 1.3 Trocar os campos de texto (`<label>{...}<input .../></label>` do nome ao renomear/reativar e do nome opcional na criação) por `<label class="mg-field"><span class="mg-label">{...}</span><input .../></label>`, igual a `AccessPanel.tsx`; verificar visualmente que os inputs têm o padding, borda e estado de foco do resto da app.
- [x] 1.4 Trocar o `<input type="file">` cru de troca de avatar pelo padrão de `pages/Account.tsx` (botão visível com `<input type="file" class="sr-only">` escondido, acionado por um `<label>`/`<Button>` clicável), mantendo a mesma validação de tipo (`PROFILE_IMAGE_MEDIA_TYPES`) e tamanho (`MAX_IMAGE_BYTES`) já implementada em `pickPhoto`; verificar que o seletor de arquivo visualmente é um botão, não o controlo nativo do navegador.
- [x] 1.5 Trocar os `<p>` crus de aviso/erro (`onceHint`, `revokeHint`, mensagem de `error()`) por `<p class="mg-note">`/`<p class="mg-error" role="alert">`, igual a `AccessPanel.tsx`; verificar que o texto de erro usa a cor de erro do tema e que os avisos ficam visualmente consistentes com o resto do painel.
- [x] 1.6 Confirmar por leitura que nenhuma classe nova foi criada em `frontend/src/mgmt.css` — só reaproveitar as já existentes (`mg-card`, `mg-card-title`, `mg-field`, `mg-label`, `mg-block`, `mg-key-row`, `mg-note`, `mg-error`, `mg-panel-foot`, `sr-only`) — e que nenhum texto i18n, rota de API ou comportamento (ordem dos estados, validações, confirmação de revogação em dois passos) mudou.

## 2. Verificação

- [x] 2.1 Correr `npx tsc --noEmit`, `npx eslint src`, `npm run verify:i18n-keys`, `npm run verify:entry-screens` e `npm run build` em `frontend/`; confirmar que todos passam sem novo erro/aviso.
- [x] 2.2 Verificar manualmente no painel de gestão do canal (aba Webhook): criar/ativar com consentimento mostra a URL e o token numa faixa alinhada, copiar funciona; o nome e o seletor de avatar aparecem com o estilo padrão da app; revogar e reativar continuam a funcionar visualmente como antes, só com o layout corrigido.

## 3. Revisão

- [x] 3.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 3.2 `openspec validate fix-webhook-panel-layout --strict`.
