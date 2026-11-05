# Review — Desenvolvedor Fullstack

**Change:** desktop-self-update
**Data:** 2026-11-05
**Veredito geral:** Aprovado com ressalvas

Contexto lido: `frontend/electron/{main,preload}.ts`, `frontend/electron/tsconfig.json`, `frontend/package.json`, `frontend/electron-builder.yml`, `frontend/src/shell/AppShell.tsx`, `frontend/src/lib/toast.ts`, `frontend/src/voice/callSession.tsx`, `.github/workflows/desktop-release.yml`, `scripts/install-mesa.sh`. O projeto só tem CI para o release (sem CI de testes); os `verify:*` rodam localmente.

## 1. Desenvolvimento do backend
Veredito: N/A
- A change não toca backend, banco nem contratos de API (`proposal.md` – Impact). Sem achados.

## 2. Desenvolvimento do frontend
Veredito: Atenção
- O toast «persistente com ações» não existe: `src/lib/toast.ts` só oferece `createToast(lifetimeMs).flash(text)` com temporizador e sem botões. `UpdateToast` (tarefa 3.1) é componente novo, com estilo, foco e acessibilidade próprios (`role="status"`, botões alcançáveis por teclado). — dimensionar a tarefa 3.1 como componente novo, não reaproveitamento, e acrescentar ao verificável o uso por teclado.
- Estado do toast no renderer: «Depois»/dispensar só escondem na sessão; precisa de um sinal local. Quando o estado muda de `notify` para `ready` depois de dispensado (download termina depois), o toast deve reaparecer. Falta cenário explícito. — acrescentar na 3.1.
- Confirmação de reinício durante chamada (3.2): `useCall()` vem de `voice/callSession.tsx`, que já é provedor em `AppShell.tsx`. O toast fica dentro de `CallProvider` conforme o design; a janela de popout é um renderer separado e não monta o toast, o que é correto. Definir qual sinal indica «chamada em andamento» (conectada vs. só na sala de espera/GreenRoom) para não pedir confirmação à toa. — fixar na tarefa 3.2.
- Textos: as chaves novas entram nos dois catálogos e passam por `verify:i18n-keys` (3.3). OK.

## 3. Deploy e operação
Veredito: Atenção
- **tsconfig do Electron lista arquivos**: `electron/tsconfig.json` tem `"include": ["main.ts", "preload.ts", "legacy-cleanup.ts"]`. O novo `updateMode.ts` precisa entrar ali, senão não é compilado para `electron/dist` e o app empacotado falha ao importá-lo. Nenhuma tarefa menciona isso. — acrescentar à tarefa 1.2 (verificar que `electron/dist/updateMode.js` existe).
- `files` de `electron-builder.yml` exclui `node_modules`; a tarefa 4.1 já cobre listar o asar. Conferir também que o `electron-updater` e suas dependências transitivas (`builder-util-runtime`, `semver`, `lazy-val`, etc.) entraram, e que `frontend/package.json` ter só `electron-updater` em `dependencies` é suficiente para o electron-builder copiar a árvore. OK com a verificação já prevista.
- O build é Node16/ESM (`electron/package.json` com `"type": "module"`) e o `electron-updater` é CommonJS: `import { autoUpdater } from "electron-updater"` costuma falhar em runtime (named export inexistente). O padrão seguro é `import updater from "electron-updater"; const { autoUpdater } = updater;`. O `tsc` pode não acusar isso; só o app empacotado acusa. — acrescentar à 2.3 uma verificação de arranque do app empacotado, e usar o import por default.
- Observabilidade: o plano só prevê `console.warn`. Para depurar em produção (Windows sem terminal), definir `autoUpdater.logger` para um arquivo em `app.getPath("logs")`, que o `electron-updater` já sabe escrever. — acrescentar à 2.3 e citar o caminho em `docs/desktop-release.md`.
- Workflow: a regex de tag e os globs de upload são pequenos. `actionlint` pode não estar instalado; a tarefa 4.3 aceita «revisão» como alternativa, o que é fraco. Preferir validar com um `workflow_dispatch` que produza os artefatos e conferir os nomes `latest.yml`/`latest-linux.yml`/`.blockmap` nos artefatos de cada job.
- Nenhuma porta, serviço ou variável de produção nova. A única variável (`PARLEY_UPDATE_FEED_URL`) é de teste e precisa constar em `docs/desktop-release.md`.

## 4. Qualidade de código
Veredito: Atenção
- Os testes do `verify:updates` importam código TypeScript. Os scripts existentes usam `node --experimental-strip-types` (ex.: `verify:legacy-cleanup`), o que exige especificadores com extensão `.ts`, mas `main.ts` importa `./legacy-cleanup.js` (regra do Node16). Verificar como `legacy-cleanup.test.mjs` resolve isso e copiar o padrão para `updateMode.ts`. — mencionar na 1.3.
- Resiliência: o plano cobre rede, digest e fallback para aviso. Falta tratar: (a) `checkForUpdates()` lançando antes do evento `error`; (b) evento `update-downloaded` repetido; (c) `restartForUpdate` chamado duas vezes; (d) `quitAndInstall` com a janela de popout aberta e `window-all-closed`/`before-quit` já registrados. — listar como casos nas tarefas 2.3 e 2.5.
- Os cenários do spec «Release em rascunho» e «Falha de rede» só se verificam com feed local; a tarefa 2.3 cobre digest adulterado, mas não explicita o cenário «feed com versão igual ou menor». — acrescentar.
- Tarefa 4.2 só prova o Linux; o Windows (NSIS) só será provado na release real. Aceitável, mas fazer um release de teste (≥1.5.1 → 1.5.2) antes de anunciar, como o `design.md` já prevê.

## 5. Execução das decisões arquiteturais
Veredito: Bloqueante
- **O atalho do AppImage criado por `scripts/install-mesa.sh` quebra após a primeira atualização.** O script grava o arquivo como `~/.local/bin/parley-chat-app.AppImage` e usa esse caminho no `Exec=` do `.desktop`. O artefato do release tem nome com versão (`parley-chat-app-<versão>-<arch>.AppImage`); pelo comportamento do `AppImageUpdater`, a atualização grava o arquivo com o nome novo e remove o antigo. Confirmar com um protótipo local (AppImage 1.5.1 → feed local 1.5.2) antes de implementar o resto. Nenhuma tarefa cobre isso. — reportado ao Arquiteto (abaixo).
- O restante segue as decisões do `design.md` sem reabrir nenhuma.

## Bloqueantes antes de implementar
- O comportamento de renomeação do AppImage e o atalho do `install-mesa.sh` precisam de decisão (ver acima e `review-architect.md`) e de uma tarefa de verificação em Linux real.

## Limitações técnicas a reportar ao Arquiteto
- Renomeação do arquivo AppImage pelo atualizador vs. caminho fixo do `.desktop` criado pelo script de instalação.
- Import CommonJS do `electron-updater` em build ESM: não muda a arquitetura, mas pede o import por default.
- Ausência de toast persistente no frontend: D6 do `design.md` assume um mecanismo que não existe.
