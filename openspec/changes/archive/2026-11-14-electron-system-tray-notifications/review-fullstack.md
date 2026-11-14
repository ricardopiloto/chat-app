# Review — Desenvolvedor Fullstack

**Change:** electron-system-tray-notifications
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Sem alterações de API/DB; notificações continuam a vir do realtime/REST já existentes.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Tray/hide-on-close em `main.ts` é implementável com o código actual (`mesa:close` → `mainWindow.close()` em ~285; `createWindow` ~234; `window-all-closed` ~576). Tarefas 1.1–1.2 cobrem o essencial; falta nomear explicitamente: referência estável à `BrowserWindow` principal (variável de módulo) para tray/Notification/`activate` — hoje a janela é local a `whenReady`.
- **Título/corpo OS:** `addNotice` recebe `Notification` sem texto de UI (`kind`, `actor_account_id`, `channel_id`, … — `frontend/src/api/types.ts` ~258). `noteNews` só tem ids + count. O painel resolve nomes noutro sítio. Tarefa 2.2 diz “derivados do payload” sem dizer *como* — o implementador precisa de templates i18n (ex. “Menção de @x”, “Novidade em #canal”) + lookup em cache de membros/canais, ou strings genéricas. Recomendação: acrescentar à 2.2 “montar title/body com i18n + dados já em cache; fallback genérico se o lookup falhar”.
- **Coalesce de `noteNews`:** cada mensagem noutro canal chama `noteNews` (`state.tsx` ~162). Hook ingénuo = N toasts OS. Convergente com o Arquitecto: a task 2.2 deve limitar novidade de canal (1 OS por canal enquanto unfocused, ou só `addNotice` nesta ronda). Preferência de implementação: coalescing por `channelId` até `focus`/`show`.
- **Não notificar no boot:** `loadNotices()` não deve chamar `notifyOs` — só eventos live. Design já fala em “quando chega”; reforçar na 2.2.
- Preload tipado + guard web (2.1/2.3): padrão `__MESA_NATIVE__` já existe — OK.
- Popouts de chamada: D4 correcto (só janela principal); confirmar que `notify-os` não usa `getFocusedWindow()` de um popout como “app em foco” se a principal estiver hidden — usar a ref da main + `isFocused()`/`isVisible()`.

## 3. Deploy e operação

Veredito: Atenção

- Sem env/serviço novos. Empacotamento Electron existente basta.
- Linux: tray/Notification dependem do DE (AppIndicator/libnotify) — design já avisa; smoke 3.1 “pelo menos uma plataforma” é fraco se o CI/dev for só uma OS. Aceitável para esta ronda; documentar no changelog se Linux for best-effort.
- Permissões de notificação no SO: falha silenciosa já no design — OK.

## 4. Qualidade de código

Veredito: OK

- Tasks com verificação observável; smoke manual adequado (sem harness E2E Electron no repo).
- Sugestão menor: extrair `tray.ts` / `osNotify.ts` do `main.ts` monólito para não crescer o ficheiro — opcional, não exigido pelo design.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Tasks seguem D1–D5 sem reabrir deep-link ou DND.
- Coordenação com title bar custom via `mesa:close` está reflectida na 1.2.

## Bloqueantes antes de implementar

- Nenhum.

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma pendente após follow-up.

## Follow-up (2026-11-10)

- Coalesce por `channelId` + title/body i18n/cache na task 2.2; ref estável à main window na 1.1.
- Nota de produto: “silenciar canal” para o *próprio* utilizador (suprimir alerts) **não** existe hoje — o mute actual é silenciar *membro* (impedir escrever/falar).
