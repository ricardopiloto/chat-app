# Proposal

## Why

`desktop-tauri-shell` entrega um crate Tauri que já compila e corre localmente (`cargo tauri build`), mas só nesta máquina de desenvolvimento (Linux). O pedido original do utilizador é explícito: um binário compatível com Windows, Mac e Linux, com Linux focado em AppImage, `.deb` e `.rpm`. Compilar para Windows e macOS com os plugins/webview nativos do Tauri exige, na prática, runners nativos dessas plataformas — não é viável cross-compilar de forma fiável a partir desta máquina Linux. O repositório já está hospedado em `github.com/ricardopiloto/chat-app` (confirmado via `git remote -v`) mas não tem qualquer `.github/workflows/` — esta change introduz a primeira esteira de CI do projecto, e só por essa necessidade concreta (não como ceremónia adicional).

## What Changes

- Workflow do GitHub Actions (`.github/workflows/desktop-release.yml`, nome indicativo) com matriz de três runners (`ubuntu-latest`, `windows-latest`, `macos-latest`), usando a acção oficial `tauri-apps/tauri-action` para compilar `frontend/src-tauri` em cada plataforma.
- No runner `ubuntu-latest`: instalar as dependências de sistema do Tauri (webkit2gtk, etc.) e `rpm`/`rpmbuild` (não vem por omissão no runner), e pedir explicitamente os três formatos Linux decididos pelo utilizador — `--bundles deb,rpm,appimage`.
- No runner `windows-latest`: instaladores `.msi` (WiX) e `.exe` (NSIS) — os dois formatos que o bundler do Tauri já produz por omissão, sem preferência expressa pelo utilizador por um dos dois.
- No runner `macos-latest`: `.app` e `.dmg` — formato por omissão do Tauri.
- Metadados de empacotamento em `tauri.conf.json`/`Cargo.toml` (descrição curta/longa, categoria, licença, identificador reverso `com.mesa.desktop` — corrigido de `com.mesa.app` durante a implementação, ver `design.md` Decisão 4) exigidos pelos bundlers `deb`/`rpm`, hoje ausentes.
- Novo ficheiro `LICENSE` na raiz do repositório (AGPL-3.0, decisão tomada com o utilizador) e o campo `license`/`license-file` correspondente em `backend/Cargo.toml`, `frontend/package.json` e `frontend/src-tauri/Cargo.toml` — hoje nenhum manifesto do repositório declara licença.
- Publicação dos artefactos (os binários/instaladores de cada runner) numa GitHub Release, accionada manualmente (`workflow_dispatch`) ou por tag de versão (`v*`) — não em cada push, para não gastar minutos de CI num projecto de lançamentos pouco frequentes e sem equipa de operação dedicada.
- **Fora de escopo explícito**: assinatura de código para Windows (Authenticode) e notarização para macOS (Apple Developer Program) — ambas exigem certificados pagos que o projecto não tem hoje; os binários ficam por assinar, com os avisos de SmartScreen/Gatekeeper que isso implica, documentados como limitação conhecida, não escondida. Auto-update, canal de pré-lançamento/beta, publicação em lojas (Microsoft Store, Homebrew, Flathub, AUR) — nenhum pedido pelo utilizador.

## Capabilities

### New Capabilities

- `desktop/packaging`: a esteira de CI que compila e empacota o shell Tauri (`desktop/shell`) para as três plataformas, nos formatos decididos (AppImage/deb/rpm no Linux, msi/nsis no Windows, dmg no macOS), e publica os artefactos numa release do GitHub.

### Modified Capabilities

(nenhuma)

## Impact

- **Novo** (`.github/workflows/`): primeiro workflow de CI do repositório.
- **Novo** (raiz do repositório): `LICENSE` (AGPL-3.0).
- **Modificado** (`backend/Cargo.toml`, `frontend/package.json`, `frontend/src-tauri/Cargo.toml`, `frontend/src-tauri/tauri.conf.json`): campos de licença/metadados de empacotamento antes ausentes.
- **Depende de** `desktop-tauri-shell` (o crate e os ícones já têm de existir) e, transitivamente, das duas changes anteriores.
- **Sem impacto**: comportamento em runtime da aplicação (esta change só empacota e distribui o que as três changes anteriores já produzem), `backend/` em termos de código (só o campo de licença no `Cargo.toml`).
