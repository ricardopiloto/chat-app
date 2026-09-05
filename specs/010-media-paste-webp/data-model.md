# Data Model: 010-media-paste-webp

Sem novas tabelas. Reutiliza **MessageAttachment** da 009; altera só a política de tamanho e o fluxo de preparação no cliente.

## MessageAttachment (existente — política actualizada)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK |
| channel_id | UUID | FK |
| message_id | UUID? | null até bind |
| uploader_account_id | UUID | FK |
| content_type | TEXT | `image/jpeg\|png\|webp\|gif` — colagens estáticas → tipicamente `image/webp` |
| size_bytes | INTEGER | Tamanho do **ciphertext**; MUST ser ≤ **5 MiB** (`MAX_ATTACHMENT_BYTES`) |
| created_at | datetime | |

**File**: `{ATTACHMENTS_DIR}/{id}` — opaco (E2EE), inalterado.

### Validation (delta vs 009)

- `size_bytes` / body ciphertext ≤ **5 MiB** (antes 8 MiB).
- MIME allow-list inalterada.
- Max **10** attachments por mensagem — inalterado.

## PendingPasteAttachment (cliente, efémero)

Não persistido. Extensão conceptual do pending do composer:

| Field | Notes |
|-------|--------|
| localId | UUID cliente |
| file | `File`/`Blob` já no tipo final (WebP ou GIF animado) |
| previewUrl | object URL |
| source | `paste` \| `picker` (opcional; só para UX/debug) |

### Regras de preparação (colar)

```
clipboard image item
  → se GIF e animado → File(image/gif)
  → senão decode → canvas → WebP Blob → File(image/webp)
  → se size > 5 MiB → rejeitar
  → se pending.count ≥ 10 → rejeitar excedente
  → push pending
```

### State

Inalterado face à 009:

```
pending (UI) → upload ciphertext → linked on message create
```

## Policy entity (documental)

| Name | Value |
|------|--------|
| Max clear / ciphertext attachment | **5 MiB** |
| WebP quality (paste static) | **0.82** (constante FE) |
| Max attachments / message | 10 |
