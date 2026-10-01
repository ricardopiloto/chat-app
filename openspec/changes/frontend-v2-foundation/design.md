# Design

## Context

A v1 (`frontend/`) é uma SPA SolidJS 1.9 + `@solidjs/router` + Vite 6 + TypeScript 5.8, com `tweetnacl`/`@noble/hashes`/`hash-wasm` para a criptografia client-side e `livekit-client`/`@livekit/track-processors` para voz/vídeo. Build único via `vite build` → `frontend/dist/`, servido pelo Nginx (o backend não serve estáticos nem tem CORS — frontend e backend partilham origem em produção por causa do cookie `Session` `SameSite=Strict`). Não há suite de testes automatizados em `frontend/src`.

O design system "Campfire Modernism" foi gerado via Google Stitch em 30 mockups estáticos (`docs/v2/mesa_*/code.html`) mais um guia de componentes autónomo. A análise em `docs/v2/TR-frontend-v2.md` §6.3 encontrou que o guia de componentes usa um sistema de tokens de cor **diferente** (paleta `obsidian-950…100`/`brand-50…900`, ícones emoji, só 2 famílias tipográficas) do que os 29 mockups de produto (paleta M3-style, ícones Material Symbols Outlined, 3 famílias tipográficas). Ver proposal.md e `docs/v2/TR-frontend-v2.md` para a motivação completa desta reescrita faseada.

Esta fase (0 de 6) não tem telas de produto — ver proposal.md "What Changes" para o que fica para as fases 1-5.

## Goals / Non-Goals

**Goals:**
- Um projecto `frontend-v2/` que builda e corre de forma totalmente independente de `frontend/`.
- Um único conjunto de tokens de design (fonte de verdade = os 29 mockups de produto, não o guia de componentes) consumível em dark e light.
- Uma biblioteca de componentes base pequena o suficiente para não bloquear as fases seguintes, mas completa o suficiente para que nenhuma fase de produto precise de inventar um botão, diálogo ou toast do zero.
- Clientes de API REST/WS e motor de i18n portados com o mesmo formato/contrato da v1, para que as fases seguintes só precisem de consumir, não re-desenhar essa camada.

**Non-Goals desta fase:**
- Nenhuma tela de produto (login, shell, chat, voz/vídeo, definições) — fases 1-5.
- Nenhuma decisão de corte/roteamento de deploy entre v1 e v2 — fase 5 (`frontend-v2-polish-cutover`).
- Nenhuma migração da lógica de criptografia de identidade (NaCl/Argon2id) ou da integração LiveKit — ficam para a Fase 1 (`frontend-v2-auth-shell`) e Fase 4 (`frontend-v2-voice-video`) respectivamente, que são os pontos onde essa lógica é de facto exercida; esta fase só precisa que o cliente de API/WS exista, não que a criptografia esteja portada.
- Testes automatizados como exigência bloqueante — a v1 nunca teve; introduzir ou não fica registado como pergunta em aberto no TR (§10), não decidido aqui.

## Decisions

### D1 — Projecto novo em `frontend-v2/`, mesma stack, sem monorepo/workspace
`frontend-v2/` é um segundo directório de projecto Vite irmão de `frontend/`, com o seu próprio `package.json`, `tsconfig.json`, `vite.config.ts` e `eslint.config.js` — não um workspace npm/pnpm partilhado com a v1.
**Alternativa considerada**: converter o repositório num monorepo com pacotes partilhados (ex.: um pacote `@mesa/crypto` usado por ambos os frontends). Rejeitada nesta fase porque introduz complexidade de tooling (workspaces, versionamento interno) só para um período de convivência temporário (a v1 é desligada na Fase 5) — a duplicação pontual de ficheiros pequenos (cliente de API, motor de i18n) é mais barata do que o custo de configurar e manter um monorepo para uma vida útil curta.
Configuração a espelhar da v1: `tsconfig.json` (strict, `noUncheckedIndexedAccess`, `jsxImportSource: solid-js`), `vite-plugin-solid`, `@vitejs/plugin-basic-ssl` (dev em HTTPS, necessário para APIs de câmara/microfone), e o filtro de logger que silencia o erro benigno de proxy WS em dev (`mesaDevLogger`, ver `frontend/vite.config.ts`) — este filtro é tooling de dev, não comportamento de produto, por isso é copiado directamente sem passar por spec.

### D2 — Tailwind CSS configurado sobre tokens expostos como variáveis CSS nativas
Os tokens (cor, tipografia, espaçamento, raio, elevação, breakpoints) são definidos como propriedades CSS custom (`:root` + um atributo/classe de tema para light/dark) e **também** registados no `tailwind.config` de `frontend-v2/` (via `theme.extend`, referenciando as mesmas variáveis CSS), para que as classes utilitárias Tailwind (`bg-primary-container`, `text-on-surface`, etc.) resolvam para os tokens reconciliados de D3, não para valores Tailwind por omissão.
**Porquê**: decisão do utilizador — os 29 mockups de produto já vêm em Tailwind, adoptá-lo reduz a tradução manual de mockup para componente em todas as fases seguintes. Manter os valores como variáveis CSS por baixo (em vez de só constantes no `tailwind.config`) preserva a troca de tema em runtime por mudança de atributo no `<html>` (sem re-render), e mantém os tokens inspecionáveis/reutilizáveis fora de contexto Tailwind caso algum componente precise (ex.: um canvas/SVG desenhado via JS, como a grelha de câmaras da Fase 4).
**Alternativa considerada**: só variáveis CSS, sem Tailwind (ver revisão anterior desta decisão). Substituída por indicação explícita do utilizador de priorizar aproveitamento directo dos mockups.
**Nova dependência introduzida**: `tailwindcss` (+ `@tailwindcss/vite` ou `postcss`/`autoprefixer` conforme a versão), ausente da stack da v1.

### D3 — Fonte de verdade de tokens: os 29 mockups de produto, não o guia de componentes
Onde os dois sistemas divergem (valores exactos de cor, família tipográfica do corpo de texto, tecnologia de ícone, escala de raio), esta fase usa os valores dos 29 mockups de produto. O guia de componentes (`mesa_sistema_de_design_tokens_componentes_guia_de_ui`) é tratado como referência de *quais* componentes existem e *que variantes* têm, não como fonte de valores de token.
**Porquê**: os 29 mockups são a representação de como as telas de produto devem parecer; o guia, por divergir deles, deixaria de bater visualmente com tudo o resto se fosse seguido literalmente (ver `docs/v2/TR-frontend-v2.md` §6.3, achado já confirmado por auditoria).

### D4 — Ícones: Material Symbols Outlined via `<link>` de fonte, não um pacote de ícones SVG
Os 29 mockups carregam Material Symbols Outlined via Google Fonts. Esta fase adopta a mesma abordagem (um `<link>`/`@font-face` + spans com o nome do ícone), em vez do padrão da v1 (`components/icons/*.tsx`, um ficheiro SVG por ícone como componente Solid).
**Alternativa considerada**: manter o padrão de componente-SVG-por-ícone da v1, só trocando os desenhos. Rejeitada porque os mockups não fornecem SVGs individuais — fornecem nomes de glifos Material Symbols; re-desenhar cada ícone como SVG custom seria trabalho extra sem ganho, e a fonte de ícones já resolve tree-shaking razoável (só os glifos usados entram no peso percebido via subsetting, se necessário optimizar mais tarde).

### D5 — Cliente de API/WS puro (sem Solid) + TanStack Query (Solid Query) como camada reactiva
`frontend-v2/src/api/client.ts` e `.../ws.ts` replicam as mesmas assinaturas de tipo (`Account`, `Server`, `Channel`, `CreateServerBody`, etc. — ver `frontend/src/api/client.ts`) e as mesmas funções de chamada, escritas como TypeScript puro **sem nenhum import de `solid-js`** — são funções `fetch` tipadas, chamáveis de qualquer camada. Por cima dessas funções, as fases de produto (1-5) consomem os dados via **TanStack Query** (`@tanstack/solid-query`), que fornece cache, revalidação e estados de loading/erro de forma consistente em toda a app.
**Porquê**: decisão pedida explicitamente a pensar em reaproveitamento futuro (incl. uma eventual v3 noutro framework). Um cliente de API sem dependência de Solid porta para qualquer framework sem alteração nenhuma. O TanStack Query tem adapters equivalentes para React/Vue/Svelte/Solid com o mesmo modelo de chaves de cache e invalidação — se uma v3 trocar de framework, troca-se o adapter, não se reescreve a lógica de busca de dados. Chamadas directas com `createResource` (o padrão Solid puro, e o que a v1 faz hoje de forma ad-hoc) não têm esse caminho de migração, por ficarem amarradas à reactividade específica do Solid.
**Alternativa considerada**: manter chamadas directas como a v1 (`createResource`/signals manuais). Rejeitada por decisão do utilizador, priorizando reaproveitamento a longo prazo sobre minimizar dependências nesta fase.
**Nova dependência introduzida**: `@tanstack/solid-query` — única biblioteca nova face à stack da v1 nesta fundação.

### D6 — i18n: motor portado, catálogos ficam vazios/stub
`frontend-v2/src/i18n/` replica a forma do motor da v1 (`createSignal` de locale activo, detecção de idioma do navegador, preferência persistida, `SUPPORTED_LOCALES`) mas os ficheiros `catalogs/pt-BR.ts`/`catalogs/en.ts` começam só com a árvore de chaves estrutural necessária para esta fase (ex.: rótulos da própria tela de verificação de tokens/componentes), não com as ~475 linhas de texto de produto da v1 — essas são adicionadas fase a fase, por quem construir cada tela.

## Risks / Trade-offs

- **[Risco] Duplicar código entre `frontend/` e `frontend-v2/` durante a convivência** (cliente de API, i18n, e mais tarde criptografia/LiveKit) pode divergir se a v1 receber uma correcção que não é replicada na v2. → **Mitigação**: a v1 está em modo de manutenção durante a reescrita (só correcções críticas); qualquer correcção de contrato de API na v1 deve gerar uma nota para reaplicar no port v2 correspondente — decisão operacional a registar na Fase 5, não algo que esta fase resolve sozinha.
- **[Risco] Reconciliar tokens divergentes pode não ser 100% mecânico** — alguns valores (ex.: `secondary`/verde reservado a E2EE, mas oferecido como cor de cargo num dos mockups novos, ver TR §7.4) têm um conflito de uso, não só de valor. → **Mitigação**: esta fase define só os tokens brutos (valores de cor); a decisão de *onde* uma cor reservada pode ou não ser usada como decoração fica para a fase de produto que a introduzir (Fase 2, cargos e permissões), documentada lá.
- **[Risco] Adoptar Tailwind ou não afecta todas as fases seguintes**, mas não foi decidido aqui. → **Mitigação**: ver Open Questions; a fundação funciona com tokens em CSS puro independentemente da resposta, então esta fase não fica bloqueada — mas quem iniciar a Fase 1 precisa da resposta antes de escrever a primeira tela.

## Migration Plan

Não aplicável no sentido de "migração de dados" — é a criação de um projecto novo. Passos de activação:
1. Scaffold `frontend-v2/` (não interfere com `frontend/` em execução).
2. `npm install` + `npm run dev` corre num porto diferente do da v1 (a v1 usa `1420`; `frontend-v2/` deve escolher outro porto livre, ex. `1421`, configurado no seu próprio `vite.config.ts`) para permitir correr os dois simultaneamente durante o desenvolvimento das fases seguintes.
3. Sem passo de rollback aplicável — nada em produção aponta para `frontend-v2/` até à Fase 5.

## Open Questions

Nenhuma — as três questões desta categoria (Tailwind, data-fetching, testes automatizados) foram resolvidas explicitamente pelo utilizador antes da escrita de `tasks.md`: adoptar Tailwind (D2), adoptar TanStack Query/Solid Query com cliente puro por baixo (D5), e não incluir setup de testes automatizados nesta fase (mantém o mesmo défice da v1; decisão de introduzir testes continua registada como pergunta em aberto em `docs/v2/TR-frontend-v2.md` §10, a resolver fora desta fase se e quando for retomada).
