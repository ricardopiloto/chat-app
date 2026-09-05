# Data Model: 024-security-hardening

Sem migração SQLite obrigatória. Estado novo é de processo ou configuração.

## ProductionProfile (config)

| Campo | Tipo | Regras |
|-------|------|--------|
| `enabled` | bool | `MESA_PRODUCTION` / `MESA_ENV=production` |
| `livekit_key` / `secret` | string | Se `enabled`, MUST NOT ser o par de exemplo |
| `cookie_secure` | bool | Se `enabled`, MUST ser true |
| `bind` | string | Default `127.0.0.1:8080` |
| `livekit_url` | string | Única fonte da URL de join de voz |

## RateLimitBucket (memória)

| Campo | Notas |
|-------|--------|
| `key` | IP (ligação; XFF só produção+proxy confiável — v1: IP de ligação sempre, documentar) |
| `window_start` | instante |
| `count` | incrementa em POST login/register |
| `limit` | 10 / 60 s; testes: desligado |

Transição: abaixo do limite → pedido segue; acima → 429, sem lado-efeito de sessão.

## UnfurlFetch

| Campo | Regras |
|-------|--------|
| `url` | http(s), ≤2048 chars |
| `resolved_ips` | nenhum blocked |
| `body_cap` | 256 KiB |
| `image_url` | mesmo validador ou omitir |

## EnvelopeHandoff

| Caller vs target | Resultado |
|------------------|-----------|
| `account_id == caller` | upsert OK |
| target `pending` e caller dono ou `synced` | upsert OK |
| target `synced` e caller ≠ target | 403 |
| target não membro | 400 (já existe) |

## Membership / history (existente, um sítio)

`history_visible_since`: `None` se convite com histórico ou sem convite; senão `joined_at`. Usado em mensagens **e** anexos.

## First operator

`Account.is_initial_operator`: no máximo um `true`, atribuído sob transação de escrita imediata.
