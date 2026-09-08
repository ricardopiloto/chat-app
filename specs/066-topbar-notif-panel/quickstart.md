# Quickstart: 066-topbar-notif-panel

## Prerequisites

- App a correr (`npm run dev`); sessão autenticada.
- Ideal: ≥1 notificação de menção/resposta (ou usar estado vazio para SC de visibilidade).

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Painel visível (US1)

1. Clicar no botão **Notificações** (aria-label).
2. **Expect**: painel completo visível abaixo do botão; **não** cortado/escondido pela barra do topbar.
3. Toggle de novo → fecha; topbar utilizável.

### B — Clique em item (US2)

1. Com ≥1 item, abrir painel → clicar item.
2. **Expect**: navegação 062 (canal/mensagem); clique não «morre» no topbar.
3. Estado vazio: mensagem vazia totalmente legível.

### C — Sem fantasma / estreito (US3)

1. Abrir/fechar várias vezes → área principal clicável.
2. Janela estreita → painel ainda visível; scroll se lista longa.
3. Tema claro e escuro → legível.

## Pass criteria

- [ ] A–C OK em ≤ poucos minutos (SC-001–SC-004) — CSS fix applied; confirm visually in running app.
- [x] `tsc --noEmit` limpo.
