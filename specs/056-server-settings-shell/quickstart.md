# Quickstart: 056-server-settings-shell

## Prerequisites

- Frontend + backend running (`npm run dev`, `cargo run`).
- Account A = server **owner**; Account B = member with role **can_manage_roles**; Account C = plain member.

## A — Gear + placeholder (owner)

1. As A, select server in normal channel view.
2. Click **gear** next to server header.
3. **Expect**: Sidebar shows grouped settings (Pessoas / Funções / Servidor); main shows placeholder (not chat); no auto-opened page.
4. Click server **name** from channel view again after exiting: same as gear.

## B — Navigate items

1. In settings, open **Membros** → members page in main; settings nav stays.
2. Open **Perfis** → roles **page** (not modal over chat).
3. Open a role’s permissions → permissions page; settings nav stays.
4. Open **Imagem do servidor** → can upload/remove.
5. Open **Apagar servidor** → confirm UI present (do not delete yet unless disposable server).

## C — TopBar X

1. From any settings child, click **X** in topbar (icon only, aria-labelled).
2. **Expect**: Channel sidebar (Texto/Voz) restored; main is channel/stage again — not settings.

## D — Permissions

1. As B: gear visible; see Membros + Perfis; **no** Imagem/Apagar.
2. As C: **no** gear; name does not open settings.

## E — Rail + deep link

1. As A: rail context menu on server has **no** Imagem/Apagar.
2. Paste `/servers/<id>/members` while logged in → redirected/settings chrome with members + settings nav.
3. Refresh on `/servers/<id>/settings/roles` → still settings chrome.

## Validation commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

No new backend tests required for this feature.
