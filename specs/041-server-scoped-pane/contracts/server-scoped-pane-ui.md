# Contract: Server-scoped main pane UI

**Feature**: [041-server-scoped-pane](../spec.md)  
**Related**: [data-model.md](../data-model.md), [research.md](../research.md)

## No new HTTP/WS APIs

Uses existing `GET /api/servers/:id/channels` and `GET /api/channels/:id`.

## Server selection → navigation

When the user selects server `S` on the server rail:

| Channels on S | Required navigation |
|---------------|---------------------|
| 0 | Main pane = empty server view for `S` (route e.g. `/servers/:serverId`) |
| ≥1 | Main pane = `resolveChannel(S)` — never remain on a channel whose `server_id ≠ S` |

### `resolveChannel(S, channels)`

1. `last = readLastChannel(S)` if present in `channels`  
2. Else first `type === "text"`  
3. Else `channels[0]`  

Navigate to `/channels/:id?server=S&type=…`.

## Last channel preference

- Persist `serverId → channelId` in browser `localStorage`.  
- Update whenever a channel page for that server is successfully shown.  
- Survive full page reload (FR-009).

## Empty server view

- Neutral blank main area (no message list, no voice stage, no foreign channel header).  
- Exactly one joke string visible, from curated ≥3 PT-BR list, random per visit/mount.  
- MUST NOT use the «Canal não encontrado» copy as the empty-server experience.

## Voice session

Selecting another server MUST NOT by itself hang up an active call on a previous server; only the main pane context changes (FR-008).

## Manual contract checks

1. A→B both with channels: pane shows B’s channel 10/10  
2. B with 0 channels: blank + joke (not «não encontrado»)  
3. Visit X on B → A → B: reopens X  
4. Visit X on B → reload → select B: reopens X  
5. In call on A, select B: pane is B; call may continue (PiP/bar)  
