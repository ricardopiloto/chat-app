# Contract: Server rail activity UI

## Props / signals (FE)

`ServerRail` recebe por servidor (além do modelo actual):

| Field | Type | UI |
|-------|------|-----|
| `has_unread` | boolean | pill/ponto de presença (sem número), posição A |
| `has_voice` | boolean | indicador de voz distinto, posição B |

Quando ambos true: **ambos** renderizados.

## Interaction

- Hover/active: transição de forma (`border-radius`) suave; reduced-motion desliga.
- Unread some quando todos os canais de texto do servidor estão “em dia” (após mark-read).
- Voice some quando não há `voice_occupant` nesse servidor.

## Non-goals

- Badge de menções.
- Contagem numérica.
- Mudar ordem/estrutura geral da rail (criar servidor, etc.).
