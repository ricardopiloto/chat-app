# Review — Arquiteto de Soluções

**Change:** voice-call-rejoin-requires-consent
**Data:** 2026-11-09
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Sem stack nova, sem dependência nova. A solução usa só o que já existe no frontend (SolidJS signals, `@solidjs/router`, um módulo singleton ES) — coerente com o princípio de "Leveza"/"Simplicidade operacional" de `docs/arquitetura-tecnica.md` §1.
- O módulo novo proposto (`frontend/src/shell/bootRoute.ts`) segue o mesmo padrão já existente no projeto para estado de preferência pequeno e isolado em módulo dedicado (`frontend/src/shell/lastChannel.ts`), em vez de inchar `state.tsx` — boa escolha de localização.
- D1 (capturar `window.location.pathname` uma única vez à importação do módulo, em vez de uma heurística de tempo) é a decisão certa: determinístico, sem depender de latência de rede/autenticação.

## 2. Integração com a infraestrutura existente
Veredito: N/A

- Mudança inteiramente client-side (frontend), sem backend, API, LiveKit ou infraestrutura envolvidos. `design.md` já confirma isso explicitamente nos Non-Goals.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- Enquadramento de segurança/privacidade correto: o `proposal.md` liga isto a um comportamento observado (reload/aba restaurada reconectando a uma chamada, possivelmente com microfone ligado, sem acção da pessoa) — é uma correcção de uma lacuna de consentimento real, não só uma preferência de UX.
- **Achado (não bloqueante):** `design.md` D1 diz que `bootRoute.ts` lê `window.location.pathname` "à importação do módulo", e `tasks.md` 1.1 pede um teste unitário que simula diferentes `pathname`. Nenhum dos dois artefactos diz explicitamente que a leitura de `window.location` precisa de ficar isolada numa função pura separada (testável sem DOM), para o teste poder correr no mesmo padrão de harness Node usado no projecto para módulos pequenos (`node --experimental-strip-types`, ex. `legacy-cleanup.test.mjs`) sem precisar de jsdom. Se implementado ao pé da letra como está escrito ("ler `window.location.pathname`... à importação do módulo"), um teste que apenas importa o módulo em Node (sem `window` global) falha no import, antes de testar nada. **Recomendação:** ao implementar a tarefa 1.1, extrair uma função pura (`extractBootChannelId(pathname: string): string | null`) que o singleton do módulo chama com `window.location.pathname`, e testar essa função pura directamente — o mesmo padrão de isolar o acesso à plataforma atrás de uma função injectável já usado noutras changes deste projecto (ex. `rebrand-parley`, módulo de limpeza sem importar `electron`). Não bloqueia a implementação, mas vale corrigir antes de escrever o teste, não depois dele falhar.
- Performance: nenhum impacto — leitura síncrona de uma string, uma vez por carregamento de página.
- Manutenibilidade: o par `needsExplicitConsent`/`resolveBootChannel` como funções simples (não um valor reactivo exportado) é uma escolha deliberada e bem justificada em D2 — evita o perigo de outro código, numa re-renderização, destravar sozinho um ecrã de confirmação já mostrado.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `design.md` regista três decisões (D1-D3), cada uma com pelo menos uma alternativa considerada e rejeitada com motivo (heurística de tempo para D1; prop-drilling via `Gate` para D1; `createMemo` reactivo para D2) — no padrão já estabelecido pelas changes anteriores desta sessão.
- Sem diagrama — correctamente omitido, o fluxo de dados é trivial (um módulo, um componente, dois sinais).
- `Risks/Trade-offs` já identifica a fricção extra para quem abre um link/favorito directo como intencional, não como defeito — framing correcto, evita que uma revisão futura confunda isso com uma regressão.

## 5. Ponte entre produto e técnico
Veredito: OK

- O pedido do utilizador ("isso nunca deve acontecer sem o consentimento do usuário") foi traduzido em cenários concretos e testáveis no spec delta (recarregar a página, link directo, e o caso de controlo "continua automático dentro da sessão") — sem lacuna nem promessa vaga.
- O spec delta preserva os cinco cenários originais do requirement (nenhum foi perdido na reescrita do bloco MODIFIED) e acrescenta três novos — `openspec validate --strict` já confirmado a passar.

## Bloqueantes antes de implementar
- Nenhum. O achado da secção 3 é uma recomendação para a tarefa 1.1, não um bloqueio à aprovação do design.

## Revisão pós-implementação (2026-11-09)
**Veredito geral:** Aprovado

Li o diff real (`frontend/src/shell/bootRoute.ts`, `frontend/scripts/verify-boot-route.mjs`, `frontend/src/voice/VoicePage.tsx`, catálogos i18n). O achado da secção 3 foi corrigido exactamente como recomendado: `bootRoute.ts` lê `location.pathname` como global bare (sem `window.`), e `verify-boot-route.mjs` segue estruturalmente `verify-last-channel.mjs` (esbuild + mock de `globalThis.location` antes do `import()` dinâmico). D1-D3 implementadas fielmente: o valor de arranque é um singleton de módulo congelado (`let resolved = false`, nunca reatribuído a partir da `pathname` actual); `awaitingConsent` em `VoicePage` é um `createSignal` capturado uma vez na criação do componente, não um `createMemo` sobre o módulo; o ecrã de confirmação (novo `<Match>`) é mostrado antes do `Match` de "A ligar…", com `preparing` inicializado a `!awaitingConsent()` — sem flash. `tsc`, `eslint`, `verify:i18n-keys`, `verify:boot-route` e `build` passaram.

## Bloqueantes antes de arquivar
- Nenhum.

## Revisão pós-implementação do refinamento (2026-11-09, modal + recusar)

**Veredito geral:** Aprovado

Depois da verificação manual inicial, o usuário pediu um refinamento (modal em vez de bloco inline, com opção de recusar levando ao primeiro canal de texto) — actualizei `proposal.md`/spec delta/`design.md` (D4, D5) antes da reimplementação. Li o diff real: `VoicePage.tsx` agora renderiza um `<Dialog>` (`components/ui/Overlay.tsx`) fora do `Switch`, com `open={awaitingConsent() && !inThisCall()}`, `onClose={declineJoin}` (mesmo efeito do botão de recusar, cobrindo Esc via `useEscape` já interno ao `Dialog`) e os dois botões no rodapé. `declineJoin()` implementa D5 exactamente como decidido: primeiro canal com `type === "text"` em `shell.channels.data`, fallback para `/servers/:id` sem nenhum; não chama `resolveBootChannel()` directamente, confiando no `onCleanup` já existente (D2) — confirmei que isso é seguro, porque `shell.go()` desmonta este `VoicePage` de forma síncrona o suficiente para o `onCleanup` ver `awaitingConsent()` ainda verdadeiro antes de qualquer outro código reagir. Nenhuma decisão de D1-D3 foi reaberta. `tsc`, `eslint`, `verify:i18n-keys`, `verify:boot-route` e `build` passaram.

## Bloqueantes antes de arquivar (refinamento)
- Nenhum.
