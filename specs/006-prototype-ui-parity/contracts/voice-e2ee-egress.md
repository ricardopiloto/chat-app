# Contract: Voice E2EE toggle + Egress

## Channel fields (voice)

- `e2ee_enabled: boolean`
- `has_channel_key: boolean`
- Latest audit summary for banner (optional embed): `{ actor_handle, action, at }`

## POST `/api/channels/{id}/voice/e2ee`

```json
{ "enabled": false, "intent": "record" }
```

or `{ "enabled": true }` to religar (server records audit; **client** must already have re-enabled LiveKit E2EE with channel key before or immediately after).

- Auth: server **owner** (director).
- Requires `has_channel_key`.
- Writes `e2ee_audit_log`; WS `channel.e2ee_changed` `{ channel_id, e2ee_enabled, actor_account_id, at, intent? }`.
- **403** if no channel key / not owner.
- Disabling without successful egress start MUST be paired with client/server compensation (see research D7): prefer atomic “start recording” endpoint below.

## POST `/api/channels/{id}/egress/start`

- Auth: owner; requires `has_channel_key`.
- Sequence (server):
  1. Set `e2ee_enabled=0` + audit `disable` + WS
  2. Call LiveKit Egress if configured
  3. On egress failure: set `e2ee_enabled=1` + audit `enable` (system) + WS + return **503** `{ error: "egress_unavailable", message }`
  4. On success: return `{ recording_id, egress_id?, status: "active" }`

## POST `/api/channels/{id}/egress/stop`

- Auth: owner.
- Stop egress if any; leave E2EE state as-is until explicit religar (or stop implies stay off until Religar — **Decision**: stop recording keeps E2EE off until Religar, matching prototype “Parar gravação” then Religar).

## Client LiveKit

- On `e2ee_enabled` false: `setE2EEEnabled(false)`.
- On true: set channel key on key provider then `setE2EEEnabled(true)`.
- Legacy `has_channel_key=false`: hide/disable Gravar & Religar.
