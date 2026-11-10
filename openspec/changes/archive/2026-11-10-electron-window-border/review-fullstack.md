# Review — Desenvolvedor Fullstack

**Change:** electron-window-border  
**Data:** 2026-11-10  
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Sem API/DB. IPC maximize já emite no main (`registerWindowControlsIpc`); só o renderer precisa escutar em mais plataformas.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- `TitleBar` hoje é um fragmento `<>…</>` — para borda contínua em volta de title bar + conteúdo, a task 1.1 deve envolver num **wrapper** único (ou aplicar em `html`/`body` com `box-sizing: border-box` e altura 100%), não só no `header`.
- Listener `onWindowMaximizedChange` está **só em Linux** (`TitleBar.tsx`); D2/task 1.2 pedem todas as plataformas com chrome custom — estender o subscribe (win32/darwin) e sincronizar estado inicial se o IPC não enviar o valor actual no mount (pode precisar de um `isMaximized` one-shot ou assumir `false` até o primeiro evento).
- Cor: `outline-variant` pode ser fraco em nocturne sobre wallpaper preto; D1 já prevê `--mesa-window-edge` — validar nos dois temas na 2.1.
- Web: gate `__MESA_NATIVE__` / ausência de `TitleBar` já evita borda — OK.

## 3. Deploy e operação

Veredito: OK

- Só CSS/TS no cliente; AppImage/NSIS sem mudança de packaging. Smoke local basta.

## 4. Qualidade de código

Veredito: OK

- Tasks curtas com verify (web sem borda, maximize on/off, smoke tema escuro).
- Risco resize frameless Linux: smoke 2.1 deve incluir arrastar a borda da janela uma vez.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Tasks seguem D1–D3; não reabrem frame nativo.
- Limitação: se win32 ainda desenhar edge OS + CSS, pode parecer “dupla” — Risks já cobre; ajustar espessura/cor no apply se necessário.

## Bloqueantes antes de implementar

- Nenhum.

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma estrutural; só detalhe de implementação (wrapper vs fragment, maximize em win/mac).
