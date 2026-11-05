# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/server/standalone`. Esta é uma entrega única, validada contra o código atual da `main`.

Estado atual relevante:

- `backend/src/main.rs` aceita só o subcomando `reset-code` (qualquer outro argumento vira usage e `exit(2)`, sem teste que o cubra), dispara dois `spawn` (`voice::spawn_stale_occupancy_sweeper`, `email::spawn_cleanup`) e termina em `axum::serve(...).await` **sem desligamento ordenado**. `Config::from_env()` lê tudo de variáveis; `Config::validate()` aplica o perfil de produção.
- O roteador (`backend/src/api/mod.rs`) tem `/health`, `/ws` e `.nest("/api", ...)` sem fallback próprio; não serve estático. `security_headers::attach` envolve todas as respostas e emite CSP (`style-src 'self' 'unsafe-inline'`, `font-src 'self'`) e HSTS (`max-age=31536000; includeSubDomains`) quando `cookie_secure || production`. Os cookies de sessão dependem de `config.cookie_secure`.
- `frontend/index.html` carrega as fontes de `fonts.googleapis.com`/`fonts.gstatic.com`; `frontend/package.json` não tem pacote de fontes. O app desktop carrega o `dist` por `mesa://` com `net.fetch(pathToFileURL(file))`.
- `voice.rs` e `token/mod.rs` leem `livekit_url`, a chave e o segredo direto de `state.config`; `livekit_http_host` já converte `ws(s)://` em `http(s)://`.
- A produção real do LiveKit (numa VPS, com Nginx na frente): `port: 7880` com `bind_addresses: 0.0.0.0`, `tcp_port: 7881`, faixa `50000-60000`, `use_external_ip: true`, TURN em UDP 3478 e TLS na 5349 com certificado do Let's Encrypt, chaves próprias. O `infra/livekit.yaml` do repositório é só um exemplo de desenvolvimento.
- `infra/livekit.yaml` (exemplo): `port: 7880`, `tcp_port: 7881`, faixa `50000-50100`, `use_external_ip: false`, TURN ligado em 3478, chaves. `infra/docker-compose.yml`: `livekit/livekit-server:v1.13.5`, `network_mode: host`.
- Produção atual: Nginx na frente (`/rtc` → `127.0.0.1:7880`, `proxy_read_timeout 3600s`), unit systemd com `Restart=on-failure`, `ProtectSystem=strict`, `ReadWritePaths=/opt/mesa/data`, `NoNewPrivileges=true`, usuário `mesa`. Variantes reais: Parley atrás de Cloudflare Tunnel e Caddy, com o LiveKit numa VPS com Nginx.
- `Cargo.toml`: `tokio` com `macros, rt-multi-thread, net, signal, fs`; `tower-http` com `cors, fs, trace`; `tokio-tungstenite 0.29` só como dev-dependency (já no `Cargo.lock`); `Cargo.lock` tem `rustls 0.23.43` com `ring 0.17.14` e **sem** `aws-lc-rs`. Não há `Dockerfile` nem workflow que compile o backend. Os testes sobem servidores reais em `127.0.0.1:0` e conectam com `tokio-tungstenite`.

## Goals / Non-Goals

**Goals:**
- Um único binário que, com as variáveis dos modos, sobe API, WS, frontend, LiveKit e TLS e se desliga de forma ordenada.
- Compatibilidade total: nenhum modo ligado = comportamento atual.
- Atender o servidor sozinho com IP público e o servidor atrás de proxy ou túnel com LiveKit externo.

**Non-Goals:**
- Trocar o LiveKit, reescrever a mídia ou mudar o schema do banco.
- ACME embutido (HTTPS automático fica com Caddy ou certbot, documentados).
- Windows e macOS; serviço de egress do LiveKit; configuração pelo navegador.
- Orquestração, alta disponibilidade, resolver NAT/UPnP.

## Topologia de processos e portas (cenário A, tudo ligado)

```
                        Internet
                           |
   TCP :PORTA                     UDP :MIDIA    TCP :7881    UDP :TURN (se ligado)
   (8443 self / 8080 off)               |            |             |
        |                               |            |             |
        v                               |            |             |
 +----------------------------------------------+    |            |
 | chat-backend  (processo principal)           |    |            |
 |  - TLS (rustls)  off | self | files          |    |            |
 |  - API /api  /ws  /health                    |    |            |
 |  - frontend (embutido | STATIC_DIR)          |    |            |
 |  - túnel /rtc ---------------------+         |    |            |
 |  - desligamento ordenado            |        |    |            |
 +-------------------------------------|--------+    |            |
                                       v 127.0.0.1:7880 (sinalização)
                          +---------------------------------------------+
                          | livekit-server (filho, baixado e verificado)|<-- mídia / TURN
                          +---------------------------------------------+
  Dados: <dados>/  chat.db, anexos, avatares, tls/, bin/, livekit.keys

Cenário B (túnel/proxy): Cloudflare/Caddy/Nginx -> chat-backend (TLS_MODE=off, frontend ligado)
                         LiveKit em outro servidor, LIVEKIT_WS_URL externo, sem /rtc local
```

## Ordem de execução (pontos de verificação em que a `main` continua lançável)

1. **Base:** teste de caracterização do `reset-code`, `Default` em `Config`, parsing de subcomandos, `server::run` e desligamento ordenado.
2. **Frontend:** fontes empacotadas, serviço por diretório e embutido, compressão e cache.
3. **LiveKit gerenciado:** download, chaves, configuração, supervisor, estado.
4. **Borda própria:** TLS (`self`, `files`), túnel `/rtc`, portas de mídia e TURN.
5. **Distribuição e documentação:** `Dockerfile`, workflow de release, guias por topologia.

Cada ponto termina com `cargo test` e `openspec validate --strict` passando e a produção atual intacta.

## Decisions

### D1. Modos como variáveis novas, desligadas por padrão
`SERVE_FRONTEND` (`off` padrão | `embedded`), `STATIC_DIR`, `LIVEKIT_MANAGED`, `TLS_MODE` (`off|self|files`) e as variáveis do LiveKit (D7). Ausentes = comportamento atual. Nenhuma variável existente muda de significado. O diretório de dados `<dados>` (para `bin/`, `tls/` e `livekit.keys`) é a variável `PARLEY_DATA_DIR`, com padrão no diretório do arquivo em `DATABASE_URL` (na produção atual, `/opt/mesa/data`) e, na falta dele, `./data`; não há opção de linha de comando para isso. Os campos novos de `Config` vêm com `Default`, e os testes que montam `Config { ... }` por literal (`tests/contract/production_boot.rs`) passam a usá-lo.
*Alternativa descartada:* arquivo de configuração TOML novo. Duplicaria a configuração e exigiria migração dos `.env` existentes. *Alternativa descartada:* flag `--data-dir`. Obrigaria a mexer no parsing de argumentos por causa de um parâmetro que a variável resolve.

### D2. Execução do servidor, subcomandos e desligamento ordenado
A execução (os dois `spawn`, o bind, o TLS, o serviço e o supervisor) sai de `main.rs` para `server::run(config, listener, shutdown)` na biblioteca, chamada por `main` e pelos testes (que passam um listener em `127.0.0.1:0`). Um **único caminho de serviço** (`axum-server`, com `bind` para HTTP e `bind_rustls` para TLS) dá um só `Handle::graceful_shutdown(Some(prazo))`. O sinal reúne `SIGTERM`, Ctrl-C e um canal interno (usado pelos testes); `WsHub` ganha `close_all()`, que usa o `watch::Sender<bool>` de cancelamento que cada conexão já tem e aguarda até um prazo (por exemplo, 10 s), e o supervisor do LiveKit encerra o filho. A saída é bem-sucedida em todos os casos.
`main` passa a decidir por `match` sobre o primeiro argumento: `reset-code` (comportamento e mensagens idênticos), `healthcheck`, `tls-fingerprint` e, sem argumentos, o servidor; qualquer outro argumento continua indo para usage com `exit(2)`. Como nenhum teste cobre o `reset-code` hoje, o primeiro passo é um teste de caracterização, e só então o refactor. Como o `axum-server` passa a atender também o caminho da produção atual, o requisito de compatibilidade é provado por testes que sobem pelo `server::run` (upgrade de WebSocket, login e cabeçalhos com o `.env` da produção).
O executável mantém o nome `chat-backend`.
*Alternativa descartada:* renomear o binário. Quebraria a unit systemd e os scripts da produção.

### D3. Frontend embutido no binário, com diretório como sobrescrita
O `frontend/dist` é **embutido no binário** com `rust-embed` atrás da feature `embed-frontend` (com `interpolate-folder-path`, para os testes apontarem a pasta por `$PARLEY_FRONTEND_DIST`; o padrão da variável fica no `.cargo/config.toml`, em `[env]` com `relative = true`, apontando para `../frontend/dist`, para a compilação com a feature não falhar). `SERVE_FRONTEND=embedded` ativa; `STATIC_DIR` aponta para um diretório e vence. Um binário sem a feature recusa `embedded` em `Config::validate`. O serviço entra como `fallback` do router, e **o router `/api` ganha um fallback explícito 404**, porque no axum 0.8 um router aninhado herda o fallback do pai e `/api/inexistente` devolveria o `index.html`. O fallback de SPA devolve o `index.html` só para caminhos que não são arquivo e não começam por `/api`, `/ws`, `/health`, `/rtc`. Compressão (`tower-http`, gzip/brotli) e `Cache-Control` (`public, max-age=31536000, immutable` para arquivos com hash; `no-cache` para `index.html`) por `SetResponseHeaderLayer`; para os arquivos embutidos, `ETag` e `Last-Modified` vêm do hash e da data que o `rust-embed` expõe, com resposta 304 a requisições condicionais. As respostas estáticas recebem os mesmos cabeçalhos de segurança.
**Fontes empacotadas:** as três famílias (Plus Jakarta Sans, Inter, JetBrains Mono) passam a ser arquivos do `dist` por `@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans` e `@fontsource/jetbrains-mono` (novas dependências do `frontend/package.json`), importando só os pesos usados (Inter 400–700, Jakarta 600–700, JetBrains Mono 500) e o subconjunto latino, e os `<link>` do Google Fonts saem do `index.html`. O app desktop continua carregando o `dist` por `net.fetch`, e o Chromium deduz o tipo MIME do `.woff2` do arquivo local.
*Alternativas descartadas:* publicar um pacote binário + `dist` (dois artefatos para sincronizar); relaxar a CSP para o Google Fonts (mantém o vazamento de privacidade).

### D4. LiveKit gerenciado por um supervisor em processo
Módulo `livekit_supervisor` que: resolve o binário em `<dados>/bin/livekit-server-<versão>` (versão e SHA-256 fixados em tabela no código, só para Linux x86_64 e arm64; a versão é a do compose atual, v1.13.5, conferida contra `livekit-api 0.6`/`livekit-protocol 0.7.12` do backend), baixa **em segundo plano** (o listener abre antes; `voice/join` responde «voz indisponível» enquanto baixa), grava num arquivo temporário no mesmo diretório, confere o SHA-256, aplica `chmod 0755` e faz `rename` atômico para o nome final, para nunca reaproveitar um binário parcial (arquivo `.tar.gz`, extraído com `flate2`/`tar`); ou usa `LIVEKIT_BINARY_PATH` conferindo o SHA-256 contra a tabela da versão fixada, o que na prática só aceita o mesmo binário (documentado). Com `LIVEKIT_CONFIG_FILE`, o supervisor usa o arquivo como está (passa `--config`) e não gera nada, gera a configuração do LiveKit, lança o processo filho com `tokio::process` (saída no log do servidor com prefixo e nível), reinicia com espera exponencial (1 s até 60 s) que **volta ao início depois de 5 minutos estáveis** e, após N falhas rápidas seguidas, marca o LiveKit como indisponível e tenta de novo a intervalos longos. No Linux o filho é criado com `PR_SET_PDEATHSIG`, para não sobreviver a uma morte abrupta do servidor (`kill_on_drop` não a cobre). O sinal é entregue quando a **thread** que criou o filho termina, não o processo, e a criação exige `unsafe` (`pre_exec` com `libc::prctl`; `libc` passa a dependência explícita): o filho é criado numa thread de trabalho estável do runtime, com um comentário de segurança, e há um teste de que ele segue vivo após ociosidade e morre com `SIGKILL` do pai. O `pre_exec` roda entre o `fork` e o `exec`, então só chama funções seguras para sinal assíncrono (`prctl` é uma delas), o que consta do comentário de segurança. Com `LIVEKIT_CONFIG_FILE`, o supervisor lê o arquivo apenas de forma textual, para dois avisos de arranque (o `port` diferente de `LIVEKIT_PORT` e o nome da chave de API ausente do bloco `keys`), sem parser de YAML. O binário falso usado nos testes registra os argumentos recebidos. O estado (`de pé`, `reiniciando`, `indisponível`, `desabilitado`) é consultado por `voice/join`, que responde erro claro de voz indisponível quando não está de pé.
**Chaves:** `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` quando definidas; senão geradas e guardadas em `<dados>/livekit.keys` (JSON `{ "api_key": "...", "api_secret": "..." }`, permissão 0600) e reutilizadas. Chaves nunca são as de exemplo.
**Egress:** o modo gerenciado sobe só o `livekit-server`; o serviço de egress não faz parte (limitação documentada; nenhuma UI chama o egress hoje).
*Alternativa descartada:* embutir o `livekit-server` no binário (`include_bytes`). Incha o binário em dezenas de MB e prende a versão. *Alternativa descartada:* reimplementar um SFU em Rust. Fora de escopo e arriscado.

### D5. Duas URLs do LiveKit: pública e interna
`livekit_url` continua sendo a URL **entregue aos clientes**. Acrescenta-se `livekit_internal_url` (padrão: igual a `livekit_url`, para não mudar a produção atual), usada para chamadas servidor→LiveKit (egress, health). No modo gerenciado, a pública é `<PUBLIC_BASE_URL>/rtc` (wss) e a interna é `http://127.0.0.1:7880`; `livekit_http_host` já converte esquemas de WebSocket e aceita a interna sem mudança. Com LiveKit em outro servidor (cenário B), nada muda: `LIVEKIT_WS_URL` externo e chaves iguais às do outro lado.
*Alternativa descartada:* uma única URL. O backend daria a volta pela internet para falar com o LiveKit local.

### D6. Proxy `/rtc` por túnel de WebSocket
O backend aceita o upgrade em `/rtc` e repassa os frames ao LiveKit local (`tokio-tungstenite 0.29`, já no `Cargo.lock`, promovida a dependência normal) sem inspecioná-los, repassando mensagens grandes e o fechamento de qualquer dos lados. Mantém ping a cada 30 s e limite de ociosidade de 1 h (paridade com `proxy_read_timeout 3600s` do Nginx). A autenticação continua sendo o token JWT assinado que o backend emitiu. Só ativa com `LIVEKIT_MANAGED`; com Nginx ou Caddy na frente, o proxy continua tratando `/rtc`.
*Alternativa descartada:* expor a porta 7880 do LiveKit diretamente. Exigiria TLS e porta extra, e não resolve o `wss://` na mesma origem.

### D7. Variáveis, portas de mídia e TURN
`LIVEKIT_PORT` (padrão 7880, loopback), `LIVEKIT_UDP_PORT` (porta única de mídia, em modo multiplexado; padrão 7882) **ou** `LIVEKIT_RTC_PORT_RANGE` (faixa, por exemplo `50000-60000`; exclusivo com a porta única, como no LiveKit), `LIVEKIT_TCP_PORT` (padrão 7881, recurso), `LIVEKIT_TURN` (padrão desligado) e `LIVEKIT_TURN_PORT` (padrão 3478), `LIVEKIT_USE_EXTERNAL_IP` (padrão desligado, como o `infra/livekit.yaml` atual) e `LIVEKIT_NODE_IP` (IP anunciado, opcional). Em servidor público, a documentação manda ligar o IP externo ou informar o IP anunciado. Sem TURN o servidor registra um aviso de arranque (redes que bloqueiam UDP podem não entrar em chamadas); o capítulo de migração instrui a ligar o TURN quando o `livekit.yaml` atual já o tem, que é o caso da produção. **`LIVEKIT_CONFIG_FILE`** aponta para um `livekit.yaml` próprio, usado como está: cobre tudo que as variáveis não modelam (por exemplo, o TURN com TLS, domínio e certificado da produção real) sem que o servidor precise conhecer cada opção do LiveKit; as chaves continuam vindo de `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` e devem coincidir com as do arquivo. As variáveis atendem o caso simples. A configuração gerada é produzida por **modelo de texto**, sem biblioteca de YAML (`serde_yaml` está descontinuada), e cada valor é validado por tipo antes de entrar no modelo (porta numérica; faixa com início menor que o fim, entre 1024 e 65535; IP por `IpAddr`; nome de chave sem espaços nem `:`), o que também impede injeção de YAML por variável de ambiente. Com `LIVEKIT_CONFIG_FILE`, `LIVEKIT_PORT` deve coincidir com o `port` do arquivo (padrão 7880), pois o túnel, a URL interna e o `healthcheck` o usam. As portas ficam em um único trecho da documentação.
*Alternativa descartada:* modelar cada opção do LiveKit como variável (TURN com TLS, domínio, certificados…): cresce sem fim.

### D8. TLS com `rustls` (`self` e `files`), sem ACME
`axum-server` com `rustls` e provedor **`ring`** (o `Cargo.lock` já usa `ring`; as features das crates novas devem escolher `ring`, por exemplo `tls-rustls-no-provider` no `axum-server`, e o provedor é instalado explicitamente no arranque; confirmar com `cargo tree` que `aws-lc-rs` não entra). Portas padrão: `off` → `127.0.0.1:8080`; `self` e `files` → `0.0.0.0:8443`; `BIND` vence.
`self`: certificado gerado com `rcgen` para os nomes do `PUBLIC_BASE_URL` e de uma lista opcional (`TLS_SELF_NAMES`) e, na falta de ambos, `localhost`, `127.0.0.1`, o nome da máquina e o endereço de escuta, persistido em `<dados>/tls/`, reutilizado enquanto os nomes não mudam e regenerado quando mudam; a impressão digital SHA-256 é logada no arranque e exibida por `chat-backend tls-fingerprint`.
`files`: lê `TLS_CERT_FILE`/`TLS_KEY_FILE` no arranque e recusa iniciar se faltarem ou forem inválidos; a renovação (certbot, Caddy exportando, outra CA) exige reiniciar o serviço (gancho de `certbot --deploy-hook`).
Com TLS embutido: cookies `Secure` (o valor efetivo de `cookie_secure` é verdadeiro), o `ConnectInfo` preserva o IP do peer pelo acceptor `rustls` (o limitador usa o IP real do cliente) e `TRUSTED_PROXY` mantém o significado. **Com certificado autoassinado, não se emite HSTS**: o `max-age` de um ano com `includeSubDomains` impediria o «continuar mesmo assim» do navegador.
Escutar na 443 sem root exige `AmbientCapabilities=CAP_NET_BIND_SERVICE` na unit (documentado).
*Alternativas descartadas:* ACME embutido (`instant-acme`, TLS-ALPN-01, recarga a quente): a parte mais cara e difícil de testar; o Caddy dá HTTPS automático com três linhas e é a receita documentada. Recarga a quente de `files`: acrescentaria um resolvedor de certificados com troca em tempo de execução; o reinício basta. HTTP-01: exigiria a porta 80.

### D9. Perfil de produção valida os modos novos
`Config::validate` continua rodando antes do bind e passa a cobrir: chaves geradas nunca são as de exemplo; `LIVEKIT_MANAGED` sem endereço público (`PUBLIC_BASE_URL` ou `LIVEKIT_WS_URL`) falha com mensagem clara; `TLS_MODE=files` sem arquivos válidos falha; `SERVE_FRONTEND=embedded` em binário sem a feature falha.

### D10. Documentação por topologia e migração em etapas
`docs/deploy-producao.md` ganha: (A) guia rápido da máquina com IP público (binário + `TLS_MODE=self` ou `files`, ou Caddy na frente); (B) atrás de proxy ou túnel (Nginx, Caddy, Cloudflare Tunnel) com LiveKit externo, incluindo o repasse do IP real (`X-Real-IP`; no Caddy, `header_up X-Real-IP {http.request.header.CF-Connecting-IP}` atrás da Cloudflare; o backend só lê `X-Real-IP` e só com `TRUSTED_PROXY` e peer em loopback); (C) o guia clássico, mantido. Migração em etapas independentes: (0) backup; (1) trocar o binário sem ligar nada; (2) `LIVEKIT_MANAGED` (parar o container, escutando em `127.0.0.1:7880` para o Nginx continuar valendo, ligar o TURN se o `livekit.yaml` atual o tem, testar voz, reverter se necessário); (3) frontend pelo backend; (4) remover o Nginx. Cada etapa tem verificação e passo de volta. Notas: `<dados>/bin` não pode ser `noexec`; a 443 exige a capability; o proxy deve **substituir** `X-Real-IP` (não acrescentar) e o backend fica acessível só pelo proxy; com o LiveKit em outro servidor, as chaves são as mesmas nos dois lados, a sinalização passa por um proxy com TLS e a porta 7880 não deve ficar exposta fora dele (o `bind_addresses: 0.0.0.0` da produção real a deixa escutando em todas as interfaces). O exemplo de migração usa o `livekit.yaml` da produção real (sem as chaves) como `LIVEKIT_CONFIG_FILE`, mantendo a faixa `50000-60000` e o TURN, de modo que o firewall (inclusive a *security list* da Oracle) não mude. O certificado do TURN com TLS (`/etc/letsencrypt/live/...`) só é legível pelo root: um gancho do certbot (`--deploy-hook`) o copia para um caminho legível pelo usuário do serviço, usado no arquivo, e reinicia o serviço.

### D11. Distribuição (somente Linux) e contêiner
O servidor é construído por um **job `server` no mesmo `desktop-release.yml`** (mesmo gatilho de tag `v*`, mesma release em rascunho). Um workflow separado criaria um segundo rascunho, e a `releases/latest` é um ponteiro único consumido pelo atualizador do aplicativo (aviso e feed `latest*.yml`), pelos scripts de instalação e pelos downloads do servidor: se a última release publicada fosse só a do servidor, o atualizador perderia o feed. O job constrói o frontend e depois o backend (`cargo build --release --features embed-frontend`) para Linux x86_64 (arm64 se houver runner) e sobe o artefato `server-linux` (nome fora do padrão `parley-*` que o job `release` baixa e conta), baixado em `server-artifacts/` e listado explicitamente em `files`. Os arquivos se chamam `chat-backend-<versão>-linux-x86_64[.tar.gz]`, nunca com os prefixos `parley-chat-app-` ou `Parley-` (o `install-mesa.sh` escolhe o instalador por prefixo, extensão e arquitetura), e os checksums vão em `SHA256SUMS.server`: o `install-mesa.sh` exige exatamente um asset `SHA256SUMS`, e a spec de `desktop-self-update` mantém o `SHA256SUMS` só para os seis instaladores. A validação de tag segue o padrão atual do workflow, que repete um passo em cada job de plataforma: o job `server` repete o passo e confere a tag `vX.Y.Z` contra `frontend/electron/package.json` **e** `backend/Cargo.toml`, sem refatorar os passos existentes (o `desktop-self-update`, tarefa 4.3, também os altera; um job inicial compartilhado ficaria para depois dos dois). O job `release` afirma: um único `SHA256SUMS`, seis instaladores e os arquivos do servidor presentes. A imagem de contêiner vai para o ghcr.io (`packages: write`) com as tags da versão e não é asset da release. Se o `desktop-self-update` já tiver alterado o `desktop-release.yml`, parte-se da versão dele (regex de tag e arquivos do feed). O projeto não roda testes no CI, então `cargo test` continua local. A imagem usa um `Dockerfile` em vários estágios (frontend → backend → imagem final glibc `debian-slim`), roda como usuário não root, tem volume em `/data` (a imagem define `PARLEY_DATA_DIR`, `DATABASE_URL`, `ATTACHMENTS_DIR` e `AVATARS_DIR` apontando para `/data`), declara as portas e trata `SIGTERM` pelo desligamento ordenado. O `HEALTHCHECK` usa `chat-backend healthcheck`, que consulta `/health` no loopback e, em TLS autoassinado, aceita o certificado do próprio servidor só para esse loopback (o `reqwest` com `rustls-tls` já é dependência). O exemplo de `docker compose` usa a **rede do host** para a faixa larga de portas (publicar milhares de portas UDP com `-p` cria uma regra por porta e é inviável) e a porta UDP única quando as portas são publicadas.

## Risks / Trade-offs

- [O supervisor do LiveKit é código de ciclo de vida novo: processos órfãos, reinício em loop] → `PR_SET_PDEATHSIG`, `kill_on_drop`, binário falso nos testes, backoff com reinício e limite de falhas, logs do filho no log do servidor.
- [O download do LiveKit depende de uma URL externa e de uma tabela de SHA-256 no código] → versão fixada, SHA-256, falha segura (voz indisponível, texto continua), `LIVEKIT_BINARY_PATH` para hosts sem saída; a atualização da versão é uma mudança de código revisada.
- [TLS embutido aumenta a superfície de segurança] → `rustls` com `ring`, sem opção de TLS legado, `TLS_MODE=off` por padrão, `files` falhando fechado, sem HSTS com certificado autoassinado.
- [Proxy `/rtc` adiciona um salto e um ponto de falha na sinalização] → só ativa no modo gerenciado, ping e ociosidade com paridade ao Nginx; com proxy na frente continua o proxy.
- [Frontend embutido aumenta o binário e prende o frontend à versão do servidor] → é a intenção («um único artefato»); a feature mantém o desenvolvimento e os testes leves; `STATIC_DIR` permite sobrescrever.
- [Refatoração de `main.rs` sem testes de partida] → teste de caracterização do `reset-code` antes de mexer.
- [Renovação de certificado por reinício deixa o serviço fora por alguns segundos] → aceitável; os clientes WebSocket reconectam; o gancho do certbot é documentado.
- [TURN desligado por padrão no modo gerenciado regride a conectividade de quem migra] → aviso de arranque, migração com o TURN equivalente, porta listada.
- [`LIVEKIT_CONFIG_FILE` com porta ou chave divergentes das do backend faz a voz falhar sem erro óbvio] → avisos de arranque por leitura textual do arquivo (porta e nome da chave) e documentação da regra.
- [O certificado do TURN com TLS fica ilegível para o usuário do serviço] → gancho do certbot documentado que copia o certificado para um caminho legível.
- [Faixa larga de portas UDP em contêiner é inviável com `-p`] → o exemplo de `compose` usa a rede do host.
- [A release compartilhada acopla a versão do servidor à do aplicativo: uma mudança só no servidor também reconstrói os instaladores do desktop] → uma só versão em três manifestos, conferida pela validação de tag; documentado.
- [Uma segunda forma de operar dobra a superfície de documentação e de suporte] → guia clássico mantido, guias por topologia; testes cobrindo os dois modos.

## Migration Plan

1. Implementar na ordem de execução acima, sempre atrás de variáveis desligadas por padrão; os testes existentes continuam passando sem mudança de comportamento (só o que a nova `Config` exigir).
2. Publicar ≥1.6.0 com o binário novo; atualizar a produção apenas o binário, como na seção 12 do guia, e validar `/health`.
3. Migrar etapas opcionais conforme D10, uma por vez, fora de horário de uso.
4. Rollback: restaurar o binário anterior (nenhuma migração de banco) e, se necessário, reverter a variável da etapa.
