# Data Model: 029-user-server-avatars

## Entities

### Account (extended)

| Field | Type | Notes |
|-------|------|--------|
| *(existing)* | … | `id`, `handle`, … |
| `avatar_filename` | `TEXT NULL` | Nome de ficheiro sob `AVATARS_DIR` (ex. UUID); NULL = sem avatar |
| `avatar_content_type` | `TEXT NULL` | `image/jpeg` \| `image/png` \| `image/webp` quando há ficheiro |

**Rules**:

- No máximo um avatar por conta.
- PUT substitui: apaga ficheiro antigo se existir, grava novo, actualiza colunas.
- DELETE: apaga ficheiro, põe colunas a NULL.
- Fallback UI: iniciais do `handle` (comportamento actual).

### Server (extended)

| Field | Type | Notes |
|-------|------|--------|
| *(existing)* | … | `id`, `name`, `owner_account_id`, … |
| `image_filename` | `TEXT NULL` | Ficheiro sob `AVATARS_DIR` (prefixo ou subpasta `servers/` opcional) |
| `image_content_type` | `TEXT NULL` | Mesmos MIME que avatar |

**Rules**:

- Só `owner_account_id` muta imagem.
- PUT/DELETE iguais ao avatar de conta.
- Fallback UI: iniciais do `name` no rail.

### Avatar blob (filesystem)

- Não é tabela SQL.
- Path: `{AVATARS_DIR}/{avatar_filename}` ou `{AVATARS_DIR}/servers/{image_filename}`.
- Bytes em claro; Content-Type na resposta GET = `avatar_content_type` / `image_content_type`.

## API projection fields

| Type | New field(s) | Meaning |
|------|----------------|---------|
| `AuthAccount` / me | `has_avatar: bool` (ou `avatar_url`) | Chip + settings |
| `MemberView` | `has_avatar: bool` | Members + message avatars |
| `Server` | `has_image: bool` | Rail |

Cliente monta URL estável: `/api/accounts/{id}/avatar` e `/api/servers/{id}/image` quando `has_*` é true (cache-bust opcional com query `?v=` se o implement adicionar `updated_at` — **não obrigatório** no MVP).

## Validation

| Rule | Value |
|------|--------|
| Max bytes | 1 MiB (`1_048_576`) |
| MIME | `image/jpeg`, `image/png`, `image/webp` |
| Ownership (server image) | `account.id == server.owner_account_id` |
| Self (user avatar) | `AuthUser.id` only |

## State transitions

```text
[no avatar] --PUT valid--> [has avatar]
[has avatar] --PUT valid--> [has avatar]  (replace)
[has avatar] --DELETE-----> [no avatar]
[has avatar] --PUT invalid-> [has avatar] unchanged + 400
```

Idêntico para imagem de servidor (com gate de dono).

## Out of scope

- Histórico de avatares; crop metadata; GIF; E2EE; banners de servidor.
