# Quickstart: 071-notif-seen-collapse

## Prerequisites

- Backend + frontend running (local `cargo run` / `npm run dev`).
- Two accounts in a shared text channel (A mentioned/replied; B receives).

## A — Auto-clear durable on viewport

1. As B, ensure an unread **Menção** or **Resposta** exists (TopBar list shows it; dot on).
2. Open the channel **without** scrolling the target into view (or keep target below fold) → item **still** in list.
3. Scroll / deep-link so the message is clearly visible → item **disappears** without clicking the bell; after refresh, still gone (read persisted).

## B — Mentions full; session 5+

1. Generate **6+** session unreads in the **same** channel (send messages while B is on another channel).
2. Open Notificações as B → under «Canais com mensagens novas» see **one** **5+** row for that channel (no 6 individual session lines).
3. With **6+** durable mentions/replies in one channel → **all** durable rows still listed under «Menções e respostas» (no 5+ on that section).

## C — Clique 5+ → oldest unread

1. With a channel in 5+ session state, click the 5+ row → land on channel with `?msg=` = **oldest** session unread message for that channel.

## D — Limpar

1. With durables and/or session items, open panel → **Limpar** visible.
2. Click Limpar → both sections empty; dot off; reload → durables stay cleared.

## E — Sino maior + badge binário

1. Visual: bell larger than pre-change (~24 vs 20); dot only (no number) when pending.

## Commands

```bash
cd frontend && npx tsc --noEmit
# optional: cargo test filter for notifications mark-all if contract test added
```

## Pass criteria

Scenarios A–E match [spec.md](./spec.md) success criteria SC-001–SC-010 / clarifications.
