# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/desktop/self-update` e `specs/desktop/updates`.

Estado atual relevante:

- `frontend/electron/main.ts` tem `checkForUpdate()`, que consulta a API REST do GitHub (`releases/latest`), compara versões com `isNewerVersion` e envia `mesa:update-available` à janela; um `setInterval` de 6 h o repete. `preload.ts` expõe `availableUpdate()`/`onUpdateAvailable()`; `AppShell.tsx` desenha uma faixa fixa abaixo da `Topbar`.
- `electron-builder.yml` não tem bloco `publish`, e `files` contém `"!node_modules"`. O electron-builder lê `frontend/package.json` (`--projectDir ..`), onde `electron` e `electron-builder` são `devDependencies` e as bibliotecas de UI são empacotadas pelo Vite.
- O workflow `desktop-release.yml` empacota com `--publish never`, sobe os artefatos de cada SO, calcula `SHA256SUMS` sobre exatamente seis instaladores e cria a release em rascunho. Hoje aceita qualquer tag `v*` cuja versão coincida com `frontend/electron/package.json`.
- Os instaladores não são assinados (Windows, macOS). O `electron-updater` não instala no macOS sem assinatura, e o `.msi`/`.deb`/`.rpm` não têm canal de atualização próprio.

## Goals / Non-Goals

**Goals:**
- Isolar a decisão de modo e a comparação de versões em um módulo puro (`updateMode.ts`), testável em Node sem Electron.
- Manter um único contrato renderer↔main para os dois modos: o toast não precisa saber como a atualização é obtida.
- Falhar sempre para o modo aviso, nunca para um estado silencioso nem para uma instalação parcial.

**Non-Goals:**
- Nenhuma lógica de atualização no renderer além de apresentar o estado e pedir o reinício.
- Nenhuma tentativa de detectar o formato com heurísticas sofisticadas: na dúvida, aviso.

## Decisions

### D1. `electron-updater` no modo automático; sem implementação própria de download
Usar `autoUpdater` do `electron-updater` com `autoDownload = true`, `autoInstallOnAppQuit = true`, `allowPrerelease = false`, `allowDowngrade = false`. Ele já faz a conferência do SHA-512 contra o `latest*.yml`, a atualização diferencial por `.blockmap` e a instalação ao sair.
*Alternativa descartada:* baixar o instalador com `net.fetch` e conferir o `SHA256SUMS` à mão. Reimplementaria diferencial, retomada e instalação por plataforma, e o `SHA256SUMS` fica fora do feed.
O `main.ts` é compilado como ESM (`module: Node16`, `"type": "module"`) e o `electron-updater` é CommonJS; por isso o import é `import updater from "electron-updater"; const { autoUpdater } = updater;`, pois o import nomeado compila no `tsc` mas falha só no app empacotado. Para poder depurar no Windows sem terminal, `autoUpdater.logger` grava em um arquivo dentro de `app.getPath("logs")`.

Fluxo (texto): abertura → `did-finish-load` → `resolveUpdateMode` → `off` (nada) | `notify` (consulta `releases/latest`) | `auto` (`checkForUpdates`) → estado `notify`/`ready` → toast → «Reiniciar agora» (`quitAndInstall`) ou instalação ao fechar; qualquer falha no `auto` volta a `notify`.

### D2. Detecção do modo em `updateMode.ts` (função pura)
`resolveUpdateMode({ platform, isPackaged, env, execPath, fileExists, isWritable })` devolve `"auto" | "notify" | "off"`:
- `!isPackaged` → `off`.
- `win32` → `auto` somente se existir o desinstalador do NSIS (`Uninstall Parley.exe`) ao lado de `process.execPath`; caso contrário (`.msi` ou ausente) → `notify`.
- `linux` → `auto` somente se `env.APPIMAGE` for um caminho absoluto e o **diretório** do arquivo (`dirname(APPIMAGE)`) for gravável (`fs.access(W_OK)`); caso contrário → `notify`. A checagem é do diretório, não do arquivo: o `AppImageUpdater` do `electron-updater` faz `unlink` do AppImage e `mv -f` do novo arquivo para dentro do diretório, de modo que um arquivo gravável numa pasta somente leitura falharia ao instalar.
- `darwin` e demais → `notify`.
*Por quê o desinstalador:* é um marcador gravado pelo instalador NSIS e ausente no MSI, sem depender de registro do Windows. Se o nome do produto mudar, o teste do módulo falha e o modo cai para `notify`, que é o lado seguro.

### D3. Modo aviso consulta o redirecionamento de `releases/latest`, não a API
`net.fetch("https://github.com/ricardopiloto/chat-app/releases/latest", { redirect: "manual" })`; o cabeçalho `Location` contém `.../releases/tag/vX.Y.Z`. Lê-se a tag, valida-se o host e o caminho, e compara-se com `app.getVersion()`. Rascunhos e pré-lançamentos não aparecem nesse redirecionamento. Remove o limite de 60 pedidos/hora/IP e o `setInterval`.
*Alternativa descartada:* manter a API REST uma vez por abertura. Funcionaria, mas mantém dois caminhos de rede com formatos diferentes; o redirecionamento é mais simples e já cobre rascunho/pré-lançamento.

`parseReleaseTag(location, origin = "https://github.com")` resolve o `Location` (absoluto ou relativo) contra `origin`, exige que a origem do resultado coincida com `origin` e que o caminho seja exatamente `/ricardopiloto/chat-app/releases/tag/vX.Y.Z` (três partes, sem sufixo, consulta nem fragmento). Em produção a origem é sempre `https://github.com`; com `PARLEY_UPDATE_FEED_URL` (aceita apenas loopback, D7) a origem é a do feed local, o que permite testar o modo aviso contra um redirecionamento em `127.0.0.1` sem afrouxar a regra de produção.

### D4. Estado único `UpdateState` entre main e renderer
Um tipo discriminado: `{ kind: "notify", version, url } | { kind: "ready", version, url }`. O main guarda o último estado e o reenvia em `mesa:update-state` (substitui `mesa:update-available`); `availableUpdate()` passa a devolver esse estado para janelas que abrem depois. Falha de download ou de digest (`autoUpdater` evento `error`) converte o estado em `notify` com o link da release. Estados intermediários (verificando, baixando) não vão ao renderer: o spec só exige o toast ao final.

### D5. Reinício: confirmação no renderer, execução no main
A janela principal sabe se há chamada (`CallProvider`); o main não. O toast chama `mesaNative.restartForUpdate()` (IPC `mesa:update-restart`) **depois** de confirmar com a pessoa quando há chamada ativa. O main só aceita o comando se o estado atual for `ready`, fecha janelas de popout e chama `autoUpdater.quitAndInstall(false, true)`; o comando é idempotente (uma segunda chamada é ignorada). Sem clique, `autoInstallOnAppQuit` instala ao fechar; o app nunca chama `quitAndInstall` por conta própria. «Chamada em andamento» é a sessão conectada de `callSession`, não a sala de espera.
*Alternativa descartada:* confirmar num diálogo nativo do main (`dialog.showMessageBox`). O main não sabe se há chamada e o diálogo fugiria do idioma e do estilo do app.

### D6. Toast como filho do `CallProvider`
Componente `UpdateToast` novo, renderizado em `AppShell.tsx` dentro do `CallProvider`, substituindo a faixa. Não existe toast persistente com ações: `lib/toast.ts` só oferece `flash` temporizado, então o componente tem estilo, foco e teclado próprios (`role="status"`, botões alcançáveis por teclado). Usa `useCall()` para saber se há chamada. Se a pessoa dispensou um aviso e depois o estado muda para `ready`, o toast reaparece. Textos nos catálogos `pt-BR` e `en`; reaproveita `shell.updateAvailable`/`shell.updateManually` e acrescenta `shell.updateReady`, `shell.updateRestartNow`, `shell.updateLater`, `shell.updateRestartInCall`. «Depois» e dispensar apenas escondem o toast na sessão atual.

### D7. Feed fixo; exceção de teste restrita a loopback
Em produção, `autoUpdater.setFeedURL` não é chamado: vale o bloco `publish` embutido (`provider: github`, `owner: ricardopiloto`, `repo: chat-app`, `releaseType: release`). A variável `PARLEY_UPDATE_FEED_URL` só é lida se o `URL` resultante for `http(s)` com host `127.0.0.1` ou `localhost`; qualquer outro valor é ignorado com um aviso no log. O mesmo filtro vale para o modo aviso. A função de validação está em `updateMode.ts` e é coberta por teste. A variável fica ativa também no app empacotado porque a verificação ponta a ponta (tarefa 5.3) usa o app empacotado; o risco residual exige acesso local à máquina e a restrição a loopback o limita.
*Alternativa descartada:* honrá-la só com `!app.isPackaged`. Reduziria a superfície, mas impediria testar o caminho real do app empacotado.

### D9. AppImage mantém o caminho instalado pelo script
O `install-mesa.sh` grava o AppImage como `~/.local/bin/parley-chat-app.AppImage` (sem versão) e usa esse caminho no `Exec=` do `.desktop`. No `AppImageUpdater` do `electron-updater` (6.8.11, `doInstall`), quando o nome do arquivo em execução não contém uma versão `N.N.N`, o arquivo novo sobrescreve o existente no mesmo caminho; só se o nome local tem versão o arquivo é renomeado para o nome do release. Logo, a atualização não quebra o atalho, **desde que o script continue gravando o AppImage sem versão no nome local**. Isso vira restrição verificada (tarefa 4.4).
*Alternativas descartadas:* AppImage sem versão no release (muda a convenção dos nomes e os filtros dos scripts); app reescrevendo o `.desktop` após atualizar (complexidade sem necessidade).

### D8. Empacotamento e release
- `electron-builder.yml`: `publish: [{ provider: github, owner: ricardopiloto, repo: chat-app, releaseType: release }]`. Os alvos continuam os mesmos; com `--publish never` o electron-builder ainda embute `app-update.yml` e gera `latest.yml`, `latest-linux.yml` e `.blockmap`. `electron-updater` entra em `dependencies` de `frontend/package.json`; como `files` exclui `node_modules`, o ajuste é remover `"!node_modules"` ou incluir `node_modules/electron-updater/**` e suas dependências, confirmado inspecionando o `app.asar` gerado.
- `desktop-release.yml`: cada job de plataforma sobe também `latest*.yml` e `*.blockmap`; o job `release` mantém a contagem de seis instaladores (o `find` já filtra por extensão) e o `SHA256SUMS` só sobre eles; a validação da tag passa a exigir `^v[0-9]+\.[0-9]+\.[0-9]+$` antes de qualquer empacotamento.
- macOS não gera `latest-mac.yml` útil (sem `zip`/assinatura); como o modo é aviso, ele não é publicado e não é pedido.

### D10. Restrições por plataforma (referência)
- **Windows.** NSIS é instalado por usuário (`oneClick`, sem `perMachine`), então a atualização silenciosa não pede elevação; o `.msi` não tem canal de atualização e só avisa. Os instaladores não são assinados: o `electron-updater` não confere editor, e o download feito pelo Node não carrega a marca de «baixado da internet», mas o SmartScreen e antivírus ainda podem alertar na primeira instalação manual.
- **macOS.** O `electron-updater` só instala no macOS com o app **assinado e notarizado**, e usa o alvo `zip` e `latest-mac.yml`, que não existem aqui (só `dmg`). Por isso o macOS fica sempre em **modo aviso**, que depende apenas de `releases/latest`. Se um dia houver assinatura, muda-se `resolveUpdateMode` (darwin → automático), o alvo do builder e o workflow.
- **Linux.** Só o AppImage atualiza sozinho, e somente com `APPIMAGE` definido e o **diretório** do arquivo gravável; `.deb` e `.rpm` são do gerenciador de pacotes e só avisam. O AppImage em execução é substituído por `unlink` e `mv`, o que o Linux permite. O AppImage exige FUSE 2 em várias distribuições (por exemplo, Fedora e Ubuntu recentes), um requisito do formato e não do atualizador; vai para a documentação, com `--appimage-extract-and-run` como contorno.
- Como o macOS, o `.msi`, o `.deb`, o `.rpm` e o AppImage não gravável dependem **só do modo aviso**, ele é o caminho mais exposto: o `Location` do redirecionamento de `releases/latest` precisa ser legível pelo `net.fetch` do Electron (ver tarefa 2.2).

## Risks / Trade-offs

- [Sem assinatura, o SmartScreen pode avisar na instalação feita pelo atualizador] → documentar; a confiança está em HTTPS + digest do feed + controle do repositório (já descrito no spec).
- [Quem controla o repositório ou o token de release executa código em todos os clientes, pois o digest vem da mesma release] → risco assumido; documentar e restringir quem pode publicar releases.
- [AppImage baixado à mão e mantido com nome versionado é renomeado pelo atualizador] → fora do escopo do atalho do script (D9); documentado.
- [Marcador `Uninstall Parley.exe` muda e o modo cai silenciosamente para aviso] → teste em `verify:updates` fixa o nome esperado a partir do `productName` do `electron-builder.yml`.
- [`electron-updater` ausente do `app.asar` por causa de `files`] → verificação obrigatória na tarefa de empacotamento (listar o asar), porque o erro só apareceria em runtime no app empacotado.
- [Rascunho nunca visível e publicação esquecida] → comportamento intencional; documentado no fluxo de release.
- [Quem está na 1.5.0 não tem o atualizador] → instala a primeira versão com self-update à mão (a faixa atual já avisa); previsto no rollout.
- [Atualização do NSIS durante uma chamada em popout] → `restartForUpdate` fecha o popout junto; a confirmação cobre a chamada principal, que é a mesma sessão.

## Migration Plan

1. Implementar e verificar localmente com feed em loopback (ver tarefas).
2. Subir a versão para ≥1.5.1 nos três manifestos (`frontend/package.json`, `frontend/electron/package.json`, lockfiles) e criar a tag `vX.Y.Z`.
3. O workflow gera o rascunho com instaladores + feed; publicar a ≥1.5.1 e instalá-la à mão em um Windows (NSIS) e em um Linux (AppImage).
4. **Prova em campo:** a atualização real é provada pela release **seguinte**, prevista para ser a da `parley-server-standalone` (≥1.6.0): quem está na ≥1.5.1 deve recebê-la pelo toast «A versão X está pronta». Isso dispensa uma release de teste descartável; a verificação local com feed em loopback (tarefa 5.3) continua sendo a prova antes de publicar. Se for preciso provar antes da próxima release, publica-se uma 1.5.2 de teste, como no plano original. Se a atualização automática falhar, o modo aviso mostra o link da release.
5. Rollback: despublicar a release (voltar a rascunho) faz o feed deixar de oferecer a versão; quem já atualizou segue na nova. O modo aviso permanece como fallback.
