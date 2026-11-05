# Proposal

## Why

Subir uma instância do Parley hoje exige Nginx (TLS e proxy), certbot, Docker para o LiveKit, variáveis de ambiente escritas à mão e uma lista de portas (`docs/deploy-producao.md`, 459 linhas). Queremos que o `chat-backend` consiga, sozinho, servir o frontend, falar HTTPS, gerenciar um LiveKit local e se desligar de forma ordenada, **sem quebrar quem já opera com proxy ou túnel e LiveKit em outro servidor**. A entrega atende dois cenários reais:

- **A. Máquina com IP público, sozinha** (self-host rápido): o `chat-backend` serve a interface, fala HTTPS e gerencia o LiveKit.
- **B. Atrás de proxy ou túnel, com LiveKit externo** (por exemplo, o Parley atrás de Cloudflare Tunnel e Caddy, e o LiveKit numa VPS com Nginx): o `chat-backend` serve a interface e o resto fica como está. A mídia (UDP) não passa por túnel HTTP, por isso o LiveKit fica numa máquina com IP e portas públicas.

A produção atual (`chat.1nodado.com.br`: unit systemd, `/etc/mesa/mesa.env`, dados em `/opt/mesa/data`) continua válida sem nenhuma mudança.

## What Changes

- **O `chat-backend` ganha modos opcionais, todos desligados por padrão.** Sem nenhuma variável nova, o comportamento, as variáveis de ambiente, o `DATABASE_URL`, o schema SQLite e os subcomandos existentes (`reset-code`) permanecem exatamente como hoje.
  - **Frontend na mesma origem:** `SERVE_FRONTEND=embedded` (o `frontend/dist` vem **embutido no binário** de release, por uma feature `embed-frontend`) ou `STATIC_DIR` (um diretório, que vence). Respostas comprimidas, com `Cache-Control` adequado e **fontes empacotadas** no `dist` (hoje o frontend as carrega do Google Fonts, o que a CSP do backend bloquearia e expõe cada visita a um terceiro). `/api` nunca devolve o `index.html`.
  - **Desligamento ordenado:** `SIGTERM`/Ctrl-C fecham o listener, as conexões WebSocket (com prazo) e os processos filhos. Hoje `main.rs` termina em `axum::serve(...).await` sem nenhum tratamento.
  - **LiveKit gerenciado (`LIVEKIT_MANAGED`):** baixa o `livekit-server` (versão fixada, a do compose atual, v1.13.5; SHA-256 conferido), gera a configuração a partir das variáveis (porta de sinalização, porta TCP, mídia por **porta UDP única ou faixa de portas**, TURN opcional, IP anunciado) ou usa o seu próprio `livekit.yaml` (`LIVEKIT_CONFIG_FILE`, que cobre o que as variáveis não modelam, como TURN com TLS) e o supervisiona como processo filho, escutando por padrão em `127.0.0.1:7880`. As chaves vêm de `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` ou, na falta delas, são geradas e guardadas em arquivo de permissões restritas. `LIVEKIT_BINARY_PATH` usa um binário já presente (hosts sem acesso de saída). O download roda em segundo plano e nunca deixa um arquivo parcial.
  - **Túnel `/rtc`:** com o LiveKit gerenciado, o backend repassa a sinalização WebSocket para o LiveKit local (ping e ociosidade equivalentes aos do Nginx atual), e a mídia usa uma única porta UDP.
  - **TLS embutido (`TLS_MODE`):** `off` (padrão, `127.0.0.1:8080` como hoje), `self` (certificado autoassinado persistido, porta alta fixa, impressão digital exibida) e `files` (`TLS_CERT_FILE`/`TLS_KEY_FILE`, lidos no arranque; a renovação reinicia o serviço). Com TLS embutido os cookies de sessão são `Secure`, e com certificado autoassinado o servidor **não** emite HSTS.
- **Subcomandos novos:** `healthcheck` (consulta `/health` localmente, para o `HEALTHCHECK` do contêiner) e `tls-fingerprint`.
- **Empacotamento (somente Linux):** binário de release com o frontend embutido (x86_64; arm64 se houver runner) e imagem de contêiner (novo `Dockerfile`: glibc, usuário não root, volume de dados, parada ordenada). Um **job novo no workflow de release existente** (`desktop-release.yml`: mesma tag e mesma release em rascunho, com os checksums do servidor em arquivo separado) constrói o frontend e depois o backend; hoje nenhum workflow compila o backend. A release do servidor faz parte da release `vX.Y.Z` do aplicativo, porque a `releases/latest` é um ponteiro único usado pelo atualizador do app, pelos scripts de instalação e pelos downloads do servidor.
- **Documentação por topologia** (A, B e a clássica C com Nginx e LiveKit local), com a receita do **Caddy** para HTTPS automático, os cabeçalhos do IP real atrás de Nginx, Caddy e Cloudflare Tunnel (`X-Real-IP`), e a migração da produção por etapas, opcional e reversível.
- **Não entram:** ACME embutido (o HTTPS automático fica com o Caddy ou o certbot, documentados); Windows e macOS; configuração pelo navegador; serviço de egress do LiveKit (gravação continua dependendo de um egress externo); mudar o formato do `chat.db`, o caminho dos anexos, `PUBLIC_BASE_URL` ou `LIVEKIT_WS_URL` da produção atual.

## Capabilities

### New Capabilities
- `server/standalone`: modos opcionais do servidor (frontend, LiveKit gerenciado, túnel `/rtc`, TLS embutido), desligamento ordenado, subcomandos, distribuição, documentação por topologia e migração, com compatibilidade total quando nenhum modo é ligado.

### Modified Capabilities
(nenhuma: nenhum requisito das specs existentes muda.)

## Impact

- **Backend** (`backend/src`): `config.rs` (variáveis novas, `Default`, validações), `main.rs` (parsing de subcomandos, delega a `server::run`), `lib.rs`/novo `server.rs` (execução do servidor, desligamento), serviço de frontend, módulos do supervisor do LiveKit e do túnel, TLS; `Cargo.toml` (`tokio` com `process`/`io-util`/`time`/`sync`, `tower-http` com compressão e `set-header`, `tokio-tungstenite` promovida de dev, `axum-server`, `rcgen`, `rust-embed` atrás da feature `embed-frontend`, `flate2`/`tar`; todas com o provedor `ring`).
- **Frontend** (`frontend`): fontes empacotadas, `<link>` do Google Fonts removidos de `index.html`.
- **Infra e CI:** novo `Dockerfile`, exemplo de `docker compose`, novo job do servidor no `desktop-release.yml`.
- **Documentação:** `docs/deploy-producao.md`, `docs/operar-instancia.md`, `docs/arquitetura-tecnica.md`, README, CHANGELOG.
- **Produção atual:** sem impacto até o binário novo ser instalado; nenhum modo é ligado por padrão; sem migração de banco.
- **Rollout:** versão ≥1.6.0; rollback por troca do binário anterior.
