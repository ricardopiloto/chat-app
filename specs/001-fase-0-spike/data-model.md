# Data Model: Spike Fase 0

O spike **não persiste** banco. Estado vive em memória de processo, config YAML e no SFU LiveKit. Entidades abaixo são o vocabulário compartilhado entre cliente, token service e relatório.

---

## Sala (`Room`)

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | string | Fixa no spike: `spike-room`. Auto-create no LiveKit (`room.auto_create` default true). |
| `url` | ws/http URL | Sinalização: `ws://<host>:7880` (LAN) ou `ws://<ip-público>:7880` (hotspot). |

Não há hierarquia Servidor/Canal do produto.

---

## Participante

| Campo | Tipo | Regras |
|-------|------|--------|
| `identity` | string | Estável; chave do slot. Spike usa `alice` e `bob`. |
| `name` | string | Display; pode igualar `identity`. |
| `sid` | string | Atribuído pelo LiveKit a cada join; **não** é a chave do slot. |

**Identidade**: quem sai e volta com o mesmo `identity` reocupa o slot. SID novo a cada sessão.

---

## Credencial de acesso (`AccessToken`)

Emitida só pelo processo `spike/token`. JWT LiveKit.

| Campo / grant | Regras |
|---------------|--------|
| `iss` / API key | `spikekey` (de `spike/infra/livekit.yaml`) |
| `sub` / identity | `alice` ou `bob` (ou o identity pedido) |
| `video.room` | `spike-room` |
| `video.roomJoin` | true |
| `ttl` | ~10 minutos |
| API secret | **nunca** no payload HTTP nem no cliente |

Estados: emitida → aceita pelo SFU | rejeitada (expirada / assinatura inválida / secret errado).

---

## Segredo de administração

| Campo | Valor de teste | Onde vive |
|-------|----------------|-----------|
| API key | `spikekey` | `livekit.yaml` + env do token service |
| API secret | `spikesecretspikesecretspikesecret` | idem; **não** no frontend |

Trocar esses valores no relatório se forem alterados. Não são credenciais de produção.

---

## Posição de câmera (`Slot`)

Grade da **sala**, 4 slots, uma câmera por participante.

| `index` | `identity` | Estado |
|---------|------------|--------|
| 0 | `alice` | ocupado se `alice` está na sala |
| 1 | `bob` | ocupado se `bob` está na sala |
| 2 | — | sempre vazio neste spike |
| 3 | — | sempre vazio neste spike |

**Transições**

```text
ausente --join(identity mapeada)--> ocupado (vídeo | só áudio | sem mídia)
ocupado --leave--> vazio_reservado (retângulo visível, sem compactar)
vazio_reservado --rejoin(mesmo identity)--> ocupado (mesmo index)
```

Identity desconhecida (não `alice`/`bob`): entra na sala mas **não** ganha slot da grade (ou cai num overflow visível “não mapeado”). Não reordena 0–3.

---

## Mapa de layout (cliente, estático)

```json
{
  "columns": 2,
  "rows": 2,
  "slots": [
    { "index": 0, "identity": "alice" },
    { "index": 1, "identity": "bob" },
    { "index": 2, "identity": null },
    { "index": 3, "identity": null }
  ]
}
```

Sem CRUD. Sem sync servidor.

---

## Sessão de mídia

| Campo | Notas |
|-------|-------|
| `camera` / `mic` | Captura local via `getUserMedia` no webview |
| `published` | Tracks enviados ao SFU |
| `subscribed` | Tracks do outro participante |
| `ice` | Direto (host/srflx) ou relé (TURN) — logar o tipo no teste hotspot |

Não modelar codecs além do default do SDK.

---

## Experimento de criptografia (Onda 2)

| Campo | Regras |
|-------|--------|
| `api_script_transform` | bool — `RTCRtpScriptTransform` existe |
| `api_legacy_encoded_streams` | bool — `createEncodedStreams` existe |
| `round_trip` | `ok` \| `fail` \| `skipped` |
| `method` | `livekit-e2ee` \| `xor-loopback` |
| `test_key` | chave compartilhada de teste; não é protocolo de produto |

Go da premissa só com `round_trip = ok` no webview Tauri desta máquina.

---

## Medição de recursos

| Campo | Unidade | Uso |
|-------|---------|-----|
| `process` | tauri-client \| livekit-container \| token-svc | |
| `condition` | idle \| in_call | |
| `rss_mb` | número | |
| `idle_client_go` | bool | `rss_mb < 1024` só para tauri-client idle |

Uma linha por par processo×condição no relatório.

---

## Relatório go/no-go

Entidade documental, não runtime. Premissas: `chamada_mesma_rede`, `grade`, `hotspot_nat`, `credencial`, `criptografia_linux`, `ram_idle`. Cada uma: `go` | `no-go` | `bloqueio_ambiente`. Ver [contracts/go-no-go-report.md](./contracts/go-no-go-report.md).
