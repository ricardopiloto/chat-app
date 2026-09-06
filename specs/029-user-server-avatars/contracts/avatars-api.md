# Contract: Avatars API

**Feature**: [029-user-server-avatars](../spec.md)  
**Related**: [data-model.md](../data-model.md)

## Constants

| Name | Value |
|------|--------|
| `MAX_AVATAR_BYTES` | `1_048_576` (1 MiB) |
| Allowed media types | `image/jpeg`, `image/png`, `image/webp` |

Media type: request `Content-Type` **or** header `X-Mesa-Media-Type` (same pattern as attachments). Response GET uses real image `Content-Type`.

---

## `PUT /api/auth/avatar`

**Auth**: session cookie (self).

**Body**: raw image bytes, length ≤ 1 MiB.

**Success**: `204` or `200` + updated account projection (`has_avatar: true`).

**Errors**:

| Status | When |
|--------|------|
| `400` | Tipo inválido, corpo vazio, ou `> 1 MiB` |
| `401` | Sem sessão |

---

## `DELETE /api/auth/avatar`

**Auth**: session (self).

**Success**: `204` (idempotente se já não havia avatar).

**Errors**: `401`.

---

## `GET /api/accounts/{account_id}/avatar`

**Auth**: session (qualquer conta autenticada).

**Success**: `200`, body = bytes da imagem, `Content-Type` = tipo guardado.

**Errors**:

| Status | When |
|--------|------|
| `401` | Sem sessão |
| `404` | Conta inexistente **ou** sem avatar |

---

## `PUT /api/servers/{server_id}/image`

**Auth**: session; **must** be `owner_account_id`.

**Body**: raw image ≤ 1 MiB; MIME allowlist.

**Success**: `204` or `200` + server projection (`has_image: true`).

**Errors**:

| Status | When |
|--------|------|
| `400` | Tipo/tamanho inválido |
| `401` | Sem sessão |
| `403` | Não é dono |
| `404` | Servidor inexistente |

---

## `DELETE /api/servers/{server_id}/image`

**Auth**: session; must be owner.

**Success**: `204` (idempotente).

**Errors**: `401`, `403`, `404`.

---

## `GET /api/servers/{server_id}/image`

**Auth**: session; **must** be member of the server.

**Success**: `200` + image bytes + `Content-Type`.

**Errors**: `401`, `403` (não membro), `404` (sem imagem ou servidor inexistente).

---

## List projections (extended)

### `GET /api/auth/me` (and login/register account payloads)

```json
{
  "id": "...",
  "handle": "...",
  "is_initial_operator": false,
  "has_avatar": true
}
```

### `GET /api/servers/{id}/members` item

```json
{
  "account_id": "...",
  "handle": "...",
  "identity_pubkey": "...",
  "has_avatar": true
}
```

### `GET /api/servers` item

```json
{
  "id": "...",
  "name": "...",
  "owner_account_id": "...",
  "has_image": true
}
```

---

## Contract tests (minimum)

1. PUT avatar ≤1 MiB JPEG → 2xx; GET avatar → 200 + image Content-Type.
2. PUT body `1 MiB + 1` → 400; estado anterior intacto se já existia.
3. PUT `image/gif` ou `application/octet-stream` sem tipo permitido → 400.
4. DELETE avatar → GET 404; `has_avatar` false no me.
5. PUT server image como dono → GET image 200; membro vê `has_image` true.
6. PUT server image como não-dono → 403.
7. GET server image como não-membro → 403.
