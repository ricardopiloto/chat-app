# Design

## Context

Ver `proposal.md` — Why. Pontos que ancoram este design:

- `git remote -v` confirma o repositório em `github.com/ricardopiloto/chat-app` — GitHub Actions continua a escolha natural, sem infra-estrutura nova a operar.
- Não existe `.github/workflows/` hoje — continua a ser a primeira esteira de CI do repositório.
- `desktop-electron-shell` substitui `frontend/src-tauri/` por `frontend/electron/`, reaproveitando os ícones (`frontend/electron/icons/`) e as decisões de licença/identificador já tomadas nesta change antes da troca de shell.
- `electron-builder` continua a precisar de `rpmbuild` no runner Linux para o alvo rpm (confirmado — não é uma simplificação da troca de shell) e continua a precisar de três runners nativos (um por SO) — Electron não resolve a necessidade de compilar/empacotar em cada plataforma, só resolve o problema de fiabilidade de câmara/microfone/clipboard que motivou a troca.
- Achado da revisão cruzada com `desktop-electron-shell`: no macOS, `getUserMedia()` exige `NSCameraUsageDescription`/`NSMicrophoneUsageDescription` no `Info.plist`, ou falha silenciosamente — mesma classe de problema que já gastou esforço considerável a diagnosticar no Linux, desta vez evitável à partida por ser conhecida.

## Goals / Non-Goals

**Goals:**
- Um comando (`workflow_dispatch`) ou uma tag `v*` produz os sete artefactos pedidos (AppImage, deb, rpm, nsis, msi, dmg — `.app` deixa de ser um artefacto publicado à parte, fica dentro do `.dmg`) sem intervenção manual em três máquinas diferentes.
- Metadados de empacotamento (licença, descrição, identificador) correctos nos formatos que os exigem.
- `Info.plist` do macOS declara o uso de câmara/microfone — novo Goal desta revisão, achado da troca de shell.

**Non-Goals:**
- Assinatura de código (Windows) ou notarização (macOS) — ver Decisão 3, inalterada.
- Auto-update, canal beta, publicação em lojas.
- Qualquer mudança ao comportamento em runtime da aplicação.

## Decisions

### 1. `electron-builder` em vez de `tauri-apps/tauri-action`

Decisão imposta pela troca de shell decidida em `desktop-electron-shell` — não uma escolha nova desta change. Alternativa descartada: escrever os passos manualmente por plataforma (instalar Node, invocar `electron-builder` com flags por SO). Rejeitada pelo mesmo motivo que já valia para o Tauri: `electron-builder` é a ferramenta padrão e mantida do ecossistema Electron para exactamente isto (os três alvos Linux, `nsis`/`msi` no Windows, `dmg` no macOS, numa única configuração declarativa em `package.json`/`electron-builder.yml`), evita duplicar lógica de empacotamento que já existe.

### 2. Disparo manual/por tag, não em cada push (inalterado)

Ver Requirement em `specs/desktop/packaging/spec.md`. Sem alteração desde a versão anterior desta change — continua a ser a escolha certa pelo mesmo motivo (custo de três runners por commit, sem benefício proporcional para este projecto).

### 3. Sem assinatura de código nem notarização (inalterado)

Sem alteração desde a versão anterior — continua a ser aceite conscientemente, mesmo motivo (custo recorrente não autorizado, não é bloqueio técnico).

### 4. Licença AGPL-3.0 e identificador `com.mesa.desktop` (inalterado, novo sítio de configuração)

Decididos directamente com o utilizador antes da troca de shell — continuam válidos. Só o ficheiro onde vivem muda: de `frontend/src-tauri/Cargo.toml`/`tauri.conf.json` para `frontend/electron/package.json` (campo `build` do `electron-builder`, que usa `appId` para o identificador reverso e `license`/`author`/descrição do próprio `package.json` Node).

### 5. `NSCameraUsageDescription`/`NSMicrophoneUsageDescription` explícitas no `Info.plist` (nova)

Achado da revisão cruzada com `desktop-electron-shell`: sem estas duas chaves, `getUserMedia()` falha silenciosamente no macOS (o sistema nem mostra o diálogo de permissão), reproduzindo por um motivo diferente o mesmo sintoma (`NotAllowedError`) que motivou toda a troca de shell. Configurado via `mac.extendInfo` do `electron-builder`, com texto claro do porquê a app pede câmara/microfone (entrar em canais de voz/vídeo).

## Risks / Trade-offs

- [Bundler `rpm` continua a precisar de `rpmbuild` instalado no runner — `ubuntu-latest` não o traz por omissão] → Mitigação: passo explícito de `apt-get install rpm` antes de invocar `electron-builder` no job Linux; mesma mitigação da versão anterior desta change, confirmada como ainda necessária com o novo bundler.
- [AppImage: `electron-builder` também descarrega ferramentas de empacotamento em build-time (ex. `appimagetool`) — mesma dependência de rede do runner que já existia com o Tauri] → Mitigação aceite: sem acção adicional além de deixar o CI falhar visivelmente quando acontecer.
- [Binários não assinados podem ser bloqueados por antivírus/SmartScreen mais agressivamente do que os assinados] → Mitigação: aceite conscientemente (Decisão 3), inalterado.
- [Mudar a licença do projecto para AGPL-3.0 agora] → Mitigação: fora do controlo desta change, inalterado.
- [`frontend/electron/package.json` versus `frontend/package.json` (raiz do frontend) — dois `package.json` no mesmo projecto pode confundir qual guarda a versão "oficial" do produto] → Mitigação: a convenção já estabelecida de sincronizar versão entre manifestos (ver `tasks.md`) continua a tratar `frontend/package.json` como a fonte de verdade do número de versão do produto; `frontend/electron/package.json` segue-o, nunca o contrário.

## Migration Plan

Mudança aditiva ao nível de ficheiros de configuração/CI — não altera código de runtime. Depende de `desktop-electron-shell` estar implementada (o `frontend/electron/` e os ícones têm de existir para haver algo a empacotar). Primeira execução recomendada via `workflow_dispatch` (sem criar tag) para validar os três runners antes de qualquer tag `v*` real accionar uma release pública.
