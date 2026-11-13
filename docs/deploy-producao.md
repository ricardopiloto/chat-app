# Publicar o Parley em produção — parley.1nodado.com.br

Guia passo-a-passo para subir a instância num servidor (VPS ou máquina própria) exposto na
internet através do domínio **parley.1nodado.com.br**, com HTTPS, LiveKit e systemd.

Complementa [docs/operar-instancia.md](operar-instancia.md) (que cobre o arranque rápido em
LAN/dev). Este documento assume Linux com `systemd` e `dnf`/`apt` (comandos Fedora indicados;
adapte para Debian/Ubuntu onde assinalado).

## Arquitetura de produção

```
                         parley.1nodado.com.br (443/tcp, 80/tcp)
                                    │
                               ┌────▼────┐
Internet ─────────────────────▶  Nginx   │  TLS (Let's Encrypt)
                               └────┬────┘
                  ┌─────────────────┼───────────────────────┐
                  │                 │                        │
             / (estático)      /api /health /ws          /rtc (WS)
                  │                 │                        │
       frontend/dist  127.0.0.1:8080 (backend)  127.0.0.1:7880 (LiveKit)
                                                              │
                                                     7881/tcp, 3478/udp,
                                                     50000-50100/udp
                                                     (directo, sem proxy — ICE/mídia)
```

Pontos importantes que moldam esta arquitectura (ver código, não são opção livre):

- O backend **não** serve ficheiros estáticos nem tem `CORS` — o frontend tem de estar na
  **mesma origem** (`https://parley.1nodado.com.br`) que a API, ou o browser bloqueia os pedidos e
  o cookie de sessão (`SameSite=Strict`) não é enviado. É por isso que o Nginx serve o frontend
  **e** faz proxy da API sob o mesmo domínio.
- `POST /api/channels/{id}/voice/join` devolve sempre `LIVEKIT_WS_URL` tal como configurado no
  backend (o `Host` do pedido é ignorado por desenho — [specs/024-security-hardening](../specs/024-security-hardening/)).
  Por isso o valor de `LIVEKIT_WS_URL` **tem de** ser o endereço público real que o browser vai
  usar: `wss://parley.1nodado.com.br/rtc`, proxiado pelo Nginx para o LiveKit local.
- O limitador de pedidos (`backend/src/rate_limit.rs`) conta pelo **IP do peer TCP** e ignora
  `X-Forwarded-For` de propósito (evita spoofing sem uma lista de proxies confiáveis). Atrás do
  Nginx local, todos os pedidos chegam como `127.0.0.1`, logo o limite de 10/60s passa a ser
  **partilhado por todos os visitantes**, não por IP de origem. Aceitável para um grupo pequeno;
  se isto for um problema, adicione rate limiting equivalente no próprio Nginx
  (`limit_req_zone` em `/api/auth/`).
- Os novos limites de `POST /api/auth/email/request` usam `X-Real-IP` somente quando
  `TRUSTED_PROXY=true` e o peer TCP é loopback. Login e cadastro continuam a usar o IP do peer.
  Mantenha `BIND=127.0.0.1:8080`; a porta 8080 não pode estar exposta à internet.

## 0. Pré-requisitos

- Servidor Linux com IP público fixo, 1+ vCPU, ≥2 GB RAM (compilar Rust em release com <2 GB
  costuma falhar por falta de memória — ver passo 5.1 se precisar de swap), acesso `sudo`.
- Domínio **parley.1nodado.com.br** com o DNS sob seu controlo.
- Portas livres no servidor: 80, 443, 7881/tcp, 3478/udp, 50000–50100/udp (ver tabela na secção 8).

## 1. DNS

Crie um registo **A** (e **AAAA** se tiver IPv6) apontando `parley.1nodado.com.br` para o IP
público do servidor:

```
parley.1nodado.com.br.   A       203.0.113.10
```

Confirme a propagação antes de pedir o certificado TLS:

```bash
dig +short parley.1nodado.com.br
```

## 2. Preparar o servidor

```bash
sudo dnf install -y git gcc make pkg-config nginx firewalld
# Debian/Ubuntu: sudo apt install -y git build-essential pkg-config nginx firewalld

# Rust (se ainda não tiver)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Node LTS (via nvm, para não depender do repo da distro)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install --lts

# Docker (para o LiveKit)
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"   # sair e voltar a entrar na sessão para aplicar
```

Crie um utilizador de sistema dedicado para correr a aplicação (evite root):

Os comandos abaixo documentam a instância atual, que conserva o usuário `mesa`, a unit e os diretórios `/opt/mesa` e `/etc/mesa`. Em instalações novas, use `parley` e os caminhos `/opt/parley` e `/etc/parley`, ajustando todos os comandos e a unit de forma consistente.

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin mesa
```

## 3. Obter o código

```bash
sudo mkdir -p /opt/mesa
sudo chown "$USER":"$USER" /opt/mesa
git clone <url-do-seu-repositorio> /opt/mesa
cd /opt/mesa
```

## 4. LiveKit em produção

**Nunca** use o par de chaves de exemplo (`instkey` / `instsecretinstsecretinstsecret12`) em
produção — o backend recusa arrancar com elas quando `PARLEY_PRODUCTION=1` (`Config::validate`).

Gere chaves únicas:

```bash
LIVEKIT_KEY=$(openssl rand -hex 16)
LIVEKIT_SECRET=$(openssl rand -hex 32)
echo "key: $LIVEKIT_KEY"
echo "secret: $LIVEKIT_SECRET"
```

Edite `infra/livekit.yaml`:

```yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true   # obrigatório com IP público — anuncia o IP real da máquina

keys:
  <LIVEKIT_KEY>: <LIVEKIT_SECRET>

turn:
  enabled: true
  udp_port: 3478
```

Suba o LiveKit (fica em `127.0.0.1:7880`/`7881`, mas o TURN/mídia usam o IP público via
`use_external_ip`):

```bash
cd /opt/mesa/infra
sudo docker compose up -d
curl -sS -o /dev/null -w "%{http_code}\n" --max-time 2 http://127.0.0.1:7880   # esperado: 200
```

## 5. Compilar o backend

```bash
cd /opt/mesa/backend
cargo build --release
```

### 5.1. Se o servidor tiver pouca RAM

`cargo build --release` pode ficar sem memória em VPS de 1 GB. Adicione swap temporário:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

## 6. Compilar o frontend

Before building, configure the legal pages for this instance. These values are embedded in
the frontend build, so changing the backend service environment later will not update them.
Use the real controller's details only in the local build environment, never in the repository.
The values below are deliberately fake examples:

```bash
export VITE_LEGAL_DOCUMENT_VARIANT=official  # use template for an independent self-hosted instance; template is the default
export VITE_LEGAL_OPERATOR_NAME='Jane Doe'   # fake example; set the actual operator locally
export VITE_LEGAL_OPERATOR_CONTACT='legal@example.com'  # fake example
export VITE_LEGAL_OPERATOR_JURISDICTION='Example State, Example Country'  # fake example
```

Check `/terms` and `/privacy` in both languages after deployment. If an identity variable
is missing, the page displays an obvious NOT CONFIGURED message. Set final values and review
the text before enabling `REGISTO_MODO=aberto`. The exact-root Nginx rule serves
`home.html`; its existing catch-all serves both legal paths through `index.html`.

```bash
cd /opt/mesa/frontend
npm install
npm run build
```

Isto gera `frontend/dist/` — ficheiros estáticos que o Nginx vai servir directamente (o backend
não serve HTML/JS, ver secção "Arquitectura"). `frontend/` contém o cliente atual.

## 7. Variáveis de ambiente de produção

Crie `/etc/mesa/mesa.env` (fora do repo, `600`, dono `mesa`):

```bash
sudo mkdir -p /etc/mesa
sudo tee /etc/mesa/mesa.env > /dev/null <<'EOF'
PARLEY_PRODUCTION=1

DATABASE_URL=sqlite:///opt/mesa/data/chat.db?mode=rwc
BIND=127.0.0.1:8080
COOKIE_SECURE=true

LIVEKIT_API_KEY=<LIVEKIT_KEY gerado no passo 4>
LIVEKIT_API_SECRET=<LIVEKIT_SECRET gerado no passo 4>
LIVEKIT_WS_URL=wss://parley.1nodado.com.br/rtc

SESSION_TTL_SECS=604800
DEFAULT_INVITE_TTL_SECS=300
ATTACHMENTS_DIR=/opt/mesa/data/attachments
AVATARS_DIR=/opt/mesa/data/avatars
REGISTO_MODO=fechado
# RESET_EMAIL=true  # opcional; e-mail verificado encaminha para a recuperação por chave
# Para abrir após testar Resend, termos/privacidade e Nginx:
# REGISTO_MODO=aberto
# EMAIL_API_KEY=<chave Resend>
# EMAIL_FROM="Parley <noreply@seu-dominio.example>"
# PUBLIC_BASE_URL=https://parley.1nodado.com.br
# TRUSTED_PROXY=true
# TURNSTILE_SECRET=<segredo opcional>
# TURNSTILE_SITE_KEY=<chave pública opcional>
# REGISTO_DOMINIOS_BLOQUEADOS=/etc/mesa/dominios-bloqueados.txt
# EMAIL_LOG_FILE=/opt/mesa/data/email-dev.log   # só desenvolvimento/teste sem Resend
EOF
sudo chown root:mesa /etc/mesa/mesa.env
sudo chmod 640 /etc/mesa/mesa.env
```

Substitua `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` pelos valores gerados no passo 4 — têm de
coincidir exactamente com `infra/livekit.yaml`. Confirme que `LIVEKIT_WS_URL` usa `wss://` (não
`ws://`): o backend recusa arrancar em produção com `COOKIE_SECURE` falso, mas não valida o
esquema do LiveKit — um `ws://` aqui deixaria o browser a tentar WebSocket inseguro a partir de
uma página HTTPS, que a maioria dos browsers bloqueia (*mixed content*).

`REGISTO_MODO` aceita `fechado` (padrão) ou `aberto`. `RESET_EMAIL` começa desligado e, quando ativo, habilita apenas o encaminhamento por e-mail verificado para `/recover#handle=…`; não autoriza reset. No perfil de produção, `aberto` ou `RESET_EMAIL=true` só arrancam
com `EMAIL_API_KEY`, `EMAIL_FROM`, `PUBLIC_BASE_URL` HTTPS público e `TRUSTED_PROXY=true`.
`TURNSTILE_SECRET` e `TURNSTILE_SITE_KEY` ativam o captcha; configure o par em conjunto.
`REGISTO_DOMINIOS_BLOQUEADOS` aponta para uma lista adicional (um domínio por linha), somada
à lista embutida. `EMAIL_LOG_FILE` guarda apenas diagnósticos sem endereço ou token; o e-mail
de teste completo fica no ficheiro `.eml` vizinho. Não o use em produção. Os termos e a política de privacidade precisam de texto final antes de
abrir o cadastro. `REGISTO_MODO=fechado` é o rollback imediato.

Prepare os diretórios de dados e ajuste dono:

```bash
sudo mkdir -p /opt/mesa/data/attachments /opt/mesa/data/avatars/servers
sudo chown -R mesa:mesa /opt/mesa/data
sudo chown -R mesa:mesa /opt/mesa
```

## 8. Serviço systemd para o backend

```bash
sudo tee /etc/systemd/system/mesa-backend.service > /dev/null <<'EOF'
[Unit]
Description=Parley backend (Axum)
After=network.target docker.service

[Service]
Type=simple
User=mesa
Group=mesa
WorkingDirectory=/opt/mesa/backend
EnvironmentFile=/etc/mesa/mesa.env
ExecStart=/opt/mesa/backend/target/release/chat-backend
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/opt/mesa/data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now mesa-backend
sudo systemctl status mesa-backend --no-pager
curl -sS http://127.0.0.1:8080/health   # esperado: {"ok":true}
```

## 9. Nginx + TLS (Let's Encrypt)

Instale o certbot e emita o certificado (porta 80 tem de estar acessível a partir da internet
para o desafio HTTP-01):

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo systemctl enable --now nginx
sudo certbot --nginx -d parley.1nodado.com.br
```

O certbot cria um bloco de servidor básico. Substitua-o (ou edite) por
`/etc/nginx/conf.d/mesa.conf` com o proxy completo — o certbot já terá inserido as directivas
`ssl_certificate`/`ssl_certificate_key`, mantenha-as. No contexto `http` do Nginx, fora de
`server`, configure o balde adicional:

```nginx
limit_req_zone $binary_remote_addr zone=mesa_email:10m rate=5r/m;
```

No servidor HTTPS:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name parley.1nodado.com.br;

    ssl_certificate     /etc/letsencrypt/live/parley.1nodado.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/parley.1nodado.com.br/privkey.pem;

    client_max_body_size 6m;   # cobre o limite de anexos (5 MiB) + avatares

    # Frontend estático
    root /opt/mesa/frontend/dist;
    index index.html;
    location = / {
        try_files /home.html =404;
    }
    location = /robots.txt {
        try_files /robots.marketing.txt =404;
    }
    location = /sitemap.xml {
        try_files /sitemap.marketing.xml =404;
    }
    location / {
        try_files $uri /index.html;
    }

    # API REST
    location /api/auth/email/ {
        limit_req zone=mesa_email burst=5 nodelay;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8080;
    }

    # WebSocket da app (eventos em tempo real)
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    # WebSocket de sinalização do LiveKit (RTC/ICE continua directo, ver secção 10)
    location /rtc {
        proxy_pass http://127.0.0.1:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name parley.1nodado.com.br;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Antes de recarregar, teste esse bloco contra o `frontend/dist` gerado. Confirme que `/` entrega
`data-home="marketing"`, que `/login` recebe o documento padrão e que `/robots.txt` anuncia
`/sitemap.xml`:

```bash
curl -sS https://parley.1nodado.com.br/ | grep 'data-home="marketing"'
curl -sS https://parley.1nodado.com.br/login | grep '<html'
curl -sS https://parley.1nodado.com.br/robots.txt
```

Para voltar à página pública padrão, remova os três blocos `location =` acima, execute
`sudo nginx -t && sudo systemctl reload nginx` e confirme que `/` volta a entregar
`index.html`. O restante das rotas continua no `location /` existente.

Confirme a renovação automática (o certbot já instala um temporizador):

```bash
sudo systemctl list-timers | grep certbot
```

## 10. Firewall

```bash
sudo firewall-cmd --add-service=http --add-service=https --permanent
sudo firewall-cmd --add-port=7881/tcp --add-port=3478/udp --add-port=50000-50100/udp --permanent
sudo firewall-cmd --reload
```

| Serviço | Porta | Exposição |
|---|---|---|
| HTTPS (Nginx: app + API + `/rtc`) | 443/tcp | Pública |
| Redireccionamento HTTP + ACME | 80/tcp | Pública |
| LiveKit RTC (TCP fallback) | 7881/tcp | Pública (ICE) |
| TURN | 3478/udp | Pública (ICE) |
| Mídia RTP | 50000–50100/udp | Pública (ICE) |
| Backend Axum | 8080/tcp | Só `127.0.0.1` (não expor) |
| LiveKit sinalização | 7880/tcp | Só `127.0.0.1` (via `/rtc`, não expor) |

Estas duas últimas **não** entram no firewall — devem continuar inacessíveis de fora, é o Nginx
que fala com elas em loopback.

## 11. Validar

```bash
curl -sS https://parley.1nodado.com.br/health        # {"ok":true}
```

Abra `https://parley.1nodado.com.br` no browser: a home de marketing deve carregar sem avisos
de certificado. Entre por `/login` e crie a primeira conta — torna-se automaticamente o operador inicial da
instância (o registo aberto fecha depois disso; a segunda pessoa em diante precisa de convite,
ver [docs/operar-instancia.md § Primeiro uso](operar-instancia.md#4-primeiro-uso)).

Teste uma chamada de voz/vídeo entre dois dispositivos em redes diferentes para confirmar que o
TURN (3478/udp) e o range de mídia estão mesmo alcançáveis a partir da internet.

## 12. Actualizar a instância

```bash
cd /opt/mesa
git pull
cd backend && cargo build --release && sudo systemctl restart mesa-backend
cd ../frontend && npm install && npm run build   # Nginx serve o dist/ novo de imediato
```

Se a actualização trouxer novas migrações SQL (`backend/migrations/`), correm automaticamente
no arranque do backend (`db::bootstrap`) — não precisa de as aplicar à mão.

## 13. Cópias de segurança

Dados a preservar (tudo em `/opt/mesa/data/`):

- `chat.db` (+ `-wal`/`-shm` se existirem no momento do backup) — metadados, ciphertext de
  mensagens, envelopes de chave.
- `attachments/` — blobs cifrados no cliente.
- `avatars/` — imagens de conta/servidor em claro.
- `infra/livekit.yaml` — chaves LiveKit (perder isto invalida tokens já emitidos e a gravação
  de chamadas em curso).

```bash
sudo systemctl stop mesa-backend
tar czf mesa-backup-$(date +%F).tar.gz -C /opt/mesa data infra/livekit.yaml
sudo systemctl start mesa-backend
```

Pare o backend antes do `tar` para evitar copiar o SQLite a meio de uma escrita (WAL); numa
instância pequena a paragem é de segundos.

## 14. Notas de segurança e limitações conhecidas

- **Sem federação**: cada instância é isolada; não há descoberta entre servidores diferentes.
- **Gravar (Egress)** desliga a E2EE do canal enquanto activo — comportamento intencional, ver
  [README.md § Excepção consciente](../README.md#excepção-consciente-gravar-cena). Sem
  `LIVEKIT_EGRESS_FILE_PREFIX` configurado, o botão Gravar falha com erro claro em vez de
  desligar E2EE à toa.
- **Rate limiting partilhado atrás do proxy** (ver secção "Arquitectura de produção") — não é um
  IDS; para abuso de login persistente, complemente com `fail2ban` a observar o log do Nginx ou
  `limit_req` no próprio Nginx.
- **Cadastro aberto sem cotas:** qualquer conta com e-mail verificado pode criar servidores e
  anexos. Ative `REGISTO_MODO=aberto` apenas após avaliar a capacidade de disco e o volume diário
  permitido pelo Resend. Os baldes do backend são em memória e por processo.
- **Não recebi o e-mail:** a resposta 202 é sempre genérica. Verifique spam e o DNS do domínio
  remetente (SPF/DKIM/DMARC). Consulte os logs do backend por `purpose=verify|notice`, status HTTP
  do Resend, id de envio e prefixo do hash do e-mail canônico. Limite por e-mail e falha de envio
  não aparecem na resposta ao cliente; peça nova tentativa depois da janela de limite. Não coloque
  endereço ou token em logs de suporte.
- **CSP** já vem restritiva por omissão (`backend/src/security_headers.rs`); se adicionar
  integrações externas (ex.: outro CDN de fontes) terá de rever essa política em conjunto com
  este ficheiro.

## 15. Histórico do corte para o frontend v2


O corte da v1 para a v2 já foi concluído. O cliente atual está em `frontend/` e o Nginx
serve `/opt/mesa/frontend/dist`. Para reverter uma versão do cliente, use um artefato ou
checkout anterior aprovado, faça o build em diretório separado e aponte o `root` do Nginx
para esse diretório após `nginx -t`. Não altere a base de dados sem um plano de migração.

## Revisões futuras da home de marketing

- Rever a seção «Dois jeitos de começar» quando `desktop-local-host` e
  `parley-server-standalone` forem entregues; ela descreve apenas as opções disponíveis hoje.
- `PUBLIC_HOME=marketing` ainda não existe nos artefatos de `parley-server-standalone`.
  Criar ou renomear essa opção quando aquela change for revisada.
