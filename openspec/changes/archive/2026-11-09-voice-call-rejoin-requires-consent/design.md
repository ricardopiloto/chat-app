# Design

## Context

`frontend/src/voice/VoicePage.tsx` entra automaticamente na chamada em `onMount` sempre que monta para um canal de voz acessível — não distingue hoje entre "a pessoa navegou para aqui agora, dentro da sessão já aberta" e "a aplicação carregou já com esta rota activa" (recarregar a página, aba restaurada pelo browser, link directo). A rota activa (`where.pathname`, de `useLocation()` do `@solidjs/router`) reflecte sempre a URL actual do browser; `frontend/src/shell/state.tsx` já faz o parsing dessa URL num `createMemo` (`route()`, linha ~50) no formato `/servers/:serverId/channels/:channelId`. `Gate` (`frontend/src/index.tsx`), o componente de topo montado pelo `Router`, monta exactamente uma vez por carregamento completo da página — qualquer navegação subsequente dentro da sessão é tratada pelo router sem remontar `Gate` nem reexecutar o script do módulo. Isto dá um ponto fiável para capturar, uma única vez por carregamento de página, qual era a rota já activa antes de qualquer navegação acontecer dentro da sessão.

## Goals / Non-Goals

**Goals:**
- Distinguir, de forma fiável e sem depender de heurísticas de tempo (ex. "navegação há menos de N ms"), entre entrar num canal de voz por navegação dentro da sessão (auto-join mantido) e entrar porque a página carregou já com essa rota activa (exige confirmação explícita).
- A confirmação explícita, quando mostrada, aparece imediatamente (sem piscar um estado de "a ligar" antes), como um modal claro com as duas opções (entrar ou recusar) visíveis; ao entrar, segue exactamente as mesmas regras de modo/dispositivos que o auto-join já segue hoje; ao recusar, a pessoa sai do ecrã do canal de voz sem ligar a nada, levada para um lugar útil (o primeiro canal de texto do servidor).
- Depois de resolvida (confirmada, recusada, ou abandonada ao navegar para outro lado sem decidir), qualquer nova entrada nesse mesmo canal, mais tarde na mesma sessão, volta a ser automática — só o primeiro encontro com uma rota de chamada "já activa no arranque" exige confirmação.

**Non-Goals:**
- Popout nativo (`CallPopoutWindow.tsx`): liga-se via `call.watch(...)` a uma chamada já em curso, sempre a partir de uma acção explícita dentro da sessão (abrir o popout); nunca carrega directamente numa rota de canal de voz a partir do arranque da janela. Fora de escopo.
- Qualquer mudança no comportamento de servidor ou na libertação do lugar ao fechar a aba (`pagehide` em `callSession.tsx`) — já correcto.
- Electron (desktop): a janela principal carrega sempre `index.html` sem rota (`frontend/electron/main.ts`), nunca directamente numa rota de canal — o novo comportamento não altera nada aí (a condição nunca se aplica), mas também não depende de detectar Electron especificamente; a solução cobre os dois casos com a mesma lógica.

## Decisions

### D1: Capturar a rota de arranque uma única vez, fora da reactividade, a partir de `location.pathname`

Um módulo novo (`frontend/src/shell/bootRoute.ts`) lê `location.pathname` **uma vez**, à importação do módulo (um singleton de módulo ES, avaliado uma única vez por carregamento de página), e extrai o `channelId` com a mesma forma de parsing que `route()` já usa em `state.tsx` (`/servers/:serverId/channels/:channelId`). Isto fica congelado para o resto da vida da página — nenhuma navegação posterior o altera.

**Alternativa considerada e rejeitada:** usar uma heurística de tempo (ex. "se `join()` for chamado nos primeiros N ms depois do boot, pedir confirmação") — frágil (depende de quão rápido a rede/autenticação resolve) e não determinístico. Capturar a URL crua no momento exacto em que o script corre é determinístico e não depende de timing.

**Alternativa considerada e rejeitada:** derivar isto de `Gate` (`index.tsx`) e passar por props/contexto até `VoicePage`. Funciona, mas obriga a atravessar várias camadas (`Gate` → `AppShell`/`Content` → `VoicePage`) só para transportar um valor que nunca muda. Um módulo importado directamente por `VoicePage` é mais simples e não exige mudar assinaturas de componentes intermédios.

**Nota de implementação (testabilidade):** o módulo lê `location.pathname` como variável global **sem o prefixo `window.`**, no mesmo padrão já usado por `frontend/src/shell/lastChannel.ts` (que lê `localStorage` como global bare) — isto permite testar o módulo em Node puro, empacotado com `esbuild` e com o global mockado antes do `import()` dinâmico, sem precisar de jsdom (ver `frontend/scripts/verify-last-channel.mjs` como modelo; o teste desta change é `frontend/scripts/verify-boot-route.mjs`, no mesmo padrão).

### D2: Estado "a aguardar consentimento" é local ao `VoicePage`, resolvido globalmente só uma vez por canal-de-arranque

O módulo `bootRoute.ts` expõe duas funções, não um valor reactivo:
- `needsExplicitConsent(channelId): boolean` — leitura pura: verdadeiro só se `channelId` for exactamente o canal de arranque **e** ele ainda não tiver sido resolvido.
- `resolveBootChannel(): void` — marca o canal de arranque como resolvido (chamado ao confirmar explicitamente, ou ao desmontar o `VoicePage` ainda a aguardar confirmação porque a pessoa navegou para outro lado sem confirmar).

`VoicePage` captura o resultado de `needsExplicitConsent(channelId)` **uma vez por montagem**, num `createSignal` próprio (`awaitingConsent`) — não um `createMemo` reactivo sobre o módulo, porque o valor não deve mudar sozinho enquanto este `VoicePage` continua montado a aguardar o clique; só muda quando o próprio componente decide (`setAwaitingConsent(false)` ao confirmar). Isto evita que outro código, nalgum re-render, "destrave" silenciosamente um ecrã de confirmação já mostrado.

O `onCleanup` do `VoicePage`, se `awaitingConsent()` ainda for verdadeiro ao desmontar (a pessoa navegou para outro lado sem clicar em confirmar), chama `resolveBootChannel()` — para que uma visita posterior ao mesmo canal, mais tarde na mesma sessão (claramente uma navegação deliberada, já com a aplicação interactiva), volte a entrar automaticamente, sem repetir a pergunta.

### D3: O ecrã de confirmação aparece sem esperar por `refreshChannels`/`refreshRoles`

Hoje, `onMount` espera `Promise.allSettled([shell.refreshChannels(), shell.refreshRoles()])` antes de decidir entrar, porque precisa saber o modo (falar/escuta) antes de chamar `call.join(...)`. O novo ecrã de confirmação não precisa dessa informação só para perguntar "entrar na chamada?" — por isso é mostrado de imediato, de forma síncrona, a partir do valor já conhecido de `awaitingConsent()`, sem esperar rede. Só depois de a pessoa clicar em confirmar é que a função de entrada (reaproveitando o `join()` já existente) faz esse `refreshChannels`/`refreshRoles` e decide o modo, exactamente como o caminho automático já faz hoje. Isto evita mostrar um "A ligar…" a piscar antes do ecrã de confirmação.

### D4: Modal (`Dialog` já existente), não um bloco inline no `Switch`

O ecrã de confirmação usa o componente `Dialog` já existente (`frontend/src/components/ui/Overlay.tsx`), no mesmo padrão já usado para outras confirmações do projecto (ex. diálogo de substituição de pin em `frontend/src/chat/ChannelPage.tsx:508-516`: `Dialog` com `open`/`title`/`onClose`, corpo com `<p>`, rodapé com os botões de acção). `VoicePage` continua a decidir *se* o modal deve estar aberto (`open={awaitingConsent() && !inThisCall()}`), só a apresentação muda de um bloco inline no `Switch` para um `Dialog` sobreposto. `onClose` (chamado também pela tecla Esc, já tratada pelo `Dialog` via `useEscape`) tem o mesmo efeito que o botão de recusar — não há um terceiro estado "fechou sem decidir".

**Alternativa considerada e rejeitada:** manter o bloco inline e só acrescentar um segundo botão de "recusar". Resolveria o pedido de ter a opção de recusar, mas não o de clareza visual (o pedido explícito do utilizador foi "um modal para dar mais clareza") — um aviso inline dentro do layout normal do ecrã de chamada compete visualmente com o resto da página; um modal isola a decisão.

### D5: "Canal de texto padrão" = primeiro canal com `type === "text"` em `shell.channels.data`

Não existe no projecto um conceito já modelado de "canal padrão" por servidor (confirmado por leitura — nem no tipo `Channel`, nem no backend, nem na navegação já existente: `/servers/:id` sem canal mostra um estado vazio "escolha um canal" em vez de seleccionar algo). A interpretação adoptada: o primeiro canal com `type === "text"` em `shell.channels.data`, na mesma ordem já usada para desenhar a sidebar (`frontend/src/shell/Sidebar.tsx`, sem `sort()` próprio — a ordem já vem pronta da API). Ao recusar, `VoicePage` navega com `shell.go(`/servers/${serverId}/channels/${id}`)`; se não houver nenhum canal de texto, cai para `shell.go(`/servers/${serverId}`)` (mesmo padrão de fallback "sem alvo válido" já usado por `channelTarget`/`accountTarget` em `frontend/src/shell/lastChannel.ts`). Recusar não chama `resolveBootChannel()` directamente — o desmonte do `VoicePage` causado pela própria navegação já aciona isso através do `onCleanup` (D2), sem lógica duplicada.

## Risks / Trade-offs

- Fricção adicional para quem abre deliberadamente um link directo ou favorito apontando para um canal de voz, todas as vezes: um clique extra por carregamento de página. É exactamente o comportamento pedido (nunca entrar sem consentimento explícito nesse caso) — não é um defeito, é o objectivo.
- `location.pathname` cru pode, em teoria, ter uma forma ligeiramente diferente da que `where.pathname` do router expõe (ex. barras finais) — mitigado por usar a mesma forma de parsing (`split("/")`) que `route()` já usa sobre `where.pathname`, e por este ser lido antes de o router processar nada, ou seja, exactamente a URL que o browser entregou.
- "Primeiro canal de texto do servidor" (D5) não é um conceito já modelado no projecto — é uma interpretação razoável de "canal padrão" a partir da ordem já usada em `Sidebar.tsx`, não uma convenção já estabelecida em mais nenhum lugar. Se o projecto introduzir no futuro um conceito explícito de canal padrão/fixado por servidor, esta lógica deve passar a usá-lo em vez de assumir "o primeiro da lista".
- Se o projecto alguma vez migrar o router principal para rotas em hash, este módulo precisa de ser revisto (deixaria de encontrar o canal na `pathname`) — não é um risco agora, porque a janela principal usa sempre rotas no `pathname` (confirmado em `state.tsx`); só o popout usa hash, e está fora de escopo.

## Migration Plan

Sem migração de dados nem mudança de API/backend — é só comportamento novo do frontend, activo a partir do próximo deploy. Sem necessidade de rollback especial além de revogar o deploy, se preciso.
