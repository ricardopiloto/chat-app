# Contract: Presence roster panel

**Feature**: 052-members-role-assignment  
**Surface**: `.members-panel` (channel chrome «Membros»)

## Presence API

`GET /api/servers/{serverId}/presence`

Auth: server member.

```json
{ "online_account_ids": ["…", "…"] }
```

Optional WS event `presence` / `presence.changed` with same payload shape (or delta) so the panel updates without full reload.

**Online rule**: account id present in server members **and** connected in `WsHub`.

## Roster layout

```text
Membros
├── Online
│   ├── {Role name}
│   │   └── member rows…
│   └── Sem papel
│       └── …
└── Offline
    ├── {Role name}
    └── Sem papel
```

| Rule | Detail |
|------|--------|
| Order | Online section first, then Offline |
| Grouping | Within each status, group by the member’s **single** role |
| No assign | No role-assignment controls in this panel |
| Kick | May remain for authorized actors (unchanged product rule) |

## Acceptance probes

1. Two browsers same server: A connected → A under Online; B logged out → Offline.
2. Member with role R appears under R inside the correct status section.
3. Member without role under «Sem papel».
