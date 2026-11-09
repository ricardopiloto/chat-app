# Proposal

## Why

Hoje o aplicativo desktop só avisa, com uma faixa, que existe uma versão nova e manda a pessoa baixar e reinstalar à mão (`desktop/updates`). Isso exige que cada pessoa do grupo repita o download a cada release, e quem não repete fica em versões antigas que podem falhar contra uma instância mais nova. Queremos que o Windows (instalador `.exe`) e o Linux (AppImage) se atualizem sozinhos, e que as demais formas de instalação (macOS, `.deb`, `.rpm`, `.msi`), que não podem se atualizar sem assinatura ou sem permissão de administrador, mostrem pelo menos um aviso claro.

## What Changes

- **Self-update com `electron-updater`** no Windows (instalador NSIS) e no Linux AppImage: o app empacotado verifica a release publicada **somente ao abrir**, baixa a atualização em segundo plano e mostra um toast «A versão X está pronta» com «Reiniciar agora». Sem clique, a atualização é instalada **ao fechar o app**. O app nunca reinicia sozinho; se há uma chamada de voz ou vídeo em andamento, o botão pede confirmação antes de reiniciar.
- **Somente aviso** no macOS, Linux `.deb`/`.rpm` e Windows `.msi`: um toast persistente informa a versão nova com o link para a release (como a faixa de hoje). Nada é baixado nem instalado.
- **A verificação deixa de ser periódica**: o intervalo de 6 horas e a consulta à API do GitHub (limite de 60 pedidos por hora e por IP) saem. O aviso passa a vir do `electron-updater` (modo automático) ou do redirecionamento de `releases/latest` (modo aviso), uma vez por abertura. Sem interruptor de preferência.
- **Empacotamento e release**: `electron-builder.yml` ganha o bloco `publish` (GitHub) para embutir `app-update.yml` e gerar `latest.yml`, `latest-linux.yml` e os `.blockmap`; o workflow `desktop-release.yml` publica esses arquivos na mesma release, sem alterar a contagem de seis instaladores nem o `SHA256SUMS`; a tag passa a ter de ser `vX.Y.Z` (semver de três partes, exigido pelo `electron-updater`). A release continua nascendo em rascunho: o rascunho só vira atualização para os usuários quando for publicado.
- **Documentação**: `docs/desktop-release.md`, o README e o CHANGELOG passam a descrever o novo fluxo, os formatos que não se atualizam sozinhos e a ausência de assinatura.
- **Não entram**: assinatura de código (Authenticode, notarização), atualização de `.deb`/`.rpm`/`.msi`/DMG, verificação periódica, interruptor de atualização automática, atualização diferencial além do que o `electron-updater` faz sozinho com os `.blockmap`, canais beta/prerelease, e qualquer mudança em backend, banco ou contratos de API.

## Capabilities

### New Capabilities
- `desktop/self-update`: modo de atualização por plataforma e formato de pacote, verificação só na abertura, download em segundo plano, toast «pronta» com reinício seguro durante chamadas, instalação ao fechar, queda para o aviso em caso de falha, integridade e origem do feed, e arquivos do feed publicados na release.

### Modified Capabilities
- `desktop/updates`: o requisito «Aviso persistente de nova versão» deixa de consultar a cada seis horas e de proibir qualquer download automático (agora vale só para os modos de aviso); o requisito «Documentação de instalação e atualização» deixa de dizer que a atualização é manual em todos os formatos.

## Impact

- **Electron** (`frontend/electron`): `main.ts` (substitui `checkForUpdate` e o intervalo; novo estado de atualização e IPC `mesa:update-restart`), `preload.ts`, novo `updateMode.ts` (lógica pura e testável), `package.json` do frontend (dependência `electron-updater`).
- **Frontend** (`frontend/src`): `shell/AppShell.tsx` troca a faixa por um componente de toast filho do `CallProvider`; `env.d.ts`; catálogos `i18n/catalogs/{pt-BR,en}.ts`.
- **Empacotamento e release**: `frontend/electron-builder.yml` (bloco `publish`, ajuste do `files` que hoje exclui `node_modules`), `.github/workflows/desktop-release.yml`, `docs/desktop-release.md`, `README.md`, `CHANGELOG.md`.
- **Verificação**: novo `npm run verify:updates` (Node, lógica pura); verificação ponta a ponta com um feed local em `127.0.0.1` e, no Windows e no Linux, na primeira atualização real, que será a release seguinte à do atualizador (prevista: a da `parley-server-standalone`, ≥1.6.0).
- **Sem impacto** em backend, banco, contratos de API e nos scripts `install-mesa.sh`/`install-mesa.ps1` (que continuam lendo `SHA256SUMS` por nome de instalador).
- **Rollout**: a v1.5.0 já foi publicada sem o atualizador. A primeira versão com self-update é a próxima (≥1.5.1); quem está na 1.5.0 instala essa versão uma vez à mão (a faixa atual já os avisa) e só a partir daí se atualiza sozinho. A release seguinte, prevista para ser a da `parley-server-standalone` (≥1.6.0), é a prova em campo do atualizador.
