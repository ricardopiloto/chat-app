# Tasks

## 1. Correção em `WebhookPanel.tsx`

- [x] 1.1 Importar `Avatar`, `avatarUrl` e `useAuthedSrc` (os dois últimos de `../../api`). Trocar `<p>{webhook()?.has_avatar ? t("mgmt.channel.webhook.hasAvatar") : t("mgmt.channel.webhook.noAvatar")}</p>` (linha ~104) por `<Avatar name={webhook()?.display_name ?? ""} src={avatarSrc()} />` colocado antes ou ao lado do botão "Trocar avatar" (`<label class="ui-button ...">`). Mantém o texto "Avatar definido"/"Sem avatar" como legenda pequena ao lado do `Avatar` (não remove a informação textual, só acrescenta a imagem) — decide o arranjo visual mais simples que caiba na faixa do painel, sem nova classe CSS.
- [x] 1.2 Usa exactamente o padrão já existente em `frontend/src/pages/Account.tsx:53-54` para evitar que o browser mostre a imagem antiga depois de trocar o avatar (o `account_id` não muda ao trocar, só o ficheiro no servidor — a URL sozinha não muda, por isso a tag `<img>` não re-busca sem um cache-bust): cria `const [revision, setRevision] = createSignal(0)`, `const avatarSrc = useAuthedSrc(() => webhook()?.has_avatar ? \`${avatarUrl(webhook()!.account_id)}?v=${revision()}\` : undefined)`, e incrementa `revision` (`setRevision((n) => n + 1)`) dentro de `pickPhoto` depois de `mutate(await webhooks.uploadAvatar(...))` ter sucesso.

## 2. Verificação

- [x] 2.1 Correr `npx tsc --noEmit`, `npx eslint src`, `npm run build` em `frontend/`; confirmar que passam.
- [x] 2.2 Verificar manualmente: abrir o painel de um webhook sem avatar (mostra só a inicial do nome, fallback do próprio `Avatar`), trocar o avatar e confirmar que a imagem nova aparece sem recarregar a página.

## 3. Revisão

- [x] 3.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 3.2 `openspec validate fix-webhook-panel-avatar-preview --strict`.
