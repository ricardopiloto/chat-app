# Data Model: 037-discord-visual-alignment

## Entities (runtime / persistence)

### TypographyToken (CSS)

| Field | Notes |
|-------|--------|
| family | `"Inter"` + system fallbacks |
| weights | 400 body, 500 UI, 600–700 headings |
| display | `swap` |

Não persistido — só tokens em `nocturne.css` + ficheiros de fonte.

### ElevationToken (CSS)

| Field | Notes |
|-------|--------|
| `--shadow-float` | Receita menu flutuante |
| theme | dark (`:root`) vs light (`[data-theme="light"]`) |

### ChannelReadState (SQLite — novo)

| Column | Type | Constraints |
|--------|------|-------------|
| account_id | TEXT UUID | PK composto, FK account |
| channel_id | TEXT UUID | PK composto, FK channel |
| last_read_at | TEXT | NOT NULL, timestamp comparável a `message.created_at` |
| updated_at | TEXT | NOT NULL |

**Uniqueness**: `(account_id, channel_id)`.

**Unread canal**: existe mensagem no canal com `created_at > last_read_at`, **ou** não existe linha e `COUNT(messages) > 0`.

**Unread servidor**: OR dos unread dos canais `type = text` (ou equivalente) desse `server_id`.

### ServerActivityFlags (API view — derivado)

| Field | Type | Source |
|-------|------|--------|
| server_id | UUID | server |
| has_unread | bool | aggregate ChannelReadState + messages |
| has_voice | bool | EXISTS voice_occupant em canais voice do server |

### CallControlVisualState (UI)

| State | Glyph | Chrome |
|-------|-------|--------|
| active (on) | filled on-variant | existente |
| inactive (off) | filled off-variant | existente |
| disabled | filled + muted/opacity | existente, não confundir com off |

### ServerRailIconVisual (UI)

| Signal | Forma | Coexistência |
|--------|-------|----------------|
| unread | pill/ponto presença (sem número) | sim com voice |
| voice | indicador distinto (cor/posição diferente) | sim com unread |
| hover/active | morph border-radius | independente dos badges |

## State transitions

### Read cursor

```text
[sem linha] --mark_read(ts)--> [last_read_at = ts]
[last_read_at = t0] --mark_read(t1≥t0)--> [last_read_at = t1]
[last_read_at = t0] --message.new (created_at > t0)--> has_unread = true (derivado)
abrir canal / ver mensagens --> mark_read(max visto) --> has_unread canal false
```

### Voice flag

```text
voice_occupant insert/heartbeat --> has_voice server true
último occupant leave/expire --> has_voice false
```

## Validation rules

- Mark-read só se membership no servidor do canal.
- `last_read_at` não deve regredir (ignore `ts < current` ou clamp).
- Pill unread: boolean only — nunca contagem nesta feature.
- Mensagens em canais voice não alimentam unread de texto.
- Own messages: ao enviar, mark-read implícito desse canal (recomendado, evita auto-unread).

## Relationships

```text
Account 1—* ChannelReadState *—1 Channel *—1 Server
Server 1—* Channel(voice) 1—* VoiceOccupant  => has_voice
```
