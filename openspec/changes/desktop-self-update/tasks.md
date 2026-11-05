# Tasks

## 1. Lógica pura e dependência

- [ ] 1.1 Adicionar `electron-updater` às `dependencies` de `frontend/package.json` (e atualizar o lockfile) e verificar que `npm ci` e `npm run build` passam
- [ ] 1.2 Criar `frontend/electron/updateMode.ts` com `resolveUpdateMode`, `isNewerVersion`, `parseReleaseTag` (extrai e valida a tag do `Location` de `releases/latest`) e `isLoopbackFeedUrl`, sem importar `electron`; incluí-lo no `include` de `frontend/electron/tsconfig.json` e verificar que `npx tsc -p electron/tsconfig.json` gera `electron/dist/updateMode.js`
- [ ] 1.3 Criar `frontend/scripts/verify-updates.mjs` (importando o TypeScript pelo mesmo padrão de `legacy-cleanup.test.mjs`) e o script `npm run verify:updates` cobrindo: NSIS/MSI, AppImage gravável/não gravável, deb/rpm, macOS, não empacotado, tag válida/inválida/host estranho, `isNewerVersion` (igual, menor, maior) e feed loopback aceito/recusado; verificar que passa e falha se o marcador do desinstalador divergir do `productName` de `electron-builder.yml`

## 2. Processo principal e preload

- [ ] 2.1 Em `frontend/electron/main.ts`, substituir `checkForUpdate`, `UPDATE_INTERVAL_MS` e o `setInterval` por uma única verificação após `did-finish-load` da janela principal, escolhendo o modo com `resolveUpdateMode`; verificar que em modo `off` (não empacotado) nenhuma requisição é feita (log/teste manual com `electron:dev`)
- [ ] 2.2 Implementar o modo aviso: `net.fetch(.../releases/latest, { redirect: "manual" })`, validação com `parseReleaseTag`, estado `{ kind: "notify" }`; verificar com redirect local que versão maior produz o estado e versão igual, menor ou erro de rede não produz nada
- [ ] 2.3 Implementar o modo automático com `autoUpdater` importado por default (`import updater from "electron-updater"`), `autoDownload`, `autoInstallOnAppQuit`, sem pré-lançamento e sem downgrade, `autoUpdater.logger` gravando em `app.getPath("logs")`, evento `update-downloaded` → `{ kind: "ready" }` (ignorando repetições) e evento `error` ou exceção de `checkForUpdates()` → `{ kind: "notify" }` com o link da release; verificar contra um feed local em `127.0.0.1` (via `PARLEY_UPDATE_FEED_URL`) que o download conclui, que um digest adulterado cai no aviso sem instalar e que o app empacotado arranca sem erro de import
- [ ] 2.4 Aplicar a restrição de feed: ignorar `PARLEY_UPDATE_FEED_URL` que não seja loopback e nunca chamar `setFeedURL` em produção; verificar com `verify:updates` e testando manualmente um host externo
- [ ] 2.5 Substituir `mesa:update-available` por `mesa:update-state` e `mesa:available-update`, e adicionar `mesa:update-restart` (só aceito no estado `ready`, idempotente; fecha o popout e chama `quitAndInstall(false, true)`, também com o popout aberto); expor `onUpdateState`, `updateState` e `restartForUpdate` em `preload.ts` e tipar em `frontend/src/env.d.ts`; verificar `npx tsc -p electron/tsconfig.preload.json` e `npm run build`

## 3. Toast no frontend

- [ ] 3.1 Criar `UpdateToast` em `frontend/src/shell/` como componente novo (filho do `CallProvider`; `lib/toast.ts` não serve), com os estados «pronta» (Reiniciar agora / Depois) e «aviso» (link da release, dispensável), operável por teclado, reaparecendo se um aviso dispensado vira «pronta»; removê-lo da faixa em `AppShell.tsx`; verificar que a faixa antiga não existe mais e que o toast aparece com um estado simulado no navegador
- [ ] 3.2 Em «Reiniciar agora» com chamada conectada (não a sala de espera), pedir confirmação explicando que a chamada será encerrada; cancelar mantém chamada e toast; verificar manualmente com e sem chamada
- [ ] 3.3 Adicionar as chaves `shell.updateReady`, `shell.updateRestartNow`, `shell.updateLater`, `shell.updateRestartInCall` em `pt-BR.ts` e `en.ts` e verificar `npm run verify:i18n-keys` e `npm run verify:i18n`

## 4. Empacotamento e release

- [ ] 4.1 Adicionar o bloco `publish` (GitHub, `ricardopiloto/chat-app`, `releaseType: release`) a `frontend/electron-builder.yml` e ajustar `files` para que `electron-updater` e suas dependências entrem no `app.asar`; verificar listando o asar (`npx asar list`) e checando `resources/app-update.yml`
- [ ] 4.2 Gerar localmente o pacote Linux e verificar que `latest-linux.yml` e o `.blockmap` do AppImage são produzidos e que o AppImage empacotado inicia em modo automático ou aviso conforme o local do arquivo
- [ ] 4.3 Em `.github/workflows/desktop-release.yml`: exigir a tag `^v[0-9]+\.[0-9]+\.[0-9]+$` antes do empacotamento, subir `latest.yml`, `latest-linux.yml` e `*.blockmap` nos artefatos de cada SO (sem `latest-mac.yml`), manter a contagem de seis instaladores e o `SHA256SUMS` apenas sobre eles; verificar com um `workflow_dispatch` conferindo esses arquivos nos artefatos dos jobs, inclusive `latest.yml` do Windows
- [ ] 4.4 Garantir que `install-mesa.sh` continue gravando o AppImage como `parley-chat-app.AppImage` (sem versão no nome local, D9) e que `install-mesa.sh` e `install-mesa.ps1` sigam lendo o `SHA256SUMS`; verificar rodando o filtro de instaladores do workflow sobre uma pasta de exemplo e instalando um AppImage 1.5.1 que atualiza para um feed local 1.5.2 no mesmo caminho

## 5. Documentação e validação final

- [ ] 5.1 Atualizar `docs/desktop-release.md` (feed, `latest*.yml`, tag `vX.Y.Z`, rascunho vs. publicado, ausência de assinatura, formatos que não se atualizam, `PARLEY_UPDATE_FEED_URL`, caminho do log, AppImage com nome versionado), o `README.md`, o `CHANGELOG.md` e `docs/arquitetura-tecnica.md` se ele descrever o Electron; verificar que os passos documentados correspondem ao workflow
- [ ] 5.2 Rodar `openspec validate desktop-self-update --strict` e `npm run verify:updates`, `npm run verify:i18n-keys` e `npm run build` e confirmar que todos passam
- [ ] 5.3 Teste ponta a ponta de integração: com feed local em loopback, abrir o app empacotado, ver o toast «pronta», escolher «Depois», fechar e confirmar que a versão nova é instalada; repetir com «Reiniciar agora» e com chamada ativa
- [ ] 5.4 Preparar a primeira release com self-update (≥1.5.1) nos manifestos e anotar no CHANGELOG que quem está na 1.5.0 instala essa versão uma vez à mão
