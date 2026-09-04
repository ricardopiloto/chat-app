# Resultados do spike Fase 0

**Data**: 2026-09-04  
**Host**: Fedora 44 (esta máquina)  
**LiveKit image**: `livekit/livekit-server:v1.13.5` (digest não lido — `docker` exige grupo `docker` / sudo)  
**Cliente medido**: SPA Vite no **Zen Browser** (Gecko). Shell Tauri **retirado** nesta onda: WebKitGTK 4.1 (`webkit2gtk4.1-2.52.5`) não registra `RTCPeerConnection` mesmo com `enable-webrtc=true`.

## Ambiente

- Docker **sobe** (`sudo docker compose up -d`); curl `http://127.0.0.1:7880` → 200. Usuário **ainda fora** do grupo `docker` → `docker stats` sem sudo falha.
- Rust/cargo ok (`spike/token`). Node/Vite ok (`spike/client`).
- Comandos: `spike/README.md`.

## Seção 1 — Onda 1 (caminho “chamada funciona”)

| Premissa | Valor | Evidência |
|----------|--------|-----------|
| `chamada_mesma_rede` | **go** (navegador) | SFU isolado (Meet custom) + duas abas do spike em `http://localhost:1420` (alice/bob) com A/V. **no-go** para Tauri/WebKitGTK neste RPM. |
| `grade` | **go** | Grade 2×2 no cliente Vite: alice slot 0, bob slot 1, slots 2–3 vazios; slot atrelado à identity. |
| `hotspot_nat` | **bloqueio_ambiente** | Port-forward/hotspot do celular **não** executado nesta sessão. Túnel não usado. Config em `spike/infra/livekit.hotspot.yaml`. |

**MVP que só precisa de chamada funcionar:** **sim, no navegador.** Não no cliente Tauri Linux com WebKit de estoque.

## Seção 2 — Onda 2 (credencial + E2EE)

| Premissa | Valor | Evidência |
|----------|--------|-----------|
| `credencial` | **go** | `cargo test` (2/2). `GET /health` → `{"ok":true}`. `POST /token` alice/`spike-room` → `{token,url}`; body sem `secret`; sala inválida → 400. Nenhuma ocorrência de `spikesecret` em `spike/client/`. |
| `criptografia_linux` | **go no navegador** / **no-go Tauri** | Mecanismo exercitado na SPA (Gecko). Insertable Streams **não** existem no WebKitGTK desta máquina. Gap Windows (WebView2) e macOS (WKWebView): **ainda aberto**. |
| `ram_idle` | **observação** (corte era Tauri &lt; 1 GB) | Sem processo `spike-client`. Token **6,7 MB**. LiveKit (RSS do `livekit-server` visível no host, não `docker stats`) **104,9 MB**. Zen (processo pai, todas as abas) **~560 MB**. Não isola a aba do spike. |

**Congelar TokenSvc na arquitetura:** **sim** (emissor separado, secret fora do cliente).  
**Congelar E2EE-por-padrão:** **só para o cliente web** (motor Gecko/Chromium). **Não** congelar para o shell Tauri Linux até haver WebRTC no webview (outro kit ou CEF). Gap Win/mac permanece.

## Seção 3 — Baselines RAM (2026-09-04)

Medição `measure-ram.sh idle`. `in_call` no mesmo minuto **não** isolou uma chamada (valores iguais aos de idle para o token).

| Processo | idle rss_mb | in_call rss_mb |
|----------|-------------|----------------|
| tauri-client | *n/a* (shell removido) | *n/a* |
| zen (pai, todas as abas) | 559.9 | *não isolado* |
| livekit-server (host RSS) | 104.9 | *não isolado* |
| token-svc (`spike-token`) | 6.7 | 6.7 |

`docker stats` indisponível sem grupo `docker`. Fallback: `pgrep livekit-server`. Para stats oficiais: `sudo docker stats --no-stream` ou `sudo usermod -aG docker $USER` e relogin.
