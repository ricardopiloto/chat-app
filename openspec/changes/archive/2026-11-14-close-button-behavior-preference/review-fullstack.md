# Review — Desenvolvedor Fullstack

**Change:** close-button-behavior-preference
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Sem backend/API envolvida.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei que `frontend/src/pages/Account.tsx` já tem exactamente o padrão de UI que a tarefa 2.2 precisa: a secção "appearance" (`:294-314`) usa `<Card icon=... label=... title=...>` com um `<Segmented>` de 2-3 opções (idioma, tema) — a nova escolha "esconder na tray" vs. "fechar" encaixa directamente nesse mesmo componente, sem UI nova a desenhar.
- Confirmei também que `mesa:close` (`main.ts:396-411`, `ipcMain.handle("mesa:close", (event) => senderWindow(event)?.close())`) só chama `BrowserWindow.close()` — ou seja, tanto o botão nativo X quanto o IPC `mesa:close` acabam no mesmo evento `close` nativo, tratado por `attachMainWindowLifecycle`. A change só precisa de alterar esse único handler, não duplicar lógica para dois caminhos — boa notícia de viabilidade que o design já assume correctamente.

## 3. Deploy e operação

Veredito: OK

- Sem infraestrutura nova. Nota menor: ao falhar a escrita de `mesa-app-settings.json`, vale um `console.warn` no mesmo estilo já usado noutros pontos de `main.ts`, para que a equipa veja isso em `--trace-warnings`/logs do empacotado sem precisar reproduzir manualmente.

## 4. Qualidade de código

Veredito: Atenção

- **Achado (o detalhe que decide se isto funciona):** confirmei o precedente de diálogo citado no design (`main.ts:453-454`, `dialog.showMessageBox(window, {...})`) — ele é chamado dentro de um fluxo assíncrono (`runPackagedLegacyCleanup`) que não tem a restrição que o handler `close` tem. O evento `close` do Electron (`win.on("close", (event) => {...})`) é **síncrono**: `event.preventDefault()` só impede o fecho se for chamado antes do handler terminar, mesmo que a decisão final (esconder vs. sair) só chegue depois, de forma assíncrona, quando o diálogo resolver. Ou seja, o handler, no estado indeterminado, precisa de uma forma como:
  ```js
  win.on("close", (event) => {
    if (isQuitting) return;
    if (closeBehavior === "quit") { isQuitting = true; app.quit(); return; }
    if (closeBehavior === "tray") { event.preventDefault(); win.hide(); return; }
    event.preventDefault(); // tem de correr já, antes do diálogo assíncrono
    if (closePromptPending) return;
    closePromptPending = true;
    void dialog.showMessageBox(win, { /* ... */ }).then((result) => { /* persistir e então hide() ou isQuitting=true+app.quit() */ closePromptPending = false; });
  });
  ```
  `design.md` (D2) não erra em nada do que diz, mas não nomeia esta ordenação (prevenir sempre e já, decidir depois) como a regra central — é fácil escrever uma versão em que o `preventDefault()` só é chamado depois de inspeccionar o resultado do diálogo, o que não tem efeito nenhum porque o evento já passou. Recomendo que a tarefa 1.2 cite esta ordenação explicitamente, não só "Update attachMainWindowLifecycle with the first-close native dialog".
- Fora isso, o padrão de leitura/escrita validada que a tarefa 1.1 pede replica fielmente `readInstance`/`writeInstance` (`main.ts:267-283`) — não existe um helper genérico de JSON a reaproveitar neste projeto, então duplicar a forma (não o conteúdo) desse par de funções é a escolha consistente com o que já existe, não uma repetição evitável.

## 5. Execução das decisões arquiteturais

Veredito: OK

- A tarefa 1.3 já nomeia explicitamente a coordenação com `fix-stale-background-call-blocks-rejoin` no mesmo bloco de `main.ts` — boa prática já presente, evita que esta revisão precise de repetir esse achado.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Confirmo e dou forma concreta ao achado do Arquiteto sobre D2: a garantia de ordenação (`preventDefault` síncrono, decisão assíncrona depois) é o detalhe que faz ou desfaz esta change, e vale estar escrita no `design.md`, não só inferível a partir da API do Electron.
