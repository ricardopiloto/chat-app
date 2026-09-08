# Contract: Channel mute UI

**Feature**: 058-channel-mute-member

## Role permissions

- Toggle **Silenciar membros** on role permissions page (Geral).
- Owner does not need the toggle (always can).

## Members panel (channel context)

When a channel is active and actor may mute:

| Target state | Actions |
|--------------|---------|
| Not muted | **Silenciar** → choose 5 / 10 / 15 / 30 / custom minutes → confirm |
| Muted | Show remaining; **Levantar silêncio** |

Hidden for: self, server owner target, actor without permission.

## Kick copy

- Confirm: «Remover {handle} **do servidor**?» (or equivalent).
- Never «apagar conta».

## Composer (text channel)

When `/mutes/me` says muted:

- Input and send **disabled**
- Banner/helper: silenciado neste canal até {local ends_at}
- After expiry or unmute: re-enable (refetch)

Own message edit/delete controls remain available per normal rules.

## Acceptance probes

1. Cap holder opens member menu → Silenciar → presets work.
2. Muted user sees blocked composer with end time.
3. Levantar restores composer without reload of whole app.
4. Kick dialog wording check.
