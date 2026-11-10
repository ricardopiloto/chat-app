# Tasks

## 1. Electron main: tray e ciclo de vida

- [x] 1.1 Em `frontend/electron/main.ts` (ou módulo dedicado importado por ele), criar `Tray` com ícone da marca em `frontend/electron/icons/`, menu **Abrir** / **Fechar**, e clique no ícone a chamar Abrir onde a plataforma o permitir (Decisões D1–D2). Manter referência de módulo à `BrowserWindow` principal para tray/`activate`/notify. Verificar: em `electron`/build desktop o ícone aparece na bandeja com exactamente essas duas entradas de produto.
- [x] 1.2 Implementar hide-on-close: `close` da janela principal com `preventDefault` + `hide` salvo `isQuitting`; `mesa:close` e o X usam esse caminho; Fechar na tray define quit e chama `app.quit()`; ajustar `window-all-closed` / `activate` para não sair só porque a janela foi escondida (D1/D5). Verificar: fechar a janela esconde e a tray permanece; Abrir restaura foco; Fechar na tray termina o processo.
- [x] 1.3 Expor IPC `mesa:notify-os` (nome final alinhado ao preload) que, se a janela principal **não** estiver focused (hidden/minimizada = sem foco), mostra `Notification` do Electron e no `click` só executa Abrir (D3/D4). Verificar: com janela em foco o handler não mostra OS toast; sem foco mostra; clique foca a app sem navegar.

## 2. Preload e renderer

- [x] 2.1 Em `frontend/electron/preload.ts` (e tipos do renderer se existirem), expor `mesaNative.notifyOs({ title, body })` (e tipagem). Verificar: `tsc` do electron/preload e do frontend passa.
- [x] 2.2 Após `addNotice` / `noteNews` em eventos **live** apenas (não `loadNotices`): se `__MESA_NATIVE__`, montar `title`/`body` com i18n + cache de membro/canal (fallback genérico — D3b); para `noteNews`, coalescer no máximo uma OS notification por `channelId` enquanto unfocused e limpar o conjunto ao recuperar foco (D3). Verificar: menção unfocused → in-app + OS; várias msgs no mesmo canal unfocused → uma OS; com foco → só in-app; reopen da app com unread → sem rajada OS.
- [x] 2.3 Garantir que o build web não quebra (guards em `mesaNative` / `__MESA_NATIVE__`). Verificar: `npx tsc --noEmit` no frontend; smoke web sem erros de `mesaNative` undefined.

## 3. Integração manual

- [x] 3.1 Smoke desktop: esconder → Abrir → Fechar na tray; notificação OS só sem foco; clique OS só foca; várias msgs no mesmo canal → uma OS. Verificar manualmente nas plataformas disponíveis no ambiente de desenvolvimento (pelo menos uma).
