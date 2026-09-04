# Data Model: 007-shell-create-plus

Sem migração de schema obrigatória — entidades e colunas da 006 bastam. Alterações são de **invariantes** e de **comportamento de criação/apagar**.

## Entities (existentes)

### Server

| Field | Notes |
|-------|--------|
| `id`, `name`, `owner_account_id` | Inalterado |

**Invariante (produto)**: após create-server bem-sucedido, o servidor tem ≥1 canal `text` e ≥1 `voice_video`. Em runtime, delete MUST preservar esse mínimo por tipo (quando ambos os tipos já existem).

### Channel

| Field | Notes |
|-------|--------|
| `id`, `server_id`, `name`, `type` | `text` \| `voice_video` |
| `grid_slot_count` | Só voz; default 4 no bootstrap |
| `created_by_account_id`, `e2ee_enabled`, `has_channel_key` | Como 006 |

**Bootstrap (create server)**: dois canais — texto `geral`, voz `mesa` com chave + cena default.

### ChannelKey / Scene

Inalterados. Voz bootstrap cria chave selada + `create_default` scene como `create_channel` voz hoje.

### Membership

Inalterado — owner entra com `key_handoff_status: Synced` + envelope de chave de servidor no cliente (fluxo actual).

## Validation rules

1. **Create server**: `name` não vazio; `custody_ack === true`; `channel_key_sealed` base64 não vazio → cria texto + voz com key.
2. **Delete channel**: 409 se for o último do seu `type` no servidor (e/ou último canal absoluto).
3. **Create channel** (secção «+»): body com `type` implícito no UI; API continua a exigir `type` no JSON.
4. **Scenes**: sem mudança de modelo; UI só edita a activa.

## State transitions

```text
[Create server dialog]
  name + generate channel key + custody ack
    → POST /servers (atomic bootstrap)
    → client: publish server key envelope; rememberChannelKey(voiceId)
    → select server; lists show Texto + Voz

[Delete channel]
  if count(type) == 1 → 409 last_of_type
  else → 204 + channel.deleted

[Voice UI]
  active scene → Editar cena → SceneEditor → PATCH scene
  (no create/activate/duplicate/list UI)
```
