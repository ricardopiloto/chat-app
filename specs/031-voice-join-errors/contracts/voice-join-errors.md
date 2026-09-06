# Contract: Voice join errors (UI + abort)

**Feature**: [031-voice-join-errors](../spec.md)  
**Related**: [data-model.md](../data-model.md), occupancy leave [028](../../028-voice-call-roster/)

## Existing APIs (unchanged semantics)

| Call | Role in 031 |
|------|-------------|
| `POST /api/channels/{id}/voice/join` | May run before LiveKit; creates occupancy |
| `POST /api/channels/{id}/voice/leave` | **Required** on abort if join already succeeded |
| WS `voice.occupancy` | Others see flash then absence ≤5 s |

No new endpoints.

## Frontend abort contract

After any failed join attempt that may have acquired media and/or called join:

1. Stop all local capture tracks from that attempt (audio + video + blur pipeline).
2. If join API succeeded for `channelId`: `POST .../voice/leave` (best-effort; ignore secondary errors).
3. Do not call `bindLive` / do not set session `live`.
4. Surface categorized PT error (or camera warning if soft-fail).

## Error categories (UI copy — illustrative)

| Category | Example PT message |
|----------|-------------------|
| `permission` | «Precisas de permitir o microfone para entrar na chamada.» |
| `device` | «Não foi possível usar o microfone ou a câmera (dispositivo em falta ou ocupado).» |
| `connection` | «Não foi possível ligar à sala. Tenta de novo.» |
| `generic` | «Não foi possível entrar na chamada. Tenta de novo.» |

Camera-only soft failure (join continues): same categories, framed as aviso de câmera (ex. «Câmera indisponível — entraste só com áudio.»).

## Success outcomes

| Outcome | Occupancy | `live` UI | Camera |
|---------|-----------|-----------|--------|
| Full success | yes | yes | on if obtained |
| Success cam off | yes | yes | off + warning |
| Failed join | no (after leave) | no | tracks stopped |

## Test checklist (contract)

1. Deny mic permission → error `permission`; no occupancy; retry CTA works.
2. Join API ok + LiveKit fail (simulate) → leave called; other client sees user gone ≤5 s; tracks stopped.
3. Audio ok + camera fail → connected, cam off, camera warning; occupancy present.
4. Happy path unchanged: connected + occupancy.
