# Research: 012-shell-iconography-typography

## 1. Sistema de ícones

**Decision**: Conjunto pequeno de componentes SVG inline próprios em `frontend/src/components/icons/`, um componente por ícone (`IconMic`, `IconLock`, …), `viewBox="0 0 24 24"`, traço (`stroke="currentColor"`, `fill="none"`, `stroke-width` fixo ~1.75, `stroke-linecap="round"`) — herdam cor do texto envolvente, logo funcionam em ambos os temas sem CSS extra (FR-012).

**Rationale**: O projeto tem hoje 6 dependências de produção (nenhuma delas UI/ícones) e uma filosofia explícita de self-hosting/simplicidade operacional (README: "Simplicidade operacional"). Precisamos de ~13 ícones concretos (ver [data-model.md](./data-model.md)) — muito abaixo do ponto em que uma biblioteca inteira (com centenas de ícones por tree-shake) compensa o custo de mais uma dependência para gerir/atualizar. Componentes próprios também facilitam impor a regra de "um traço, um peso" (consistência visual) exigida implicitamente pela spec (Assumptions: "um único conjunto visual, com o mesmo peso/estilo de traço").

**Alternatives considered**:
- `lucide-solid` (ou equivalente): menos esforço de autoria inicial, mas adiciona dependência externa, uma licença extra a acompanhar, e um conjunto de ~1500 ícones dos quais só 13 seriam usados.
- Web font de ícones (ligadura/glifo): pior para acessibilidade (não é texto real nem SVG semântico) e para escala/nitidez em ecrãs de alta densidade; rejeitado.
- Sprite SVG externo (`<use href="#icon">`): equivalente em resultado, mas adiciona um passo de build (gerar/servir o sprite) sem benefício claro para ~13 ícones; componentes inline são mais simples no SolidJS existente.

## 2. Tipo de letra monoespaçado para valores copiáveis

**Decision**: Introduzir o token `--font-mono: ui-monospace, "SF Mono", "Cascadia Code", "Consolas", "Fira Mono", monospace;` (pilha de fontes do sistema) e aplicá-lo a `.key-display`, `.members-handle`, ao código de convite (`Sidebar.tsx`, diálogo de convite) e a qualquer outro identificador copiável. Nenhum ficheiro de fonte novo é carregado.

**Rationale**: O problema identificado na spec (FR-009) é a ambiguidade 0/O e 1/l/I, não a identidade de marca. As fontes monoespaçadas de sistema mais comuns (SF Mono, Cascadia Code, Consolas) já desenham essas formas de modo distinto (zero cortado/pontilhado, "l" com haste, "I" com serifas de topo/base). Usar a pilha do sistema evita mais um `@import` de fonte externa — o projeto já depende do Google Fonts para o Inter (`nocturne.css`), e não há necessidade de repetir esse custo de rede/privacidade para um requisito que a pilha nativa já resolve.

**Alternatives considered**: Auto-hospedar "JetBrains Mono" (tem zero cortado desenhado explicitamente para este fim) — mais robusto entre plataformas, mas acrescenta ficheiros de fonte ao bundle e complexidade de licenciamento/self-hosting para um ganho marginal sobre a pilha do sistema. Fica documentado como possível evolução futura se um sistema operativo alvo específico se mostrar insuficiente (fora de âmbito agora).

## 3. Hierarquia tipográfica de título vs. corpo

**Decision**: Diferenciar por peso *por nível* em vez de um único `--font-heading-weight: 500` global: h1–h3 sobem para 650, h4–h6 mantêm-se em 500–600, e o tracking negativo existente (`-0.015em`) mantém-se só nos tamanhos maiores (h1–h2). Os "eyebrows" de secção (`.sidebar-section`, maiúsculas + tracking positivo) já seguem o padrão certo e não mudam.

**Rationale**: A spec (FR-011) pede diferenciação "além do peso da fonte" — a leitura correta é que a *única* variável usada hoje é um peso uniforme; a correção mínima e de baixo risco é variar o peso por nível de heading e confirmar/reforçar a escala e o tracking já existentes, sem introduzir uma segunda família tipográfica de display.

**Alternatives considered**: Segunda família de display (serif ou display sans) só para h1 — rejeitado por introduzir uma fonte extra sem pedido explícito da spec (Assumptions: manter a identidade tipográfica geral da marca).

## 4. Âmbito e algoritmo da pesquisa (FR-006, FR-014, FR-015)

**Decision**: Pesquisa cliente-side, disparada a partir da topbar: para cada servidor em `GET /api/servers` (já carregado pelo `Sidebar`) e cada canal de texto em `GET /api/servers/{id}/channels`, obter mensagens via `GET /api/channels/{id}/messages` (mesmo endpoint já usado por `Channel.tsx`), decifrar com a chave do servidor já carregada em sessão (`crypto/keyHandoff.ts`), e filtrar por correspondência de texto no conteúdo decifrado. Resultados aparecem progressivamente por canal (sem bloquear a UI), com um comprimento mínimo de consulta (ex.: 2 caracteres) e debounce antes de disparar pedidos.

**Rationale**: Isto satisfaz FR-014 (âmbito = servidores/canais onde o utilizador é membro, porque só esses aparecem em `/api/servers`) e FR-015 (usa o endpoint de listagem já existente, não fica limitado ao que já esteja em memória) sem exigir nenhum endpoint novo de pesquisa no backend (FR-013).

**Alternatives considered**: Índice de pesquisa no servidor (full-text search em SQLite/FTS5) — melhor desempenho a escala, mas exige migração e endpoint novos, o que a spec exclui explicitamente para esta feature; fica como candidato natural para uma spec futura se o volume de mensagens justificar.

## 5. Modelo de notificações (FR-006, FR-016)

**Decision**: Um `Map<channelId, boolean>` em memória (sinal SolidJS), populado a partir do mesmo barramento de eventos WebSocket que o `App.tsx` já distribui a todos os subscritores (`onWs`). Ao receber `message.new` para um canal que não é o canal atualmente focado, marca-se esse canal como "tem atividade nova"; abrir o canal limpa a marca. O ícone de notificações mostra um indicador (contagem de canais com atividade, não de mensagens individuais) derivado deste mapa. Estado é por sessão — não sobrevive a um refresh (documentado em Assumptions do spec).

**Rationale**: Cumpre FR-016 à letra ("basear-se exclusivamente em eventos já recebidos... sem introduzir novo estado persistido no servidor"); reaproveita a infraestrutura de listeners WS que já existe em `App.tsx` para o handoff de chaves, sem novo canal de transporte.

**Alternatives considered**: Persistir "lido/não lido" no backend (por conta+canal) — mais correto a longo prazo (sobrevive a reload/múltiplos dispositivos), mas requer schema e endpoints novos, fora do âmbito desta spec.

## 6. Superfície de definições (FR-006, FR-017)

**Decision**: Painel modal via o componente `Dialog` já existente (mesmo padrão usado em "Criar servidor"/"Criar canal"), aberto a partir de um novo ícone de engrenagem na topbar. Consolida: o seletor de tema (hoje `theme-seg`, texto solto "Escuro/Claro") e a ação de terminar sessão (hoje: clique único no `user-chip`, que desliga a sessão sem confirmação — um risco de clique acidental que esta consolidação corrige de passagem).

**Rationale**: Uma rota nova (`/settings`) obrigaria a alterações no `Router` do `App.tsx` e em lógica de navegação; um `Dialog` é consistente com o resto do shell e mais barato de manter. Mover o logout para dentro de um painel deliberado, em vez de um único clique no chip de utilizador, reduz o risco de logout acidental sem exigir confirmação adicional — ganho de usabilidade coerente com o espírito da spec, mesmo não sendo um requisito explícito.

**Alternatives considered**: Rota `/settings` dedicada — mais "correcta" para definições extensas no futuro, mas desproporcional ao conteúdo atual (2 controlos); pode migrar para rota própria numa spec futura se a superfície crescer.

## 7. Estado "em chamada agora" no ícone de canal de voz (edge case da spec)

**Decision**: Fora de âmbito nesta spec — não adicionar um segundo estado visual ao `IconVoiceChannel`. A spec identifica o caso como edge case a considerar, mas nenhum FR o exige, e o shell já sinaliza participação ativa através da lista de membros por baixo do canal de voz (visível no protótipo de referência `docs/design-ref`). Revisitar apenas se uma spec futura pedir explicitamente esse sinal no próprio ícone da lista de canais.

**Rationale**: Evita introduzir um estado novo (e a lógica de o manter sincronizado via presence) sem requisito correspondente — alinhado com a instrução de não expandir âmbito além do pedido.
