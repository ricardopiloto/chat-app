# Review — Desenvolvedor Fullstack

**Change:** popout-voice-navigation-handoff
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- `proposal.md:27` e o `Migration Plan` de `design.md` dizem explicitamente que é uma mudança só de frontend/Electron, sem endpoint, schema ou migração novos. Confirmado: nenhum arquivo em `backend/` aparece em "Impact", e nada no fluxo descrito (visibilidade de "Bring it back", sequência join/leave/popout) depende de uma chamada de API nova — `voiceApi.join`/`voiceApi.leave` já existentes continuam a ser usados como estão hoje em `frontend/src/voice/callSession.tsx:299,443,489`.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Viável com a stack atual (SolidJS + Electron IPC já existentes). Os quatro arquivos citados no Impact (`Hosts.tsx`, `callSession.tsx`, `Stage.tsx`/tela de chamada, `GreenRoom.tsx`) são de fato os pontos certos: confirmei lendo o código que `Hosts.tsx` hoje mostra `CallElsewhere` sempre que `voice.popoutFor() === voice.channelId()` e a rota é diferente do canal (linhas 78-82), e que `Stage.tsx` já tem sua própria instância de `CallElsewhere` presa ao canal (linha 106-108) — exatamente como `design.md` descreve o estado atual.
- Lacuna de implementação: `design.md` Decisão 2 pede uma "rotina serializada que fecha e **aguarda** o popout nativo, desfaz a sessão LiveKit [...] e depois inicia a ligação nova", mas:
  - `callSession.tsx:296-297` fecha o popout com `void window.mesaNative?.closeCallPopout()` (não aguardado) dentro de `leave()`.
  - `callSession.tsx:167-173` (`teardown`) desconecta a sala com `void closing.disconnect(true)` (também não aguardado).
  - O `invoke` de `closeCallPopout` no lado do Electron resolve antes da janela terminar de fechar (ver achado equivalente no `review-architect.md`, seção 2) — então mesmo trocando `void` por `await` nessas duas linhas, `await closeCallPopout()` não garante, por si só, que a janela nativa já fechou.
  - `tasks.md` 2.1 diz só "aguardar o fecho nativo do popout e a saída da chamada anterior", sem nomear o mecanismo (ex.: esperar o callback `onCallPopoutClosed` em vez do retorno do `invoke`, ou await explícito em `closing.disconnect(true)`). É implementável, mas quem codar vai ter que inventar esse detalhe durante a tarefa — melhor deixar isso explícito em `tasks.md` ou `design.md` antes de começar, para não ter que voltar e redecidir no meio da implementação.
- Responsividade/usabilidade: não há UI nova (só gating de um componente já existente), então não há superfície extra a testar em mobile/desktop além do que já existe.

## 3. Deploy e operação

Veredito: N/A

- Sem porta, variável de ambiente, processo ou serviço novo — confirmado contra `docs/deploy-producao.md`/`docs/operar-instancia.md`, que não listam nada relacionado a popout de chamada (é 100% client-side/Electron). Depuração em produção seria via DevTools do Electron/console do renderer, como já é hoje para o resto do módulo de voz; a change não piora nem melhora essa observabilidade.

## 4. Qualidade de código

Veredito: Atenção

- O projeto não tem um runner de teste de componente/assíncrono (`frontend/package.json` não lista `vitest`/`jest`; os scripts `verify:*` existentes, incluindo `verify:popout-grid` citado em `tasks.md` 2.3, são funções puras empacotadas com `esbuild` e executadas em Node — ver `frontend/scripts/verify-popout-grid.mjs`, que só testa `computeGridSize`). `tasks.md` 2.2 pede para "verificar por teste ou simulação de callbacks atrasados que o estado da nova chamada não é limpo pela janela anterior" — dado o que existe no repo, isso só é realista como **simulação manual** (ex.: atrasar deliberadamente o callback `onCallPopoutClosed` no DevTools e observar o comportamento), não como teste automatizado novo. Isso é consistente com o padrão de verificação majoritariamente manual já usado nas tasks 1.1/1.2 desta mesma change, mas vale deixar explícito para não gerar a expectativa de um teste automatizado que a base não suporta hoje.
- Tratamento de erro/resiliência: o cenário de falha ("Entrada no novo canal falha" no spec delta) já é coberto pelo `catch` existente em `join()` (`callSession.tsx:481-491`), que não reabre popout nem a chamada antiga — a change só precisa preservar esse comportamento, não criar um novo caminho de erro. Boa aderência ao que já existe.
- Organização: a change cabe nos arquivos já listados, sem refactor estrutural declarado nem necessário.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` 1.1-1.2 e 2.1-2.3 mapeiam diretamente para as Decisões 1-3 de `design.md`, sem reabrir nada já decidido e sem escopo extra (nenhuma task introduz UI nova, endpoint novo, ou toca áudio do popout — respeitando os Non-Goals).
- O mecanismo de invalidação por `epoch` que `design.md` Decisão 2 pede para reaproveitar já existe e já é usado em `join`/`watch` (`callSession.tsx:82,305,401`) — é reuso real, não uma promessa vaga.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- O contrato IPC atual (`mesa:close-call-popout` em `frontend/electron/main.ts:317-319`) resolve a promise antes do evento `"closed"` da janela nativa — "aguardar o fecho nativo" como pedido em `design.md` Decisão 2 não é alcançável só com `await closeCallPopout()`. É preciso decidir explicitamente (no design ou nas tasks) se o await correto é sobre o callback `onCallPopoutClosed`, ou se vale a pena um ajuste mínimo no handler principal para só resolver após `"closed"` — o que mudaria a afirmação de `proposal.md` de "sem nova API". Já reportado em paralelo no `review-architect.md`, seção 2.
