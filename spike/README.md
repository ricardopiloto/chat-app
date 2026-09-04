# Spike Fase 0 (descartável)

Prova de conceito. **Não** copiar para o binário de produto.

**Cliente desta onda:** SPA no **navegador** (`spike/client`, Vite). O shell Tauri foi retirado — WebKitGTK do Fedora não expõe `RTCPeerConnection`. Port nativo fica para depois.

## Pré-requisitos (Fedora)

```bash
# Docker
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
# relogin (ou: newgrp docker)

# Node: use NVM/LTS already on this machine if present

# Rust só para spike/token (Onda 2), não para o cliente
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

## Subir o LiveKit (LAN)

Imagem pinada: `livekit/livekit-server:v1.13.5`.

```bash
cd spike/infra
sudo docker compose up -d
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:7880
```

Esperado: compose up; 7880 não dá connection refused.

Credenciais de teste (iguais a `livekit.yaml`): API key `spikekey`, secret `spikesecretspikesecretspikesecret`. Sala: `spike-room`. Identities: `alice`, `bob`.

## Isolar o servidor (cliente de exemplo)

1. Token de dev (na **raiz do repo**):

```bash
node spike/scripts/mint-dev-token.mjs alice
node spike/scripts/mint-dev-token.mjs bob
```

2. Abrir dois browsers no [LiveKit Meet (custom)](https://meet.livekit.io/custom):
   - LiveKit URL: `ws://127.0.0.1:7880`
   - Token: o JWT do passo 1

Se os dois exemplos oficiais **não** se veem/ouvem na LAN, **não** avance para o cliente do spike — a falha é o SFU.

## Cliente no navegador

```bash
cd spike/client
npm install
npm run dev
```

Duas abas em `https://localhost:1420` (aceite o certificado autoassinado): identity `alice` e `bob`. JWT do `mint-dev-token.mjs` (expira ~10 min). Onda 2: ligue “usar POST /token” e rode `spike/token`.

No celular (mesma Wi‑Fi): `https://<IP-do-PC>:1420` — aceite o aviso de certificado. `http://IP` **não** tem `getUserMedia` (`mediaDevices` é `undefined`). Token e sinalização LiveKit passam pelo próprio Vite (HTTPS); mídia UDP continua nas portas do LiveKit.

## Token service (Onda 2)

```bash
cd spike/token
cp .env.example .env   # já tem os valores de teste
cargo test
cargo run
```

`GET http://127.0.0.1:8080/health` → `{"ok":true}`  
`POST /token` — ver `specs/001-fase-0-spike/contracts/token-api.yaml`.

No celular, **não** use `127.0.0.1`. Abra **`https://<IP-do-PC>:1420`** (certificado autoassinado: Avançado → continuar). Libere as portas:

```bash
ip -4 addr show scope global
sudo firewall-cmd --add-port=1420/tcp --add-port=8080/tcp \
  --add-port=7880/tcp --add-port=7881/tcp --add-port=3478/udp
```

## Hotspot / NAT (US3)

Port-forward no roteador para **esta máquina**:

| Porta | Proto |
|-------|--------|
| 7880 | TCP |
| 7881 | TCP |
| 3478 | UDP |
| 50000–50100 | UDP |

Trocar config e recriar o container:

```bash
cd spike/infra
cp livekit.hotspot.yaml livekit.yaml   # ou edite na mão: turn.enabled=true, use_external_ip=true
sudo docker compose up -d --force-recreate
```

`alice` na LAN (`ws://<lan-ip>:7880`). `bob` no **hotspot do celular**, URL = IP **público** do host. **Túnel não conta.** Sem port-forward/hotspot → `bloqueio_ambiente` no relatório, não go.

`getUserMedia` no celular exige contexto seguro: `http://IP-LAN:1420` no telefone **não** conta. Para o segundo cliente, use o [LiveKit Meet custom](https://meet.livekit.io/custom) (HTTPS) apontando para `ws://<ip-público>:7880`, ou sirva o spike em HTTPS.

## RAM

```bash
spike/scripts/measure-ram.sh idle
# com duas abas alice/bob já na chamada:
spike/scripts/measure-ram.sh in_call
```

O script mede o **processo pai** do Zen/Firefox/Chromium (todas as abas), o `spike-token` e o `livekit-server`. `docker stats` só funciona se o usuário estiver no grupo `docker` (hoje o compose usa `sudo`):

```bash
sudo docker stats --no-stream
sudo usermod -aG docker "$USER"   # depois: relogin
```

## Relatório

Preencher `specs/001-fase-0-spike/results.md`.
