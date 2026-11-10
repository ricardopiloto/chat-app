# Design

## Context

Ver `proposal.md` — Why. Estado actual:

- Shell Electron em `frontend/electron/main.ts`: cria `BrowserWindow`, IPC `mesa:close` → `mainWindow.close()`, `window-all-closed` → `app.quit()` (excepto Darwin). Sem `Tray`/`Notification`.
- Preload expõe `mesaNative.close` e flag `__MESA_NATIVE__`.
- Notificações in-app: `notification.created` → `addNotice` e `message.new` noutro canal → `noteNews` em `frontend/src/shell/state.tsx`; painel em `NotificationsPanel.tsx`.
- Ícones oficiais em `frontend/electron/icons/` (PNGs + `.ico`).
- Change paralela `electron-custom-title-bar` também usa `mesa:close`; esta change redefine o significado de fechar a janela como hide.

## Goals / Non-Goals

**Goals:**
- Tray com Abrir/Fechar; X esconde; OS notifications só sem foco; clique OS = foco.
- Reutilizar marca Mesa nos ícones de tray/notificação.

**Non-Goals:**
- Deep-link a partir da notificação OS.
- Preferências “desligar notificações OS” / DND (pode vir depois).
- Tray no build web.
- Badge de contagem no ícone da dock/taskbar (fora de escopo nesta ronda).
- Alterar o modelo de dados ou API REST de notificações.

## Decisions

### D1. Hide-on-close no main process

Interceptar `close` da janela principal: se não for quit explícito, `event.preventDefault()` + `win.hide()`. Flag `isQuitting` (ou `app.isQuitting`) definida só pelo item Fechar da tray / `before-quit` intencional. `mesa:close` e o botão X passam pelo mesmo caminho (hide). Em Darwin, alinhar com tray: não sair em `window-all-closed` enquanto a tray existir; Abrir no `activate` se não houver janela visível.

### D2. Tray no main, menu mínimo

`Tray` + `Menu` com `Abrir` (`show` + `focus` + `setSkipTaskbar(false)` se aplicável) e `Fechar` (`isQuitting = true; app.quit()`). Ícone: PNG adequado por plataforma a partir de `electron/icons` (ex. 16/24/32). Clique simples no ícone: Abrir onde a plataforma o permite (Windows/Linux); no macOS o menu na menu bar é o padrão.

### D3. Notificações OS via main + IPC do renderer

O renderer já sabe quando cria uma notificação in-app. Expor `mesaNative.notifyOs({ title, body, id? })` (preload → `ipcMain`). O main:

1. Ignora se a janela principal tem foco (`isFocused()` / não visível conta como sem foco — D4).
2. Caso contrário, cria `new Notification({ title, body, icon })` (Electron) e em `click` chama a mesma rotina de Abrir (só foco).

Alternativa rejeitada: só `new window.Notification` no renderer — funciona em alguns casos, mas o main controla melhor hide/foco e consistência com tray. Alternativa rejeitada: main a escutar WebSocket — duplicaria auth/realtime.

Hook (só eventos **live**, nunca `loadNotices` no boot):

- Após `addNotice` (menção/resposta): sempre candidata a `notifyOs` (sujeita ao gate de foco no main).
- Após `noteNews` (novidade de canal): **coalesce** — no máximo **uma** notificação OS por `channelId` enquanto a janela principal permanecer sem foco; ao recuperar foco/mostrar a janela, limpar o conjunto de canais já anunciados. Assim o painel in-app continua a agregar `count`, sem um toast nativo por cada `message.new`.

### D3b. Título e corpo no renderer

O payload REST/realtime (`kind`, ids) **não** traz copy legível. O renderer monta `title`/`body` com i18n + dados já em cache (membro/canal quando existirem); se o lookup falhar, usar strings genéricas (ex. “Nova menção”, “Actividade noutro canal”). O main **não** interpreta negócio — só apresenta o que o renderer envia.

### D4. Foco = janela principal

“Tem foco” refere-se à `BrowserWindow` principal (não popouts de chamada). Se a principal está hidden, trata-se como sem foco → OS notification permitida.

### D5. Coordenação com title bar custom

Não depende de chrome nativo vs custom: qualquer caminho que feche a janela principal usa hide; só Fechar na tray faz quit. Documentar na task de `mesa:close`.

## Risks / Trade-offs

- [Utilizador espera que X saia] → Mitigação: menu tray Fechar explícito; documentação/changelog.
- [Linux: tray depende de ambiente (AppIndicator)] → Mitigação: testar empacotado; fallback documentar se o DE não mostrar tray.
- [Spam de OS notifications em canais ruidosos] → Mitigação: só sem foco + coalesce de `noteNews` por canal (D3); deep-link/filtros/DND de canal fora de escopo (hoje o “silenciar” do produto é silenciar *membro*, não preferência de notificação do utilizador).
- [Permissão de notificações no SO] → Mitigação: falha silenciosa / log; in-app continua.

## Migration Plan

1. Implementar tray + hide-on-close no main; ajustar `window-all-closed`/`activate`.
2. IPC `notifyOs` + hooks no renderer; validar com janela unfocused.
3. Smoke Windows/macOS/Linux empacotado ou `electron .` em dev.
4. Rollback: remover tray handlers e restaurar `close` → destroy/quit.

## Open Questions

Nenhum bloqueante; textos Abrir/Fechar/i18n da tray (main process) — strings fixas pt/en por locale do SO ou pt-BR por omissão, decisão na implementação das tasks.
