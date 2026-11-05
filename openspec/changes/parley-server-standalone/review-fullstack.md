# Review — Desenvolvedor Fullstack

**Change:** parley-server-standalone (versão com faixa de portas e `LIVEKIT_CONFIG_FILE`)
**Data:** 2026-11-05
**Veredito geral:** Aprovado com ressalvas

Escopo: a change sozinha contra o código da `main`. Lido do disco: os quatro artefatos, `backend/src/{main,lib,config,security_headers,rate_limit}.rs`, `backend/src/api/{mod,voice}.rs`, `backend/src/ws/mod.rs`, `backend/Cargo.toml`/`Cargo.lock`, `backend/tests/{common,contract,integration}`, `frontend/index.html`/`package.json`, `infra/`, `.github/workflows/`. Features conferidas no código-fonte das crates: `tower-http 0.6.11` (`compression-br`, `compression-gzip`, `set-header`, `fs`), `axum-server 0.8.0` (`tls-rustls-no-provider`), `rcgen 0.14.10` (`default = [crypto, pem, ring]`), `rust-embed 8.13.0` (`interpolate-folder-path`). Sem CI de testes no projeto.

## Resolvido desde a revisão anterior
O bloqueante da faixa de portas está fechado (`LIVEKIT_RTC_PORT_RANGE` exclusiva com `LIVEKIT_UDP_PORT`, mais `LIVEKIT_CONFIG_FILE`); o `PR_SET_PDEATHSIG` por thread, o download atômico em segundo plano, os testes por `server::run`, o `.cargo/config.toml`, `ETag`/304, as fontes (`@fontsource-variable/*`), os caminhos de dados do contêiner e a divisão da tarefa 4.5 estão nos artefatos.

## 1. Desenvolvimento do backend
Veredito: Atenção
- **Gerar o `livekit.yaml` sem biblioteca de YAML.** O arquivo gerado tem poucos campos escalares (portas, IP, booleanos, a chave). Um modelo de texto com os valores validados evita uma dependência (`serde_yaml` está descontinuada) e elimina a injeção de YAML por variável de ambiente (por exemplo, um `LIVEKIT_NODE_IP` com quebra de linha). — validar cada valor por tipo (porta numérica, IP com `IpAddr::from_str`, faixa `início<fim`, nome da chave sem espaços ou `:`) em `Config::validate` e gerar por modelo; acrescentar à tarefa 3.2 e à 1.4 (faixa dentro de 1024–65535 e início menor que o fim).
- **Verificações de arranque do `LIVEKIT_CONFIG_FILE`:** o `port` do arquivo versus `LIVEKIT_PORT`, e o nome da chave do backend dentro do bloco `keys:`, por leitura textual das linhas (sem parser). Emitir avisos, não falhar (apontados pelo Arquiteto). — acrescentar à 3.2 com testes usando o `livekit.yaml` real da produção (sem a chave) como fixture.
- **O binário falso do LiveKit nos testes deve registrar os argumentos recebidos**, para provar que `--config <arquivo>` foi passado quando `LIVEKIT_CONFIG_FILE` está definido e que o arquivo gerado foi usado quando não está. — acrescentar à 3.3.
- O desenho do supervisor (criação do filho numa thread estável, `unsafe` comentado, `libc` explícito, `rename` atômico, backoff com reinício, estado consultável) é implementável. A criação por `tokio::process::Command::pre_exec` roda no `fork`, então só pode chamar funções seguras para assíncrono-sinal (`prctl` é); registrar isso no comentário de segurança.
- `server::run` com `axum-server` nos dois caminhos, `Handle::graceful_shutdown`, `WsHub::close_all` sobre o `watch::Sender<bool>` de cada conexão: viável como descrito. OK.
- Os 69 usos de `config.` não mudam; só se acrescentam campos a `Config`. `TestApp::with_config(|c| ...)` já existe e monta a `Config` por `from_env()`; só `tests/contract/production_boot.rs` monta por literal e recebe o `Default`. OK.

## 2. Desenvolvimento do frontend
Veredito: OK
- Fontes por `@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans` e `@fontsource/jetbrains-mono` com os pesos usados e o subconjunto latino; o Vite gera `assets/*.woff2` com hash, o que casa com o `Cache-Control` imutável. A verificação visual e de CSP é manual e registrada, com um script que garante que o `dist` não contém `fonts.googleapis`/`fonts.gstatic`. OK.

## 3. Deploy e operação
Veredito: Atenção
- **Faixa larga no Docker.** O `docker compose` com `-p 50000-60000:50000-60000/udp` cria uma regra por porta e é inviável; o exemplo deve usar a rede do host para a faixa e a porta única na rede publicada. — acrescentar à tarefa 5.2 e à documentação.
- **Certificado do TURN legível pelo serviço** (apontado pelo Arquiteto): o gancho do certbot que copia para um caminho do `mesa`; acrescentar ao guia 5.4.
- Workflow novo (`.github/workflows/server-release.yml`): `actions/setup-node`, toolchain Rust (o lock foi gerado com 1.98), cache do Cargo, `npm ci && npm run build`, depois `cargo build --release --features embed-frontend`; `cargo test` continua local. O `.cargo/config.toml` com `[env] PARLEY_FRONTEND_DIST = { value = "../frontend/dist", relative = true }` fica em `backend/.cargo/`. OK.
- `healthcheck`: lê `BIND` e `TLS_MODE`, consulta o loopback e só nesse cliente aceita o certificado autoassinado. OK.

## 4. Qualidade de código
Veredito: Atenção
- A cobertura prevista é boa e cresceu: caracterização do `reset-code`, compatibilidade por `server::run` (1.5), estático com `ETag`/304 (2.x), desligamento (1.7), supervisor com binário falso, faixa/porta única/arquivo próprio (3.2), túnel com servidor falso (4.5a), TLS (4.x), contêiner com dados persistentes (5.2).
- Faltam: (a) o teste da validação de valores do arquivo gerado contra injeção (quebra de linha em IP/nome da chave); (b) os avisos de `port` e de chave do `LIVEKIT_CONFIG_FILE`; (c) o argumento `--config` registrado pelo binário falso. — acrescentar às tarefas 1.4, 3.2 e 3.3.
- Com 31 tarefas, a ordem de execução (1 Base → 2 Frontend → 3 LiveKit → 4 Borda própria → 5 Distribuição → 6 Validação) mantém pontos de verificação em que a `main` continua lançável. OK.

## 5. Execução das decisões arquiteturais
Veredito: OK
- O design segue as decisões acordadas (entrega única, B no lugar do ACME, só Linux, faixa e `LIVEKIT_CONFIG_FILE`, sem conteúdo de outras changes) e é implementável sobre o código atual.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- nenhuma nova; os pontos de configuração do arquivo próprio (porta e chave) e o certificado legível pelo serviço estão no parecer do Arquiteto.

## Revalidação após `/opsx:update` (2026-11-05)
Escopo: conferência de que as atenções das seções 1, 3 e 4 foram resolvidas e de que as revisões são implementáveis. Não é uma segunda análise completa.
- **Geração sem YAML e validação de valores:** D7 (modelo de texto, tipos validados, sem injeção), spec (cenário de valor inválido), tarefas 1.4 (faixa 1024–65535, início menor que o fim, IP por `IpAddr`, nome de chave) e 3.2 (testes de injeção com quebra de linha). Resolvido.
- **Avisos de `port` e de chave do `LIVEKIT_CONFIG_FILE`:** spec, D4 e 3.2, com o `livekit.yaml` real (sem a chave) como fixture. Resolvido.
- **Binário falso registrando argumentos:** D4 e tarefa 3.3 (`--config <arquivo>` com o arquivo próprio; o arquivo gerado sem ele). Resolvido.
- **`pre_exec` e funções seguras para sinal assíncrono:** D4 e 3.3. Resolvido.
- **Faixa larga no Docker e certificado legível pelo serviço:** D10/D11 e tarefas 5.2 e 5.4. Resolvido.
- Sem contradições novas; as 31 tarefas mantêm a ordem de execução. Veredito mantido: **Aprovado com ressalvas → sem pendências abertas**; nenhum bloqueante.

## Validação cruzada com `desktop-self-update` — grupo de release (2026-11-05)
Escopo: só a interseção de release com a change `desktop-self-update`, contra `.github/workflows/desktop-release.yml`, `scripts/install-mesa.{sh,ps1}`. Não é uma análise completa.
- **Estrutura do workflow:** o job `release` tem `needs: [linux, windows, macos]`, baixa `pattern: parley-*` com `merge-multiple` em `artifacts/`, conta os instaladores por extensão (`find -maxdepth 1`) e sobe `files: artifacts/**` em rascunho. O job `server` entra no `needs`, com artefato `server-linux` (fora do padrão), baixado em `server-artifacts/` e listado em `files`; assim os checksums e a contagem do desktop não veem os arquivos do servidor.
- **Validação de tag:** hoje é um passo repetido em cada job de plataforma (linhas 21, 75 e 126), não um job. A primeira redação propunha um job inicial; mudei para **repetir o passo no job `server`** (conferindo também `backend/Cargo.toml`), sem refatorar os existentes, porque a tarefa 4.3 do `desktop-self-update` altera exatamente esses passos. Um job compartilhado fica para depois das duas changes.
- **Scripts de instalação:** `install-mesa.sh` filtra por extensão, prefixo (`parley-chat-app-`/`Parley-`) e arquitetura e aborta se `SHA256SUMS` não for exatamente um; `install-mesa.ps1` exige `.exe` com `Parley` no nome e um `SHA256SUMS`. Os nomes do servidor e o `SHA256SUMS.server` não os afetam. Um teste que simula o filtro sobre uma lista de assets com os arquivos do servidor consta da tarefa 5.3.
- **Imagem de contêiner:** vai para o ghcr.io (`packages: write`) e não é asset da release.
- Veredito: **sem pendências abertas**; a ordem de entrega entre as duas changes não é bloqueante (a sobreposição está só no grupo 5 e nos documentos).
