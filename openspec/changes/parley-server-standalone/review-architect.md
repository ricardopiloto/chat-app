# Review — Arquiteto de Soluções

**Change:** parley-server-standalone (versão com faixa de portas e `LIVEKIT_CONFIG_FILE`)
**Data:** 2026-11-05
**Veredito geral:** Aprovado com ressalvas

Escopo: a change sozinha contra o código da `main` e as topologias reais do usuário: **A** (máquina com IP público), **B** (Parley atrás de Cloudflare Tunnel e Caddy, LiveKit numa VPS com Nginx) e **C** (clássica). Referência de produção do LiveKit: o `livekit.yaml` real da VPS (porta 7880 com `bind_addresses: 0.0.0.0`, TCP 7881, faixa `50000-60000`, `use_external_ip: true`, TURN em UDP 3478 e TLS na 5349 com certificado do Let's Encrypt). Tamanho: 10 requisitos, 55 cenários, 31 tarefas. Artefatos relidos do disco; código: `backend/src/{main,lib,config,security_headers,rate_limit}.rs`, `backend/src/api/{mod,voice}.rs`, `backend/Cargo.toml`/`Cargo.lock`, `frontend/index.html`, `docs/deploy-producao.md`, `infra/`.

## Resolvido desde a revisão anterior
O bloqueante foi resolvido: a faixa de portas (`LIVEKIT_RTC_PORT_RANGE`, exclusiva com a porta única, que tem padrão 7882) e o `LIVEKIT_CONFIG_FILE` dão paridade total com a configuração real, inclusive o TURN com TLS, e o cenário de paridade usa os valores reais. Também resolvidos: fallback dos nomes do certificado `self`, download em segundo plano e atômico, caminhos de dados do contêiner, caminho do `server::run` provado por teste, `ETag`/304 no frontend embutido, `PR_SET_PDEATHSIG` por thread, regras do proxy (`X-Real-IP` substituído) e da porta 7880.

## 1. Definição da arquitetura técnica
Veredito: OK
- Os dois níveis de configuração do LiveKit (variáveis para o caso simples, arquivo próprio para o resto) evitam modelar cada opção do LiveKit e cobrem a produção real sem alterações. As features das crates conferem no registro (`axum-server 0.8.0`: `tls-rustls-no-provider`; `rcgen 0.14`: `ring` nos padrões; `rust-embed 8.13`: `interpolate-folder-path`; `tower-http 0.6.11`: `compression-br`, `compression-gzip`, `set-header`). OK.

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- **Com `LIVEKIT_CONFIG_FILE`, a porta de sinalização vive no arquivo, mas o túnel `/rtc`, a URL interna e a verificação de saúde usam `LIVEKIT_PORT` (padrão 7880).** Se o arquivo definir outra porta, o servidor passa a falar com o endereço errado e a voz falha sem erro óbvio. — dizer no spec e na documentação que, com o arquivo, `LIVEKIT_PORT` deve coincidir com o `port` dele (padrão 7880), e registrar um aviso de arranque se o arquivo tiver um `port` diferente (leitura simples da linha, sem parser de YAML).
- **Chaves do arquivo versus chaves do backend.** O arquivo traz `keys: { mesakey: <segredo> }` e o backend assina com `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`; se o nome da chave não existir no arquivo, os tokens são rejeitados e a voz falha em silêncio. — um aviso de arranque quando o nome configurado não aparece no bloco `keys` do arquivo (verificação textual simples).
- **Certificado do TURN com TLS na produção real.** O arquivo aponta para `/etc/letsencrypt/live/...`, cujas chaves privadas são legíveis só pelo root. O LiveKit gerenciado roda como o usuário do serviço (`mesa`) e não as leria. — documentar o gancho do certbot que copia o certificado para um caminho legível pelo serviço e reinicia o LiveKit/servidor, e usar esse caminho no arquivo.
- **Faixa larga em contêiner.** Publicar 10.001 portas UDP com `-p` é impraticável no Docker (uma regra por porta). — o exemplo de `docker compose` e a documentação devem recomendar a rede do host para a faixa, e a porta única (7882) quando a imagem usar redes publicadas.
- Produção atual (Nginx, systemd com `Restart=on-failure`, `ProtectSystem=strict`, `ReadWritePaths=/opt/mesa/data`): preservada. A topologia B (túnel + Caddy, LiveKit externo) não exige nenhuma mudança. OK.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK
- Segurança: SHA-256 fixado, download em segundo plano com `rename` atômico, falha fechada em `files`, `ring` como único provedor, sem HSTS com certificado autoassinado, cookies `Secure` com TLS embutido, 7880 em loopback no modo gerenciado e orientação de não deixá-la exposta no LiveKit externo. OK.
- O `axum-server` como caminho único é compensado pelo requisito de que o caminho da produção seja provado pelo `server::run` (tarefa 1.5). OK.
- Manutenibilidade: cada modo é opcional e testável; a ordem de execução limita o risco da entrega única. OK.

## 4. Documentação e decisões (ADRs)
Veredito: OK
- O design tem diagrama, alternativas descartadas nas decisões de TLS, estático, LiveKit e variáveis, e a produção real do LiveKit descrita no contexto. OK.

## 5. Ponte entre produto e técnico
Veredito: OK
- Os cenários A, B e C estão traduzidos em modos, documentação e migração por etapas, sem obrigar ninguém e com retorno ao binário anterior. OK.

## Bloqueantes antes de implementar
- nenhum

## Revalidação após `/opsx:update` (2026-11-05)
Escopo: conferência de que as quatro atenções da seção 2 foram resolvidas e de que as revisões não criaram contradições. Não é uma segunda análise completa.
- **Porta de sinalização do arquivo próprio:** no spec (aviso de arranque e cenário «Porta do arquivo diferente»), no D7 (`LIVEKIT_PORT` deve coincidir com o `port` do arquivo) e na tarefa 3.2. Resolvido.
- **Chave de API ausente do arquivo:** no spec (aviso e cenário), no D4 e na 3.2 (leitura textual do bloco `keys`). Resolvido.
- **Certificado do TURN com TLS:** requisito de documentação com cenário, D10 (gancho do certbot) e tarefa 5.4. Resolvido.
- **Faixa larga em contêiner:** requisito de documentação com cenário, D11 (rede do host) e tarefa 5.2. Resolvido.
- Sem contradições novas entre spec, design e tarefas. Veredito mantido: **Aprovado com ressalvas → sem pendências abertas**; nenhum bloqueante.

## Validação cruzada com `desktop-self-update` — grupo de release (2026-11-05)
Escopo: só a interseção de release entre a standalone e a change `desktop-self-update`. Não é uma análise completa.
- **Não há interferência em tempo de execução.** Uma toca o Electron e o empacotamento; a outra, o backend, as fontes e o `Dockerfile`.
- **Há interferência na engenharia de release**, hoje resolvida nos artefatos: a `releases/latest` é um ponteiro único consumido pelo atualizador (aviso e feed `latest*.yml`), pelos scripts de instalação e pelos downloads do servidor; por isso o servidor é um **job no mesmo workflow**, na mesma tag e no mesmo rascunho. Um workflow separado criaria um segundo rascunho e poderia deixar como «última» uma release sem o feed.
- **Contrato dos checksums:** o `install-mesa.sh` e o `install-mesa.ps1` exigem exatamente um asset de nome `SHA256SUMS` (comparação exata); o servidor usa `SHA256SUMS.server`, que não colide, e a spec do `desktop-self-update` mantém o `SHA256SUMS` só para os seis instaladores.
- **Nomes dos assets:** `chat-backend-<versão>-linux-x86_64[.tar.gz]` não casa com o prefixo (`parley-chat-app-`, `Parley-`) nem com a extensão que os dois scripts usam para escolher o instalador.
- **Versão:** um só número em três manifestos; a tag é conferida contra `backend/Cargo.toml` e `frontend/electron/package.json`. O texto «≥1.5.1» do `desktop-self-update` pode envelhecer conforme a ordem de entrega e deve ser ajustado na hora de lançar.
- Veredito: **sem pendências abertas.**
