# Tasks

## 1. Ponte IPC (processo principal + preload)

- [x] 1.1 Em `frontend/electron/main.ts`, na janela principal (`createWindow`, por volta da linha 236): remover o comentário "Native window decorations are the default; do not set frame: false." e aplicar, por plataforma: `titleBarStyle: 'hidden'` + `titleBarOverlay` (Windows), `titleBarStyle: 'hidden'` + `trafficLightPosition` (macOS), `frame: false` (Linux).
- [x] 1.2 Expor `minimize()`, `toggleMaximize()` e `close()` da janela principal via `ipcMain.handle` + `preload.cjs` (`ipcRenderer.invoke`). Confirmar que a mesma convenção de nomeação dos outros canais já existentes em `main.ts`/`preload.cjs` é seguida.
- [x] 1.3 Reencaminhar os eventos `maximize`/`unmaximize` da janela principal para o renderer (mesmo padrão já usado para `mesa:update-state`), para o botão de maximizar/restaurar mostrar o ícone certo no Linux.
- [x] 1.4 Confirmar que o diálogo de partilha de ecrã (`pickScreenSource`) e a janela de popout de chamada continuam sem `frame`/`titleBarStyle` definidos (decoração nativa inalterada).

## 2. Componente de UI da barra de título

- [x] 2.1 Criar `frontend/src/shell/TitleBar.tsx`: faixa fina, `-webkit-app-region: drag` na área vazia, `-webkit-app-region: no-drag` nos botões; no Linux desenha os três controlos (minimizar/maximizar-restaurar/fechar) chamando a ponte IPC da secção 1; no Windows/macOS não desenha controlos próprios (vêm do overlay/semáforos nativo), só a área de arraste e o conteúdo à esquerda dela (ícone/nome da app, por decidir no visual).
- [x] 2.2 Em `frontend/src/index.tsx`, envolver o `<Switch>` dentro de `Gate()` com `<TitleBar>` quando `isNative()` for verdadeiro e o destino não for `call-popout` (ver `design.md`, D1). Confirmar que o build web (`isNative()` falso) não renderiza nem carrega nada deste componente.
- [x] 2.3 Usar só classes/tokens já existentes (`frontend/src/tokens.css`, `frontend/src/components/ui/`) para o estilo da faixa — **não alterar** `tokens.css`, `tailwind.config.ts`, `components/ui.css` nem `components/ui/` (guard de `frontend/scripts/verify-entry-screens.mjs`, requisito de `frontend-v2/entry-screens`).
- [x] 2.4 Detectar a plataforma (Windows/macOS/Linux) no renderer (via IPC ou `navigator.userAgentData`/equivalente já usado no projeto, a confirmar) para decidir que variante de `TitleBar` desenhar.

## 3. Verificação manual (três plataformas; Linux primeiro)

- [x] 3.1 **Linux** (ambiente de desenvolvimento actual): abrir a app empacotada ou em `npm run electron:dev`; confirmar arrastar a janela pela faixa, redimensionar pelos limites, maximizar/restaurar pelo botão próprio e por duplo-clique na faixa, fechar pelo botão próprio, e qualquer gesto de encaixe do gestor de janelas em uso. Registar aqui o resultado real (passou / o que falhou) antes de prosseguir — é o requisito mais arriscado desta change (ver `design.md`, Risks).
- [ ] 3.2 **Windows**: confirmar que `titleBarOverlay` mostra os botões nativos de minimizar/maximizar/fechar na faixa, que o snap/Aero nativo (arrastar para a margem do ecrã) continua a funcionar, e que o ícone de maximizar muda para restaurar correctamente.
- [ ] 3.3 **macOS**: confirmar que os "semáforos" nativos aparecem na posição esperada dentro da faixa (`trafficLightPosition`) e que continuam a minimizar/maximizar/fechar como seria nativo.
- [ ] 3.4 Confirmar, nas três plataformas, que os ecrãs `auth`, `unlock`, `home-desktop`, `loading` e `app` mostram a faixa (não só o `app`), e que `call-popout` e os diálogos (partilha de ecrã) continuam com decoração nativa, sem a faixa.
- [ ] 3.5 Confirmar que o build web (`npm run build` / `npm run dev` fora do Electron) não mostra a faixa nem carrega o componente `TitleBar`.

## 4. Revisão

- [ ] 4.1 Revisão dupla dos artefactos e, depois de implementado, do código resultante (arquiteto + fullstack — skills `spec-review-architect` / `spec-review-fullstack`). Dar atenção especial a se a reversão do requisito de `desktop/shell` ficou bem justificada e ao risco do Linux.
- [ ] 4.2 `openspec validate electron-custom-title-bar --strict`.
