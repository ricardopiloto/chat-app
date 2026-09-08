# Quickstart: 068-notif-channel-datetime

**Contract**: [notif-list-labels](./contracts/notif-list-labels.md)

## Prerequisites

- App running; ≥2 users; ability to create mention/reply notifications (062).
- Optional: leave a channel with unseen activity for session section.

## A — Durable: name + when (today)

1. As Bob, receive a mention/reply **today**.
2. Open TopBar **Notificações**.

**Expect**: Item line shows **channel name** + **«Hoje HH:MM»** (local). No «Menção»/«Resposta», no `canal ab12…`.

## B — Yesterday / other day

1. (Or adjust system clock / use existing older notif if available.)
2. Confirm **«Ontem HH:MM»** or **«DD mmm HH:MM»** as appropriate.

## C — One line

1. Inspect durable item layout.

**Expect**: Name and time on the **same** line; time may be quieter visually.

## D — Click still works

1. Click a durable item.

**Expect**: Navigate to channel (+ message when linked); mark read as before; panel closes.

## E — Session unseen: name only

1. Ensure session unseen channel list is non-empty.
2. Open Notificações.

**Expect**: Session rows show **channel name**; **no** day/time; no UUID truncation style.

## F — Missing channel

1. If possible, notification pointing at deleted/inaccessible channel.

**Expect**: Short fallback (e.g. «Canal indisponível»), not a long UUID.

## Validation commands

```bash
cd frontend && npx tsc --noEmit
```

Manual A–F against `npm run dev`.
