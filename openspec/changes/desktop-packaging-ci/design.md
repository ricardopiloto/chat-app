# Design

## Context

Ver `proposal.md` — Why. Pontos que ancoram este design:

- `git remote -v` confirma o repositório em `github.com/ricardopiloto/chat-app` — GitHub Actions é a escolha natural, sem infra-estrutura nova a operar (coerente com "sem equipa de operação", já um princípio de `docs/arquitetura-tecnica.md`).
- Não existe `.github/workflows/` hoje — esta é a primeira esteira de CI do repositório.
- Compilar os três alvos de SO de um shell com webview nativo (WebKitGTK no Linux, WebView2 no Windows, WKWebView no macOS) não é razoavelmente cross-compilável a partir de uma única máquina — cada plataforma precisa do seu próprio runner.
- Nenhum manifesto do repositório (`backend/Cargo.toml`, `frontend/package.json`) declara licença hoje; decidido com o utilizador: AGPL-3.0. Identificador reverso decidido: `com.mesa.desktop` (corrigido de `com.mesa.app` durante a implementação desta change — ver Decisão 4).
- `desktop-tauri-shell` já decide ícones/janela/rede; esta change não reabre nenhuma dessas decisões, só consome o crate que elas produzem.

## Goals / Non-Goals

**Goals:**
- Um comando (`workflow_dispatch`) ou uma tag `v*` produz os sete artefactos pedidos (AppImage, deb, rpm, msi, exe, app, dmg) sem intervenção manual em três máquinas diferentes.
- Metadados de empacotamento (licença, descrição, identificador) correctos nos três formatos que os exigem (deb, rpm, e também msi/dmg, que também usam descrição/publisher).

**Non-Goals:**
- Assinatura de código (Windows) ou notarização (macOS) — ver Decisão 3.
- Auto-update, canal beta, publicação em lojas (Microsoft Store/Homebrew/Flathub/AUR).
- Qualquer mudança ao comportamento em runtime da aplicação — esta change só compila/empacota/publica o que já existe.

## Decisions

### 1. `tauri-apps/tauri-action` em vez de passos manuais de `cargo tauri build`

Alternativa descartada: escrever cada passo (instalar toolchain Rust, Node, dependências de sistema, invocar `cargo tauri build --bundles ...`) manualmente em YAML por plataforma. Rejeitada porque a acção oficial já encapsula correctamente as diferenças por SO (instalação de toolchain, cache, invocação do bundler certo) e é o caminho documentado/mantido pelo próprio projecto Tauri — escrever manualmente duplicaria lógica que já existe e que ficaria por manter sempre que o Tauri mudar de versão. O único trabalho manual necessário é o que a acção não cobre: instalar `rpm`/`rpmbuild` no runner Linux (não vem por omissão em `ubuntu-latest`) e preencher os metadados de empacotamento.

### 2. Disparo manual/por tag, não em cada push

Ver Requirement correspondente em `specs/desktop/packaging/spec.md`. Alternativa descartada: compilar em cada push para `main`, ao estilo de CI contínua. Rejeitada por custo (três runners, vários minutos cada, por cada commit) sem benefício proporcional — este projecto não tem lançamentos diários, e a verificação de que o código compila já pode ficar para um workflow mais leve (fora de escopo desta change, não pedido pelo utilizador) se algum dia for necessário.

### 3. Sem assinatura de código nem notarização

Alternativa descartada: pedir/comprar um certificado Authenticode (Windows) e inscrever o projecto no Apple Developer Program (macOS, ~99 USD/ano) já nesta change. Rejeitada por custo recorrente não autorizado pelo utilizador e por não ser um bloqueio técnico — binários não assinados instalam-se perfeitamente, só com um aviso adicional (SmartScreen/Gatekeeper) que quem já usa outro software não-comercial/self-hosted já reconhece. Documentado explicitamente (Requirement correspondente) em vez de ser uma lacuna descoberta por quem instalar.

### 4. Licença AGPL-3.0 e identificador `com.mesa.desktop`

Decididos directamente com o utilizador (ver histórico da conversa). `LICENSE` na raiz, e o campo de licença replicado nos três manifestos que o bundler Tauri e o `cargo`/`npm` esperam (`backend/Cargo.toml` por consistência do monorepo, mesmo não sendo embalado por este workflow; `frontend/package.json`; `frontend/src-tauri/Cargo.toml`, este sim lido directamente pelos bundlers deb/rpm).

O identificador reverso começou como `com.mesa.app` (valor indicativo aprovado antes de `desktop-tauri-shell` arrancar). Durante a implementação desta change, `cargo tauri build --bundles deb` avisou que terminar em `.app` coincide com o sufixo dos bundles de aplicação do macOS, risco de ambiguidade em ferramentas que assumam esse sufixo como extensão de bundle. Sem nenhuma release real publicada ainda, a troca para `com.mesa.desktop` foi decidida com o utilizador como gratuita agora e evitada mais tarde (uma mudança de identificador depois do primeiro lançamento é disruptiva — o macOS trata-a como uma aplicação diferente para efeitos de keychain/updates).

## Risks / Trade-offs

- [Bundler `rpm` do Tauri precisa de `rpmbuild` instalado no runner — `ubuntu-latest` não o traz por omissão] → Mitigação: passo explícito de `apt-get install rpm` (ou equivalente) antes de invocar `tauri-action` no job Linux; verificado na Tarefa correspondente, não assumido.
- [AppImage: o bundler do Tauri descarrega `linuxdeploy`/`appimagetool` em build-time — depende de rede disponível no runner e pode falhar de forma intermitente por indisponibilidade externa] → Mitigação aceite: comportamento já conhecido do ecossistema Tauri; sem acção adicional nesta change além de deixar o CI falhar visivelmente (não silenciosamente) quando acontecer, para re-tentar.
- [Binários não assinados podem ser bloqueados por antivírus/SmartScreen mais agressivamente do que os assinados, afectando a adopção] → Mitigação: aceite conscientemente (Decisão 3); documentado para quem distribui/instala, não resolvido tecnicamente nesta change.
- [Mudar a licença do projecto para AGPL-3.0 agora, depois de código já existir sem licença declarada, pode ter implicações sobre contribuições passadas] → Mitigação: fora do controlo desta change (decisão de produto/legal já tomada pelo utilizador); a tarefa correspondente só aplica a decisão, não a reabre.

## Migration Plan

Mudança aditiva ao nível de ficheiros de configuração/CI — não altera código de runtime. Depende de `desktop-tauri-shell` estar implementada (o crate e os ícones têm de existir para haver algo a empacotar). Primeira execução recomendada via `workflow_dispatch` (sem criar tag) para validar os três runners antes de qualquer tag `v*` real accionar uma release pública.
