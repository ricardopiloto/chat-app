# Review — Desenvolvedor Fullstack

**Change:** voice-call-rejoin-requires-consent
**Data:** 2026-11-09
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: N/A

- Sem componente de backend; confirmado por leitura do `proposal.md`/`design.md` — mudança isolada a `frontend/src/voice/VoicePage.tsx` e um módulo novo em `frontend/src/shell/`.

## 2. Desenvolvimento do frontend
Veredito: OK

- Viável com a stack real do projeto (SolidJS + `@solidjs/router`), confirmada em `frontend/package.json`. Nenhuma API de framework nova.
- Confirmei por leitura directa de `frontend/src/voice/VoicePage.tsx` que a tarefa 2.1-2.5 descreve exactamente os pontos certos do componente actual (`onMount`, `onCleanup`, o `Switch`/`Match` do render, a função `join()` já existente) — nada foi mal localizado.
- Confirmei em `frontend/src/index.tsx` que `Gate` (o componente de topo dentro do `Router`) monta de facto só uma vez por carregamento de página, e em `frontend/electron/main.ts:272-274` que a janela principal do Electron carrega sempre `index.html` sem rota — sustentando o Non-Goal de `design.md` de que o Electron nunca activa esta condição.

## 3. Deploy e operação
Veredito: N/A

- Sem infraestrutura, variável de ambiente ou serviço novo.

## 4. Qualidade de código
Veredito: Atenção

- **Achado (refina o achado do Arquiteto, não bloqueante):** o `review-architect.md` já apontou que ler `window.location.pathname` à importação do módulo quebra um teste Node puro (tarefa 1.1) e sugeriu extrair uma função pura. Olhei o precedente real já existente no projecto para exactamente este padrão — `frontend/scripts/verify-last-channel.mjs`, que testa `frontend/src/shell/lastChannel.ts` (outro módulo pequeno em `shell/` que também lê de uma API do browser, `localStorage`, directamente ao nível do módulo, sem função pura separada). O padrão já estabelecido não é extrair uma função pura: é empacotar o módulo com `esbuild` (`bundle:true, platform:"node", conditions:["browser"]`) e, no teste, definir `globalThis.localStorage = <mock>` **antes** do `import()` dinâmico do bundle gerado — o módulo lê a variável global mockada normalmente. Para `bootRoute.ts`, o equivalente é mockar `globalThis.location` (ou `globalThis.window`, dependendo de o módulo escrever `location.pathname` ou `window.location.pathname`) do mesmo jeito, no mesmo script de teste, em vez de reestruturar o módulo em função pura — mais simples e consistente com o único precedente real que o projecto já tem para este problema exacto. **Recomendação concreta para a tarefa 1.1:** escrever `frontend/src/shell/bootRoute.ts` lendo o global directamente (`location.pathname`, sem o prefixo `window.`, para bater com o padrão de `localStorage` bare já usado em `lastChannel.ts`), e o script de verificação seguir a estrutura de `verify-last-channel.mjs` (build com esbuild, `globalThis.location = { pathname: "..." }` antes de cada `import()` dinâmico, uma importação fresca por cenário via `?${Math.random()}` no URL do módulo, como já faz `load()` nesse script).
- Tratamento de erro/resiliência: o caminho de falha pós-confirmação (tarefa 2.3) reaproveita o `join()` já existente, que já tem o `Match when={call.problem()}` com retry — nenhuma lógica de erro nova precisa ser inventada.
- **Nota menor, pré-existente, fora de escopo desta change:** se `props.channel`/`channelId` não corresponder a `shell.channel()` no momento do clique (canal apagado entre a navegação e a confirmação), `join()` já retorna silenciosamente sem mostrar nada (nenhum `Match` do `Switch` cobre esse caso hoje, com ou sem esta change) — comportamento já assim antes desta change, não introduzido nem agravado por ela; não é tarefa desta change corrigir.
- Organização: tudo cabe nos módulos já previstos (`VoicePage.tsx`, novo `bootRoute.ts`, catálogos i18n existentes), sem refactor não declarado.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` segue D1-D3 fielmente. Nenhuma decisão do `design.md` foi reaberta sem justificar.
- Nenhuma limitação técnica nova encontrada que precise voltar ao Arquiteto além do já registado na secção 4 (que é um refinamento da própria observação dele, não uma divergência).

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma nova — ver secção 4, que já refina (concorda e torna concreto) o achado que o próprio `review-architect.md` levantou.

## Revisão pós-implementação (2026-11-09)
**Veredito geral:** Aprovado

Confirmei no diff real que a recomendação da secção 4 foi seguida à letra: `bootRoute.ts` usa `location.pathname` bare e `verify-boot-route.mjs` replica a estrutura de `verify-last-channel.mjs` (build esbuild, mock de `globalThis.location` antes de cada `import()` dinâmico com `?${Math.random()}`, um cenário por `check()`). Os cenários cobertos (sem canal, canal exacto, barra final, navegação não altera o valor congelado, `resolveBootChannel()` idempotente) batem com os pedidos na tarefa 1.1. Em `VoicePage.tsx`, `confirmJoin()` reaproveita exactamente a mesma sequência (`refreshChannels`/`refreshRoles` → `join()`) que o caminho automático, como a tarefa 2.3 exigia — nenhuma duplicação de regra de modo/dispositivos. `onCleanup` resolve o canal de arranque só quando `awaitingConsent()` ainda é verdadeiro, evitando uma segunda chamada desnecessária quando o confirm já resolveu antes. Nenhuma lógica de erro nova foi necessária (reaproveita `call.problem()`). Todas as verificações automatizadas passaram.

## Bloqueantes antes de arquivar
- Nenhum.

## Revisão pós-implementação do refinamento (2026-11-09, modal + recusar)

**Veredito geral:** Aprovado

Confirmei no diff real que o `Dialog` usado é exactamente o componente já existente (`import { Button, Dialog } from "../components/ui"`, mesmo barrel que `ChannelPage.tsx` já usa), sem reimplementar nada de overlay/foco/Esc por conta própria — reaproveita `useEscape` e o auto-foco (`data-autofocus` no botão de recusar) já internos ao `Dialog`. `declineJoin()` usa `shell.channels.data?.find((channel) => channel.type === "text")` e `shell.go(...)`, ambos já expostos por `useShell()` — nenhuma API nova precisou ser criada no `shell/state.tsx`. A chave i18n `call.rejoinConsent.decline` foi acrescentada nos dois catálogos, no mesmo objecto das demais, e `verify:i18n-keys` confirma paridade. Nenhum teste automatizado novo foi necessário para o modal em si (interacção de clique/Esc, mesmo padrão já não testado automaticamente para o diálogo de pin) — consistente com o resto do projecto.

## Bloqueantes antes de arquivar (refinamento)
- Nenhum.
