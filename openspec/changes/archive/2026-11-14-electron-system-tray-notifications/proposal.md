# Proposal

## Why

No cliente Electron, fechar a janela encerra (ou deixa o processo sem ponto de reentrada conveniente) e as notificações in-app só são úteis com a UI aberta e em foco. O utilizador precisa de um ícone na bandeja do sistema para manter a sessão viva, reabrir com foco, sair de forma explícita, e receber no SO as mesmas notificações que já vê na aplicação — mas só quando a janela não tem foco.

## What Changes

- Ícone na **system tray** (Windows/Linux/macOS) com o menu mínimo: **Abrir** (mostrar e dar foco à janela principal) e **Fechar** (sair da aplicação de verdade).
- **BREAKING (desktop):** o botão fechar da janela (X / `mesa:close`) **esconde** a janela para a tray em vez de terminar o processo; a app continua em execução até «Fechar» na tray (ou equivalente de saída explícita).
- Clique no ícone da tray (onde o SO o permite) comporta-se como Abrir (foco).
- **Notificações do sistema operativo** para os mesmos eventos que já alimentam o painel/in-app (ex. `notification.created` e avisos de canal com novidade já existentes), **somente quando a janela principal não tem foco** (incluindo escondida/minimizada).
- Clique numa notificação OS: **apenas** trazer a app para o foco — **sem** deep-link para canal/mensagem nesta ronda.
- Build web / browser: sem tray e sem `Notification` do SO via este mecanismo.

## Capabilities

### New Capabilities

- _(nenhuma)_

### Modified Capabilities

- `desktop/shell`: ciclo de vida da janela Electron com tray (esconder no fechar, Abrir/Fechar na bandeja, ícone de marca).
- `frontend-v2/search-and-notifications`: no shell nativo, espelhar as notificações in-app para o SO quando a janela não tem foco; clique na notificação OS só foca a app.

## Impact

- **Electron main** (`frontend/electron/main.ts`): `Tray`/`Menu`, `close` → hide, `app.quit` só via tray Fechar; possível `Notification` no main ou bridge IPC.
- **Preload / renderer**: API nativa para pedir notificação OS (ou main escuta estado de foco); hook nos pontos que já criam notificações in-app (`shell/state.tsx` / painel).
- **Ícones**: reutilizar `frontend/electron/icons/` (marca Mesa).
- Coordenação com `electron-custom-title-bar` (in-progress): o handler de fechar/`mesa:close` passa a esconder, independentemente do chrome nativo vs custom.
- Sem mudanças de API backend.
