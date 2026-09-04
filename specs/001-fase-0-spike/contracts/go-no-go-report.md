# Contract: relatório go/no-go

Arquivo gerado na **execução** (não neste plan): `specs/001-fase-0-spike/results.md`.

Onda 1 pode publicar a seção 1 sozinha. Onda 2 completa a seção 2. Um go da Onda 1 **não** implica go da Onda 2.

## Seção 1 — Onda 1 (caminho “chamada funciona”)

| Premissa | Valores | Evidência mínima |
|----------|---------|------------------|
| `chamada_mesma_rede` | go / no-go / bloqueio_ambiente | Dois clientes na LAN com A/V; nota se o exemplo oficial passou antes do Tauri |
| `grade` | go / no-go | Grade 2×2; alice=slot 0, bob=slot 1; slots 2–3 vazios visíveis; rejoin mantém slot |
| `hotspot_nat` | go / no-go / bloqueio_ambiente | Cliente LAN + cliente no hotspot; A/V; se usou TURN; **túnel não conta**. Sem port-forward = `bloqueio_ambiente` |

## Seção 2 — Onda 2 (congela credencial + E2EE)

| Premissa | Valores | Evidência mínima |
|----------|---------|------------------|
| `credencial` | go / no-go | Join só com `POST /token`; inspeção do cliente sem API secret |
| `criptografia_linux` | go / no-go | Round-trip no webview Tauri; probe `RTCRtpScriptTransform`; gap Windows/macOS listado |
| `ram_idle` | go / no-go | RSS idle do cliente **< 1024 MB** = go; ≥ 1024 = no-go. Anotar MB e a faixa “centenas” como observação |

## Seção 3 — Baselines (não cortam go/no-go)

Tabela processo × condição (`idle`, `in_call`) com RSS em MB: Tauri, container LiveKit, token service.

## Campos obrigatórios no header

- Data
- Versão/digest da imagem LiveKit
- `webkitgtk` / versão do webview se disponível
- Host: Fedora, esta máquina

## Regras

- Resultado negativo **documentado** = sucesso do *spike* (a premissa é no-go).
- `bloqueio_ambiente` ≠ no-go da premissa técnica (ex.: Docker parado, hotspot indisponível).
- Após Onda 2: dizer explicitamente se TokenSvc e E2EE-por-padrão **podem ser congelados** na arquitetura.
