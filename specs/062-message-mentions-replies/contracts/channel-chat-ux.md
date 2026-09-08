# Contract: Channel text UX (highlight, scroll, jump)

**Feature**: 062-message-mentions-replies  
**Surface**: `frontend/src/pages/Channel.tsx` (+ CSS)

## Personal highlight

- Class e.g. `.msg-highlight-me` when message mentions me **or** replies to my message **and** message id not in local “seen highlights”
- Clear highlight when row intersects viewport (threshold ~0.5); persist id locally
- Distinct from generic `@` styling in decrypted text (optional bold handle)

## Reply control

- Hover/focus toolbar on message: **Responder** icon
- Composer shows reply preview (author handle + short plaintext snippet if key available); cancel clears `reply_to`
- Sent message renders parent quote block (load parent from list cache or fetch)

## Stick-to-bottom & jump chip

- Default: stick to bottom on open / own send / new message while stuck
- User scroll up → unstick
- New message while unstuck → increment pending; show **floating** chip above `.composer` (positioned with gap; `pointer-events` ok; does not expand layout / does not touch composer edge)
- Chip copy PT: «Novas mensagens» or «Saltar para o presente»
- No chip if unstuck and pending=0
- Click chip → scroll to latest, pending=0, stick again
- Manual return to bottom clears chip

## Deep-link

- Support `?msg=` (or hash) on channel route: scroll into view + brief flash; if missing → indisponível banner
