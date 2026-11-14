# Review — Desenvolvedor Fullstack

**Change:** add-popout-call-controls
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado pelo `Impact` do `proposal.md` e pela inspecção do código: nenhuma rota/backend tocada, só Electron main process e dois renderers.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Confirmei viabilidade directa de três coisas que o design assume: (a) `tellOpener()`/`mesa:call-popout-closed` (`main.ts:583-585`) já é o padrão exacto que a tarefa 1.1 estende; (b) o padrão de botão (`type="button"`, `classList={{off:...}}`, `aria-pressed`, `title`/`aria-label` via `t()`, `<Icon>`) em `CallControls.tsx:46-81` é directamente reutilizável nos novos botões do popout; (c) o padrão hover/focus-reveal citado no D4 existe de verdade em `voice.css` (`.call-tile-caption{opacity:0;visibility:hidden;...}` com `:hover`/`:focus-within` revertendo e uma transição sob `prefers-reduced-motion`) — é o mecanismo certo a copiar para o novo overlay.
- **Achado:** `CallPopoutWindow.tsx`/`PopoutStage` já usa `useCall()` (linha 12), que no popout é a sessão VIEWER (sala só-visualização, `watch()`). O novo estado autoritativo do D2 (mic/cam/deafened/canSpeak da sessão DONA) tem de vir de uma fonte de dados nova e distinta — não de `call.live()`/`call.mic()` do `useCall()` já presente nesse ficheiro, que descreve a ligação de visualização, não a chamada real. Como as duas coisas convivem no mesmo componente com nomes semelhantes ("live", "mic", etc.), há risco real de alguém ligar o novo botão ao `useCall()` errado por engano. Recomendo que a tarefa 3.1 nomeie explicitamente um estado/prop distinto (ex.: `ownerState`/`ownerLive`, não reaproveitando os nomes do hook do viewer) para que a distinção fique visível no código, não só no design.md.
- Responsividade: o limite de 240×180 já é o `minWidth`/`minHeight` real da janela do popout (`main.ts`, criação do `BrowserWindow` do popout) — a meta "pelo menos 80px de área de tile" é verificável contra um limite que já existe no código, não um número inventado.

## 3. Deploy e operação

Veredito: OK

- Sem configuração, porta ou serviço novo. Observação menor, não bloqueante: ao rejeitar um comando por remetente/canal inválido (D1/D2), vale seguir o padrão já usado noutros pontos de `main.ts` (`console.warn` para o ícone da tray ausente) para que a equipa consiga depurar isso em produção.

## 4. Qualidade de código

Veredito: OK

- As tarefas de verificação (3.2) são manuais, e isso é apropriado aqui: a lógica central (`main.ts`) é IPC/Electron, fora do alcance prático dos scripts `verify-*.mjs` existentes (que testam código puro de `frontend/src`, não o processo principal do Electron) — consistente com o mesmo padrão já aceite noutra change desta leva que também toca `main.ts` (`fix-stale-background-call-blocks-rejoin`).
- Organização: cabe nos ficheiros já previstos; nenhum refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1-D4 na ordem certa. Confirmo o achado do Arquiteto sobre testar o cenário "janela principal escondida na tray, popout aberto" — é implementável sem mudança de desenho (o próprio `isDestroyed()` já cobre isso), só falta a tarefa de verificação explícita.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma nova; confirmo o ponto do Arquiteto sobre o teste de interacção com a tray.
