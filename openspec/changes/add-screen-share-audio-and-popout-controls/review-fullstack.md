# Review — Desenvolvedor Fullstack

**Change:** add-screen-share-audio-and-popout-controls
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Reconfirmado por grep agora: ainda não existe `active_screen_shares`, endpoints de screen-share nem eventos `voice.screen_share_changed`/`channel.layout_changed` no backend. `proposal.md` continua correto ao declarar "No backend or LiveKit protocol change is proposed"; nenhuma task toca `backend/`.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Decisões do Arquiteto (`review-architect.md`, 2026-11-16) confirmadas como implementáveis**: (A) sempre mostrar a escolha de áudio e deixar a publicação real decidir o estado exibido — isto já é exatamente o que `call.screen()`/`call.setScreen(on)` em `CallControls.tsx:118-133` e o padrão `derive from local publications` de D1 suportam, nenhuma mudança de forma necessária. (B) elegibilidade do popout = `canSpeak()`, sem escolha de áudio no popout — reduz o escopo de `CallPopoutWindow.tsx`/`env.d.ts`/`preload.ts`/`main.ts` a um único campo booleano `setScreen`/`screen`, sem campo de áudio adicional no IPC — mais simples de implementar e de validar do que a redação anterior de D2 deixava em aberto.
- **Achado concreto de padrão de UI (reli `CallControls.tsx:85-116` agora)**: o ficheiro já tem o precedente exato para a Decisão A — o botão de blur de câmara abre um menu secundário (`aria-haspopup="menu"`, `<div class="call-menu" role="menu">`, itens `role="menuitemradio"` com `aria-checked`). Recomendo a task 3.1 apontar explicitamente para reaproveitar essa mesma estrutura (`call-menu`) para a escolha de áudio junto ao botão de partilha de ecrã (`CallControls.tsx:118-133`), em vez de inventar um padrão novo de UI para uma escolha binária simples (áudio on/off ao iniciar).
- `CallPopoutWindow.tsx:15-96` tem o padrão `owner()?.x` + `send({...})` replicável para o novo botão de ecrã (confirmado de novo); como a Decisão B remove a escolha de áudio do popout, a task 4.3 fica mais simples do que a redação original fazia parecer — só um botão on/off, sem segundo controlo.
- `frontend/src/i18n/catalogs/voice.en.ts` e `voice.pt-BR.ts` existem e são os ficheiros certos citados na task 3.1.

## 3. Deploy e operação

Veredito: Atenção

- N/A para infraestrutura: sem porta, variável de ambiente ou serviço novo.
- **Achado operacional (reconfirmado, ainda não escrito no `tasks.md`)**: alterações em `frontend/electron/main.ts`/`preload.ts` (tasks 2.2 e 4.1) só são recarregadas reiniciando o processo Electron por completo — o reload do Vite não alcança o processo principal. Ainda não há nota sobre isto em `tasks.md` secção 5. Recomendação mantida: acrescentar essa nota explícita antes de implementar, para não repetir um ciclo de diagnóstico perdido.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` já embute verificação por task, incluindo caminhos de cancelamento/rejeição de permissão (task 2.1, task 5.1).
- Com a Decisão B do arquiteto, a task 1.1/1.2 (revisão) pode agora ser marcada como concluída com referência a `review-architect.md`/`review-fullstack.md` datados de 2026-11-16 — hoje ainda aparecem como `[ ]` não marcadas em `tasks.md`, apesar de as duas perguntas estarem decididas.
- Organização: continua a caber nos módulos existentes, sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` respeita a sequência decidida (revisão antes de código).
- Nenhuma task reabre D1/D2 ou o escopo excluído (blur/background, output device, segundo popout).
- Achado de drift confirmado também do lado de implementação: as linhas citadas em `design.md` para `main.ts` (`626-653`, `736-775`, `836-866`) e `callSession.tsx` (`1039-1109`) já não correspondem às linhas atuais (hoje: `587`, `697`, `799-818`, `1052-1097`, respectivamente) devido ao commit `0915045` ("1.13.0", 2026-11-14). Mesma causa raiz já identificada pelo Arquiteto — não é um achado de implementabilidade novo, é confirmação da mesma lacuna do lado do código real.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- nenhuma nova — a limitação já reportada na revisão de 2026-11-14 (teste manual em X11/Wayland/Windows antes de fechar a política de áudio) continua válida e já está refletida na Decisão A do arquiteto.
