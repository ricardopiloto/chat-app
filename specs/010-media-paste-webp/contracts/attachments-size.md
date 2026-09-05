# Contract delta: Attachment size & paste policy (010)

Extensão da política em [009 attachments-api](../009-chat-media-embeds/contracts/attachments-api.md). **Endpoints e shapes JSON inalterados.**

## Policy (delta)

| Rule | 009 | 010 |
|------|-----|-----|
| Max size (ciphertext body) | 8 MiB | **5 MiB** (`5 * 1024 * 1024`) |
| MIME allow-list | jpeg/png/webp/gif | **igual** |
| Max per message | 10 | **igual** |
| Encryption | server-key AES-GCM | **igual** |

## `POST /api/channels/{channel_id}/attachments`

Comportamento idêntico; **400** se `body.len() > 5 MiB`.

Headers `X-Mesa-Media-Type` / `Content-Type: application/octet-stream` inalterados.

Colagens estáticas do cliente DEVEM declarar `image/webp` após conversão; GIF animado colado declara `image/gif`.

## Body limit (Axum)

`DefaultBodyLimit` no route de attachments: **≥ 5 MiB + margem** (ex. +64 KiB), alinhado ao novo máximo.

## Client-only (não HTTP)

- Paste no painel do canal → pending + opcional texto no draft (ver spec FR-001).
- Conversão WebP / detecção GIF: fora do contrato de rede; o servidor só vê ciphertext + MIME declarado.

## Tests esperados

- Upload ciphertext `5 MiB + 1` → **400**.
- Upload ≤5 MiB tipo válido → **201** (como 009).
- Mensagens de erro FE: “5 MiB” / “5 MB” consistente com copy PT.
