# Review — Arquiteto de Soluções

**Change:** popout-responsive-grid-layout
**Data:** 2026-10-16
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change não introduz stack nova: fica inteiramente dentro do shell Electron existente (`frontend/electron/main.ts`) e do cliente SolidJS (`frontend/src/voice/gridSize.ts`, `GridView.tsx`). Não toca backend, LiveKit, nem API — coerente com `docs/arquitetura-tecnica.md` §5, onde a "grade de câmeras" é tratada como módulo de UI do cliente.
- Escopo bem contido: o `design.md` declara explicitamente como Non-Goal não alterar o modo não-`fill` (grade da janela principal) nem o modo de palco com partilha em destaque — reduz superfície de regressão. Sem preocupação de escalabilidade: a mudança é puramente de layout local, sem efeito no número de participantes suportados por sala.
- Nota de reconciliação em `docs/arquitetura-tecnica.md:76` confirma que o cliente desktop real é Electron, não o Tauri/binário único ainda aspiracional do documento — a proposta está alinhada com a arquitetura *real*, não com a meta de longo prazo. Nenhum achado aqui.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- Nenhum componente de servidor, reverse proxy, container, rede ou banco de dados é tocado. O popout já é uma conexão "viewer" independente ao LiveKit (`voice/popout-viewer-token`), e esta change não altera essa integração — só a janela do SO e o cálculo de layout local. `docs/deploy-producao.md`/`docs/operar-instancia.md` não têm nada a dizer sobre esta mudança.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- **Segurança/E2EE**: sem impacto. O popout continua a ser um visualizador que recebe tracks já decifrados no cliente (Insertable Streams) como antes; mudar o número de colunas/tamanho mínimo da janela não toca no caminho de decifragem nem expõe nova superfície. Correto não haver menção a isso em `design.md` — não se aplica.
- **Performance**: o `design.md` já identifica corretamente que a nova verificação de proporção roda *antes* do laço de maximização existente (early return), ou seja, é estritamente mais barata que o caminho actual para o caso de coluna única, e não adiciona custo ao caso geral. O `ResizeObserver` que já existe não muda de comportamento. Sem gargalo novo.
- **Manutenibilidade**: a decisão de manter a lógica de coluna única dentro de `computeGridSize` (em vez de uma segunda fonte de verdade via CSS `@container`) é a escolha correta pelo motivo já dado no `design.md` — evita duas fontes de verdade para o mesmo problema. Concordo com a rejeição dessa alternativa.
- **Achado (Atenção) — risco de edição concorrente não mencionado**: a change em curso `fix-pip-call-navigation-freeze` (`openspec/changes/fix-pip-call-navigation-freeze/`) também está activamente investigando a área do popout (fecho/reabertura, `closePopoutOnce`, possivelmente o processo principal do Electron no cenário Windows). Os ficheiros não colidem directamente hoje (`callSession.tsx`/`Hosts.tsx` vs. `main.ts`/`gridSize.ts`/`GridView.tsx`), mas ambas tocam `frontend/electron/main.ts` na mesma área funcional (registo do `BrowserWindow` do popout) e o `GridView.tsx`/grade partilhada pode ser onde a investigação de travamento também acaba mexendo, conforme o próprio `Impact` dessa outra proposta admite ("Possivelmente `FloatingPlayer.tsx`/`tiles.tsx`"). Recomendação: não é bloqueante, mas vale coordenar a ordem de merge (ex.: aplicar o fix de travamento primeiro, já que é um bug activo em produção, antes ou depois desta change de layout) para evitar que uma reabra a outra em revisão de código.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- `design.md` registra decisões com alternativas rejeitadas (ex.: `@container` CSS queries vs. cálculo em JS; join-order real vs. manter ordem actual) — o conteúdo está correto e no nível certo de detalhe.
- **Achado (Atenção, menor)**: o projecto já tem uma convenção estabelecida de nomear decisões como `D1`, `D2`... (ver `openspec/changes/archive/2026-10-08-password-recovery/design.md`). Este `design.md` usa "### 1.", "### 2.", "### 3." em vez de `D1`/`D2`/`D3`. Não é um problema de conteúdo, só de convenção — fácil de ajustar antes de arquivar, não bloqueia a implementação.
- Diagrama: não é necessário aqui — a mudança é um ajuste de fórmula (early return) e um valor de configuração, sem fluxo de dados novo entre componentes. Omissão correta.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido original do usuário (imagem de referência do Discord: janela estreita/alta → câmaras empilhadas verticalmente por ordem de chegada) foi traduzido em uma regra testável e determinística (limiar de proporção 0.7) em vez de depender do efeito incidental do algoritmo actual — é exactamente o gap que a investigação preliminar identificou corretamente.
- A decisão de **não** implementar "ordem de chegada real" (que exigiria rastrear timestamp de entrada em `callSession.tsx`) foi explicitamente levantada ao usuário antes de escrever a spec (`AskUserQuestion` registado no histórico da change) e a resposta ficou documentada tanto no `proposal.md` quanto no `design.md` — é o tipo de decisão produto↔técnico que deveria sempre ser explicitada, e aqui foi.
- Esta change não envolve funcionalidades específicas de RPG (dados, fichas, etc.) — dimensão não aplicável nesse aspecto, mas a ponte geral produto→técnico está bem feita.

## Bloqueantes antes de implementar
- nenhum
