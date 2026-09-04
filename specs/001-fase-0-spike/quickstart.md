# Quickstart: Spike Fase 0

Validação **manual** alinhada a [spec.md](./spec.md). Stack e decisões: [research.md](./research.md). Contratos: [contracts/](./contracts/). Não é guia do produto.

## Pré-requisitos

- Fedora neste host; usuário no grupo `docker` (relogin depois de `usermod`).
- Docker daemon ativo.
- Rust (`rustup`), Node LTS, deps Tauri 2: `webkit2gtk4.1-devel`, `openssl-devel`, `libappindicator-gtk3-devel`, `librsvg2-devel`, toolchain C.
- Dois identities: `alice` (esta máquina) e `bob` (esta máquina ou o laptop no hotspot).
- **US3:** port-forward no roteador para o host (7880/tcp, 7881/tcp, 3478/udp, 50000–50100/udp) **ou** IP público no host. Sem isso → `bloqueio_ambiente`, não use túnel.

## Onda 1

### 1. SFU no ar

```bash
cd spike/infra
docker compose up -d
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:7880
```

Esperado: compose healthy; 7880 responde (código HTTP ou upgrade — não connection refused).

### 2. Isolar o servidor (cliente de exemplo)

Dois joins em `spike-room` com o Meet/exemplo oficial LiveKit (ou `lk` + client web), **antes** do Tauri.

Esperado: A/V bidirecional na LAN. Se falhar, não avance para o cliente nosso.

### 3. Cliente Tauri — mesma rede

```bash
cd spike/client
# após scaffold: npm install && npm run tauri dev
```

Duas janelas (ou dois processos): identity `alice` e `bob`. Câmera + mic. Join `spike-room`.

Esperado: cada um vê e ouve o outro (US1).

### 4. Grade

Layout 2×2. `alice` → slot 0, `bob` → slot 1, slots 2 e 3 vazios visíveis. Sair e reentrar com o mesmo identity → mesmo slot. Layout **não** compacta.

Esperado: [contracts/grid-layout.json](./contracts/grid-layout.json) (US2).

### 5. Hotspot (US3)

1. Em `livekit.yaml`: `turn.enabled: true`, `turn.udp_port: 3478`, `rtc.use_external_ip: true` (ou `node_ip` público). Recriar o container.
2. `alice` na LAN. `bob` no **hotspot do celular** (laptop ou segundo device na rede móvel), URL de sinalização = IP **público** do host, não `127.0.0.1`.
3. Confirmar A/V; anotar se ICE foi relé (TURN).

Esperado: SC-001. Túnel ≠ este teste. Hotspot/port-forward indisponível → `bloqueio_ambiente` na Onda 1.

## Onda 2

### 6. Token service

```bash
cd spike/token
LIVEKIT_API_KEY=spikekey LIVEKIT_API_SECRET=spikesecretspikesecretspikesecret \
  LIVEKIT_WS_URL=ws://127.0.0.1:7880 \
  cargo run
curl -sS http://127.0.0.1:8080/health
curl -sS -X POST http://127.0.0.1:8080/token \
  -H 'content-type: application/json' \
  -d '{"identity":"alice","room":"spike-room"}'
```

Esperado: JSON com `token` e `url` apenas — sem secret ([token-api.yaml](./contracts/token-api.yaml)). Opcional: `cargo test`.

### 7. Cliente sem secret

Tauri obtém JWT só via `POST /token`. Buscar no bundle/logs/rede por `spikesecret` → zero hits.

Esperado: join continua válido (US4, FR-007).

### 8. Criptografia no webview Tauri (não no Chrome)

No app desktop: probe `RTCRtpScriptTransform`; ligar E2EE do `livekit-client` com chave de teste compartilhada; confirmar que o remoto ainda vê/ouve. Se o E2EE do SDK falhar, XOR loopback só para diagnóstico (API vs. worker).

Esperado: round-trip ok **ou** no-go documentado + gap Win/mac (US5).

### 9. RAM

```bash
spike/scripts/measure-ram.sh idle
# dois participantes em chamada:
spike/scripts/measure-ram.sh in_call
```

Esperado: idle do processo Tauri **< 1024 MB** = go; ≥ 1024 = no-go. Demais linhas = baseline (US6).

## Encerrar

Preencher `specs/001-fase-0-spike/results.md` com [go-no-go-report.md](./contracts/go-no-go-report.md).

- Onda 1 documentada → pode começar MVP que só depende de “chamada funciona”.
- Onda 2 documentada → decidir se TokenSvc + E2EE-por-padrão congelam na arquitetura.

`docker compose down` em `spike/infra` ao terminar. Não promover `spike/` a código de produção.
