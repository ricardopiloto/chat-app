# Operar a Instância de Hospedagem (Fase 1)

Guia para um operador publicar a instância na própria máquina. Meta: instância respondendo no navegador em menos de 30 minutos (SC-001).

## Pré-requisitos

- Linux (validado em Fedora). Docker Engine + Compose (grupo `docker` ou `sudo`).
- Rust stable (`rustc`, `cargo`) e Node LTS (`node`, `npm`).
- Portas livres: **8080/tcp** (API), **1420/tcp** (SPA em dev / HTTPS local), **7880/tcp** e **7881/tcp** (sinalização LiveKit), **3478/udp** (TURN embutido), **50000–50100/udp** (mídia).

## 1. LiveKit

```bash
cd infra
cp .env.example .env   # opcional; as chaves já estão em livekit.yaml
docker compose up -d
```

Confirme: `curl -sS -o /dev/null -w "%{http_code}\n" --max-time 2 http://127.0.0.1:7880` (esperado: 200). As chaves em `infra/livekit.yaml` (`instkey` / `instsecretinstsecretinstsecret12`) têm de coincidir com `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` do backend.

O Compose usa `network_mode: host` para o LiveKit anunciar o IP da LAN (necessário para o telemóvel na mesma Wi‑Fi). Recrie o contentor se veio de um `compose` antigo: `sudo docker compose down && sudo docker compose up -d`.

No firewall, na LAN:

```bash
sudo firewall-cmd --add-port=1420/tcp --add-port=7880/tcp --add-port=7881/tcp \
  --add-port=3478/udp --add-port=50000-50100/udp
```

Para participantes **fora da LAN do operador**, abra as mesmas portas no router/NAT e considere `use_external_ip: true` em `livekit.yaml`. Hotspot/IP público sem port-forward é limite de ambiente, não falha do produto.

## 2. Backend

```bash
cd backend
export DATABASE_URL=sqlite://chat.db?mode=rwc
export BIND=0.0.0.0:8080
export LIVEKIT_API_KEY=instkey
export LIVEKIT_API_SECRET=instsecretinstsecretinstsecret12
export LIVEKIT_WS_URL=ws://127.0.0.1:7880
export COOKIE_SECURE=false          # true atrás de HTTPS de produção
export SESSION_TTL_SECS=604800      # 7 dias
export DEFAULT_INVITE_TTL_SECS=604800
cargo run
```

`GET /health` → `{"ok":true}`. O SQLite (`chat.db`) é criado no primeiro boot. Sessão: cookie httpOnly `Session`, SameSite=Strict.

## 3. Cliente web

```bash
cd frontend
npm install
npm run dev
```

Abra `https://127.0.0.1:1420` (certificado de desenvolvimento — aceite-o). No telemóvel na mesma Wi‑Fi use `https://<IP-LAN>:1420`. `http://IP` não é origem segura: `mediaDevices` fica indefinido.

## 4. Primeiro uso

1. Instância vazia: cadastre a primeira conta (identificador + senha ≥ 8). Essa conta é o operador inicial.
2. Crie um Servidor e um canal. Gere um convite (expira em 7 dias por omissão; `expires_in_seconds: null` = permanente). Marque histórico só se quiser que o recém-chegado leia o passado.
3. A segunda pessoa abre o link do convite, cria conta se ainda não tiver, e entra.

Não copie `spike/` — é descartável. Este binário é o produto.

## Portas a documentar no router (FR-017)

| Serviço | Porta | Protocolo |
|---------|-------|-----------|
| SPA (dev) | 1420 | TCP |
| API + WebSocket | 8080 | TCP |
| LiveKit sinalização | 7880 | TCP |
| LiveKit RTC TCP | 7881 | TCP |
| TURN | 3478 | UDP |
| Mídia | 50000–50100 | UDP |
