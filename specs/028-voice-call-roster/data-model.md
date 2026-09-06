# Data model: 028-voice-call-roster

## VoiceOccupant

Pessoa **na chamada** (mesa activa) de um canal `voice_video`.

| Campo | Significado |
|-------|-------------|
| `account_id` | Conta; **única** na tabela (uma mesa de cada vez) |
| `channel_id` | Canal de voz/vídeo |
| `server_id` | Denormalizado para fan-out WS / GET por servidor |
| `mic_on` | Microfone publicado / ligado |
| `cam_on` | Câmara publicada / ligada |
| `joined_at` | Instante em que esta pessoa entrou nesta mesa (não é o início da sessão) |
| `last_seen_at` | Heartbeat; expiry se stale |

**Regras**

- Insert no `POST .../voice/join` (se já existir noutro canal: tratar como **move** — apagar a linha antiga, libertar grade, depois insert).
- Delete no `POST .../voice/leave`, expiry, ou move para outro canal.
- `mic_on OR cam_on` ⇒ entra na **lista aninhada**; ambos false ⇒ na chamada mas **fora** da lista.
- Só membros do `server_id` lêem ocupação.

## Voice session (no `channel`)

| Campo | Significado |
|-------|-------------|
| `voice_session_started_at` | `NULL` se 0 ocupantes; senão instante do 0→1 |

**Transições**

```text
0 ocupantes, started_at NULL
  -- join --> 1+ ocupantes, started_at = now()
  -- leave último --> 0, started_at = NULL
```

Mídia on/off **não** altera `voice_session_started_at`.

## Nested roster (vista)

Derivado, não persistido:

- Por canal: ocupantes com `mic_on \|\| cam_on`, handle da `account`.
- Timer: se `voice_session_started_at` não nulo, duração = agora − esse instante.

## Relacionamentos

- `VoiceOccupant.channel_id` → `channel` (`type = voice_video`)
- `VoiceOccupant.account_id` → `account`
- Independente de `membership` excepto: o join já exige membro; o GET occupancy também.

## Validação

- Não duas linhas com o mesmo `account_id`.
- `channel` tem de ser `voice_video`.
- Heartbeat só do ocupante daquele canal.

## Fora

- Estado «online» na instância.
- Indicadores de a falar / anfitrião / AFK.
- Persistência da sessão LiveKit (só no browser).
