# Data Model: 006 — Fidelidade + E2EE/gravar + rail/delete

## Existing (unchanged semantics)

- **Account**, **Session**, **Server** (`owner_account_id`), **Membership**, **Invite**
- **KeyEnvelope** (server-scoped sealed key for members — texto / handoff)
- **Channel** (`type` text | voice_video), **Message**, **GridSlot**, **Scene**, **SceneSlot**, **ChannelRole**

CASCADE `ON DELETE` já remove filhos quando `channel` ou `server` é apagado.

## Extensions

### Channel (ALTER)

| Field | Type | Notes |
|-------|------|-------|
| `created_by_account_id` | TEXT NOT NULL FK account | Backfill: `server.owner_account_id` para linhas existentes |
| `e2ee_enabled` | INTEGER NOT NULL DEFAULT 1 | 1 = on; 0 = off (gravação) |

### ChannelKey (NEW)

Custódia da chave de mídia do canal (voz/vídeo).

| Field | Type | Notes |
|-------|------|-------|
| `channel_id` | TEXT PK FK channel CASCADE | Um registo por canal voice |
| `custodian_account_id` | TEXT NOT NULL FK account | Criador |
| `sealed_blob` | BLOB NOT NULL | Chave selada para o custodian (cliente); servidor não tem plaintext |
| `created_at` | TEXT NOT NULL | |

**Invariant**: `voice_video` **com** `ChannelKey` → Gravar/Religar permitidos (sujeito a auth). Sem `ChannelKey` → legado; UI/API bloqueiam Gravar/Religar.

### E2eeAuditLog (NEW)

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT PK | |
| `channel_id` | TEXT NOT NULL FK channel CASCADE | |
| `actor_account_id` | TEXT NOT NULL FK account | |
| `action` | TEXT | `disable` \| `enable` |
| `intent` | TEXT NULL | e.g. `record` |
| `created_at` | TEXT NOT NULL | |

Último `disable` alimenta a faixa (“desligada por X · quando”).

### RecordingSession (NEW, optional metadata)

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT PK | |
| `channel_id` | TEXT NOT NULL FK | |
| `started_by` | TEXT NOT NULL | |
| `egress_id` | TEXT NULL | LiveKit egress id se sucesso |
| `status` | TEXT | `starting` \| `active` \| `failed` \| `stopped` |
| `error` | TEXT NULL | |
| `started_at` / `stopped_at` | TEXT | |

Se egress falhar no start → não persistir `active` com E2EE off a falso (transacção / compensação).

## Validation rules

- Delete channel: auth = creator OR server owner; **reject** if `COUNT(channels where server_id)=1`.
- Delete server: auth = owner only.
- Create voice channel: request MUST include custody acknowledgement flag; server MUST store `ChannelKey.sealed_blob` from client; reject without it.
- E2EE disable: only server owner (director); requires `ChannelKey` exists; writes audit log; WS `channel.e2ee_changed`.
- E2EE enable (religar): client proves key material; owner or custodian per policy (default: owner + custodian same at create); audit `enable`.

## State: Channel media privacy

```text
[e2ee_enabled=1] --Gravar confirm+egress ok--> [e2ee_enabled=0, recording active]
[e2ee_enabled=1] --Gravar confirm+egress fail--> [e2ee_enabled=1] + error
[e2ee_enabled=0] --Religar + channel key--> [e2ee_enabled=1, recording stopped]
```

## Relationships (delta)

```text
Server 1--* Channel
Account 1--* Channel (as created_by)
Channel 0..1 ChannelKey
Channel 1--* E2eeAuditLog
Channel 0--* RecordingSession
```
