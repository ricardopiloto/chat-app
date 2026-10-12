# Proposal

## Why

O utilizador pediu para acrescentar uma opção de instalação via linha de comando ao cliente desktop, com validação e auto-update quando houver versões novas, e para documentar no README **todas** as opções de instalação/actualização, não só a via linha de comando.

Isto reverte uma decisão já registada (não como requisito vinculativo, mas como decisão explícita) na change ainda não arquivada `desktop-packaging-ci`: `proposal.md` dessa change lista "auto-update" em "Fora de escopo explícito, inalterado", e o seu `design.md` repete "Auto-update, canal beta, publicação em lojas" nos Non-Goals. Nenhum requisito do delta de `desktop-packaging-ci` (`specs/desktop/packaging/spec.md`) proíbe formalmente auto-update — é só uma decisão de design ainda não mergeada em `openspec/specs/`. Esta change regista a reversão explicitamente, como já feito noutras changes desta sessão, em vez de a esconder.

Confirmado por investigação directa (código + documentação do `electron-updater`) antes de desenhar esta change:

- O repositório é público (`https://api.github.com/repos/ricardopiloto/chat-app` responde 200 sem autenticação) — o `electron-updater` pode usar o fornecedor GitHub sem precisar de um token embutido no cliente.
- O workflow actual (`.github/workflows/desktop-release.yml`) já publica com `--publish never` e cria a GitHub Release em **rascunho** via `softprops/action-gh-release` (`draft: true`) — o `electron-updater` só vê releases publicadas (não-rascunho), por isso o portão de revisão humana já estabelecido continua a ser o único caminho para uma actualização chegar a alguém, sem mudança nenhuma a essa política.
- **macOS**: a actualização automática do `electron-updater` exige a app assinada (certificado "Developer ID Application") e o artefacto `.zip` do updater notarizado — sem isso, não há caminho nenhum para actualização automática. Este projecto não tem conta Apple Developer (decisão já tomada em `desktop-packaging-ci`, inalterada) — por isso macOS **não pode** ter auto-update nesta change; fica só com verificação/aviso manual.
- **Windows**: o `electron-updater` suporta actualização automática no alvo **NSIS** (padrão dos instaladores Electron, ex. VS Code, Discord); **não suporta MSI** — misturar os dois alvos com o auto-updater activo é uma causa documentada de instalação duplicada (o updater aplica uma actualização estilo NSIS sobre uma instalação feita por MSI). O `.msi` continua disponível (para quem precisa dele, ex. implantação empresarial), mas sem auto-update.
- **Linux**: o `electron-updater` suporta os três formatos já produzidos — `AppImage` (actualização diferencial, delta), e `.deb`/`.rpm` (via `DebUpdater`/`RpmUpdater`: descarrega o pacote novo e instala-o através do gestor de pacotes real, `dpkg`/`dnf`/dpkg`, com elevação via `pkexec`, depois reinicia a aplicação) — os três podem ter auto-update real, não só um aviso.

## What Changes

- **Nova capability `desktop/updates`** (não existe ainda `openspec/specs/desktop/packaging/` para modificar — essa capability só existe como delta pendente em `desktop-packaging-ci`, ainda não arquivada; esta change é aditiva e independente, mas depende de `desktop-packaging-ci` estar implementada antes de poder ser verificada ponta-a-ponta).
- **Script de instalação por linha de comando** (`scripts/install-mesa.sh` para Linux/macOS, `scripts/install-mesa.ps1` para Windows): detecta SO/arquitectura, consulta a API pública do GitHub pela última release publicada (não-rascunho), descarrega o artefacto certo (AppImage no Linux, `.dmg` no macOS, `.exe` NSIS no Windows), verifica o hash contra o publicado pelo `electron-builder`, e instala — serve tanto para a primeira instalação como para reinstalar manualmente onde o auto-update não chega (MSI, macOS).
- **Auto-update em processo** (`electron-updater` no processo principal do Electron): verifica a cada arranque e periodicamente (a cada 6h enquanto corre), descarrega e valida a actualização (hash SHA-512 já produzido pelo `electron-builder` nos ficheiros de feed `latest*.yml`), e avisa visivelmente antes de reiniciar — nunca silenciosamente. Desactivado/sem efeito quando a instalação não suporta (macOS sem assinatura; Windows instalado via MSI).
- **CI** (`desktop-release.yml`): confirmar/ajustar para que os ficheiros de feed do `electron-updater` (`latest-linux.yml`, `latest-mac.yml`, `latest.yml`) sejam produzidos e acabem anexados à mesma GitHub Release em rascunho, sem mudar o portão de revisão humana já estabelecido (`draft: true` continua).
- **Documentação**: `README.md` ganha uma secção "Instalar e actualizar" cobrindo as quatro vias (linha de comando, `.deb`/`.rpm` directo, `.msi`/`.exe`, `.dmg`) e o que esperar de auto-update em cada uma; `docs/desktop-release.md` regista o requisito de feed para quem cortar uma release.

## Capabilities

### New Capabilities
- `desktop/updates`: instalação por linha de comando e actualização automática/assistida do cliente desktop, com os limites reais de cada plataforma documentados em vez de prometidos por igual.

## Impact

- **Frontend/Electron** (`frontend/electron/main.ts`, `frontend/package.json` — nova dependência `electron-updater`, `frontend/electron-builder.yml` — bloco `publish`).
- **Scripts novos** (`scripts/install-mesa.sh`, `scripts/install-mesa.ps1`).
- **CI** (`.github/workflows/desktop-release.yml`).
- **Documentação** (`README.md`, `docs/desktop-release.md`).
- **Sem impacto**: backend, assinatura de código (continua sem certificados — essa decisão de `desktop-packaging-ci` não é revertida, só a de auto-update).
