# Proposal

## Why

Esta change já tinha produzido artefactos reais (`.rpm`/`.AppImage`) a partir do shell Tauri — testados numa máquina Fedora real, revelaram um bug irrecuperável do WebKitGTK em câmara/microfone/colar imagem (ver `desktop-electron-shell/proposal.md` para o diagnóstico completo). Decidido com o utilizador: o shell passa a ser Electron. Esta change precisa de ser revista para empacotar `frontend/electron/` com `electron-builder` em vez de `frontend/src-tauri/` com `cargo tauri`/`tauri-action` — o pedido original do utilizador (binário para Windows/Mac/Linux, com AppImage/`.deb`/`.rpm` no Linux) não muda, só a ferramenta de empacotamento por baixo. O repositório continua sem `.github/workflows/` — esta continua a ser a primeira esteira de CI do projecto.

**O que se mantém desta change tal como já estava** (decisões tomadas antes da troca de shell, tecnologicamente neutras): licença AGPL-3.0, identificador `com.mesa.desktop`, convenção de sincronizar a versão em três manifestos antes de uma tag, disparo manual/por tag (não em cada push), publicação como GitHub Release em rascunho, e a decisão de não assinar/notarizar os binários nesta fase.

## What Changes

- Workflow do GitHub Actions (`.github/workflows/desktop-release.yml`) com matriz de três runners (`ubuntu-latest`, `windows-latest`, `macos-latest`), usando `electron-builder` (em vez de `tauri-apps/tauri-action`) para compilar `frontend/electron/` em cada plataforma.
- No runner `ubuntu-latest`: `electron-builder` com `--linux AppImage deb rpm` — os três formatos decididos pelo utilizador. **`rpm`/`rpmbuild` continua a ser preciso** no runner (confirmado: o alvo rpm do `electron-builder` também depende de `rpmbuild` instalado no sistema, igual ao bundler do Tauri — não é uma simplificação que a troca de shell traga).
- No runner `windows-latest`: `electron-builder` com `--win nsis msi`.
- No runner `macos-latest`: `electron-builder` com `--mac dmg`, **e** as chaves `NSCameraUsageDescription`/`NSMicrophoneUsageDescription` no `Info.plist` (via `mac.extendInfo` da configuração do `electron-builder`) — sem isto, o pedido de câmara/microfone falha silenciosamente no macOS tal como falhava (por outro motivo) no WebKitGTK do Linux; achado da revisão cruzada com `desktop-electron-shell`.
- Metadados de empacotamento (descrição curta/longa, categoria, licença, identificador `com.mesa.desktop`, publisher) passam de `tauri.conf.json`/`frontend/src-tauri/Cargo.toml` para o campo `build` do `frontend/electron/package.json` (ou `frontend/electron-builder.yml`) — mesmos valores já decididos, novo sítio de configuração.
- `LICENSE` na raiz (AGPL-3.0) mantém-se; o campo de licença nos manifestos passa a existir em `frontend/electron/package.json` em vez de `frontend/src-tauri/Cargo.toml` (que deixou de existir — removido por `desktop-electron-shell`); `backend/Cargo.toml` e `frontend/package.json` continuam como estavam.
- A convenção de "três manifestos a sincronizar antes de uma tag" muda de membro: `backend/Cargo.toml`, `frontend/package.json`, e agora `frontend/electron/package.json` (em vez de `frontend/src-tauri/Cargo.toml`).
- **Removido desta change**: toda a investigação de GStreamer/WebKitGTK (plugins em falta, sandbox, X11/compositing) que estava registada como bloqueante — deixa de ser relevante, porque a causa raiz (motor WebKitGTK) deixa de existir no novo shell. Fica como registo histórico só no `proposal.md`/`design.md` de `desktop-electron-shell`, não repetida aqui.
- **Fora de escopo explícito, inalterado**: assinatura de código/notarização, auto-update, canal beta, lojas (Microsoft Store/Homebrew/Flathub/AUR).

## Capabilities

### New Capabilities

(nenhuma nesta revisão — `desktop/packaging` já tinha sido proposta; esta revisão ajusta o mecanismo, não introduz uma capability nova)

### Modified Capabilities

- `desktop/packaging`: o bundler muda de `tauri-apps/tauri-action` para `electron-builder`; ganha o requisito de `Info.plist` para câmara/microfone no macOS (achado novo, não existia quando esta capability foi proposta pela primeira vez, porque o shell Tauri nem chegava a esse ponto de falha).

## Impact

- **Novo** (`.github/workflows/`): primeiro workflow de CI do repositório — inalterado em propósito, revisto em mecanismo.
- **Novo** (raiz do repositório): `LICENSE` (AGPL-3.0) — inalterado.
- **Modificado** (`frontend/electron/package.json`, em vez de `frontend/src-tauri/Cargo.toml`/`tauri.conf.json`): campos de licença/metadados de empacotamento.
- **Depende de** `desktop-electron-shell` (o `frontend/electron/` e os ícones reaproveitados têm de existir) em vez de `desktop-tauri-shell` (que ficou obsoleta, arquivada como registo histórico).
- **Sem impacto**: comportamento em runtime da aplicação, `backend/` em termos de código (só o campo de licença, inalterado desta revisão).
