# Data model: 030-voice-roster-avatars

Sem tabelas novas. Reutiliza `account.avatar_filename` (029) e `voice_occupant` (028).

## OccupantView (extensão)

Vista JSON da ocupação, não persistida.

| Campo | Significado |
|-------|-------------|
| `account_id` | Conta na mesa |
| `handle` | Identificador visível |
| `mic_on` / `cam_on` | Mídia (028) |
| `has_avatar` | **Novo.** `true` se `account.avatar_filename` não é null **neste instante** |

**Regras**

- Lista aninhada: só ocupantes com `mic_on OR cam_on` (inalterado).
- `has_avatar` **não** filtra a lista.
- Recalculado em cada snapshot REST e cada emissão `voice.occupancy` (join, leave, media, expiry, move).
- PUT/DELETE avatar **não** emite ocupação por si (FR-009).

## Text message group (vista FE)

Não é entidade de servidor.

| Campo (cliente) | Significado |
|-----------------|-------------|
| `sender` | `account_id` do grupo |
| `handle` | Do mapa de membros |
| `hasAvatar` | Do mapa de membros (`GET .../members`) no load do canal |

**Regras**

- Um ícone por grupo, não por linha de texto.
- Autor ausente do mapa: iniciais a partir do identificador visível (edge spec).

## User identity icon

Igual a 029: foto via `GET /api/accounts/{id}/avatar` se `has_avatar`/`hasAvatar`; senão iniciais. Recorte visual no círculo.

## Relacionamentos

```text
voice_occupant.account_id → account (JOIN só na vista)
account.avatar_filename → ficheiro em AVATARS_DIR (029)
Channel members map → IdentityAvatar nos grupos de texto
```

## Validação

- `has_avatar` booleano; omitir no JSON antigo seria `false` no cliente (`!!`).
- Não exigir bytes da imagem no payload de ocupação.

## Fora

- Coluna `has_avatar` em `voice_occupant`.
- Evento WS de identidade.
- Ocupação de canais de texto.
