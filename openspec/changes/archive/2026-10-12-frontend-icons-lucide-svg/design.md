# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `frontend/src/components/ui/Icon.tsx` (14 linhas, implementação completa hoje): `<span class="material-symbols-outlined" style={props.filled ? {"font-variation-settings":"'FILL' 1"} : undefined}>{props.name}</span>` — o nome é a *ligature* da fonte Material Symbols.
- `frontend/index.html:11`: `<link>` do Google Fonts carregando `Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200`.
- `frontend/src/styles.css:11-15`: regra base `.material-symbols-outlined{font-family:"Material Symbols Outlined";font-size:24px;...}`.
- `.material-symbols-outlined` é também referenciado directamente (selector CSS, não via prop) em `frontend/src/voice.css`, `mgmt.css`, `chat.css` e `components/ui.css`, para overrides de tamanho por contexto (ex. `.ui-button .material-symbols-outlined{@apply text-[20px]}`).
- ≈130 nomes distintos de ícone em uso (`grep -rohE '<Icon name=' frontend/src --include=*.tsx | sort -u | wc -l`), com a maioria dos call-sites a passar uma string literal (ex. `<Icon name="search"/>`) mas vários a passar um **valor vindo de dados** — `InspectPanel.tsx:30` (`props.icon`), `KeyCustody.tsx:24`, `ChannelSettingsDialog.tsx:60`, `SettingsSidebar.tsx:55`, `Roles.tsx:254` (todos `{item.icon}`/`{entry.icon}`/`{group.icon}`, valores que vivem em arrays de configuração noutros ficheiros, não no JSX do call-site).
- `docs/v2/mesa_sistema_de_design_tokens_componentes_guia_de_ui/code.html`, secção "06 // Iconografia" (linha 820): grelha 24×24, `stroke-width="2"`, `fill="none"`, estado comunicado por cor/fundo do contentor — confirmado via pesquisa prévia (ver resumo da investigação nesta conversa).
- `lucide-solid` (pacote npm, confirmado via pesquisa web: mantido pela organização `lucide-icons`, compatível com Solid 1.x — o projecto usa `solid-js@^1.9.9`, Solid 1 — 1600+ ícones, cada um um componente Solid que renderiza um `<svg>` inline, *tree-shakeable* por importação nomeada) é o pacote a usar, não cópia manual de paths SVG.

## Goals / Non-Goals

**Goals:**
- Ícones passam a ser SVG inline Lucide (grelha 24×24, traço 2px, `fill="none"` por omissão), como a secção 06 do guia de tokens especifica.
- Zero alteração nos ≈130 call-sites de `<Icon name=.../>` (literais ou vindos de dados) — só o módulo `Icon.tsx` e um novo mapa de nomes mudam.
- As regras de tamanho por contexto já existentes (`voice.css`, `mgmt.css`, `chat.css`, `components/ui.css`) continuam a funcionar sem reescrever cada uma.

**Non-Goals:**
- Mudar a paleta de cores dos tokens (já decidido noutro lugar — `foundation/spec.md` Scenario "Paleta de origem única" — e fora do pedido actual).
- Introduzir um eixo de preenchimento variável equivalente ao `FILL` da Material Symbols — Lucide não tem isso; a Decisão 3 resolve o prop `filled` de outra forma, mais simples.
- Rever/trocar a fonte de texto (Inter/JetBrains Mono/Plus Jakarta Sans) — inalterada.

## Decisions

### 1. Mapa de nomes centralizado em `Icon.tsx`, call-sites inalterados

Os ≈130 nomes continuam a ser as strings Material-Symbols já em uso hoje (`"search"`, `"mic"`, `"arrow_downward"`, etc.) — **não** se migra cada call-site para o nome nativo do Lucide (`Search`, `Mic`, `ArrowDown`). Em vez disso, um novo módulo (ex. `frontend/src/components/ui/icon-map.ts`) exporta um `Record<string, Component<LucideProps>>` traduzindo cada nome Material-Symbols já em uso para o componente Lucide equivalente; `Icon.tsx` passa a fazer `const Glyph = iconMap[props.name]` e renderizar `<Glyph .../>`.

Alternativa descartada: migrar todos os call-sites para nomes nativos Lucide. Rejeitada — alguns call-sites (`InspectPanel.tsx:30`, `KeyCustody.tsx:24`, `ChannelSettingsDialog.tsx:60`, `SettingsSidebar.tsx:55`, `Roles.tsx:254`) recebem o nome como **dado**, vindo de arrays de configuração separados do JSX; migrar esses exigiria caçar e editar cada array de configuração espalhado pela base de código, multiplicando o risco de erro (um nome esquecido falha silenciosamente, sem erro de tipo, já que `name` é `string`) sem nenhum benefício — o mapa centralizado isola toda a troca de biblioteca num único módulo novo, auditável de uma vez.

### 2. Pacote `lucide-solid`, não cópia manual de SVGs

Confirmado por pesquisa que `lucide-solid` é o pacote oficial da organização `lucide-icons` para Solid 1.x (o projecto usa Solid 1), com *tree-shaking* por importação nomeada — só os ícones realmente importados (os ≈130 mapeados) entram no bundle final, não a biblioteca completa de 1600+.

Alternativa descartada: copiar manualmente os `path` SVG de cada ícone necessário para dentro do próprio `icon-map.ts`. Rejeitada — perde actualizações/correcções da biblioteca, e o ganho (evitar uma dependência) é marginal já que o projecto já depende de pacotes de peso semelhante (`livekit-client`, `tweetnacl`); usar o pacote é menos código para manter.

### 3. O prop `filled` passa a controlar `fill`, não um eixo de fonte

`Icon.tsx` perde a `style={{"font-variation-settings": ...}}` e passa a fazer `<Glyph fill={props.filled ? "currentColor" : "none"} .../>` — os componentes Lucide aceitam `fill` como prop SVG, sem precisar de wrapper extra. O único call-site actual que usa `filled` (`frontend/src/shell/ServerRail.tsx:46`, `<Icon name="volume_up" class="text-[10px]" filled />`) continua a funcionar com a mesma assinatura — só o resultado visual muda (ícone preenchido via `fill`, não via eixo de fonte), que é precisamente o que "preenchido" deve parecer com um ícone de traço. **Nota (achado de `review-fullstack.md`)**: o nome exacto da prop para a largura do traço (`strokeWidth` em camelCase, à semelhança de `lucide-react`, ou `stroke-width`) não está confirmado sem o pacote instalado — a Tarefa 2.1/2.2 de `tasks.md` confirma isto contra os tipos reais do pacote antes de escrever o código; o valor por omissão do Lucide já é 2px, por isso mesmo que a prop não seja lida, o resultado visual não muda.

### 4. Classe CSS estável `.ui-icon` substitui `.material-symbols-outlined` como selector de tamanho

`Icon.tsx` passa `class={\`ui-icon ${props.class ?? ""}\`}` ao componente Lucide (que a mescla na `<svg>` renderizada). Em `frontend/src/styles.css`, a regra base de `.material-symbols-outlined` (linha 11-15, hoje baseada em `font-size`) é substituída por uma base `.ui-icon{width:1em;height:1em;...}` (tamanho herdado do `font-size` do elemento envolvente, ou um valor fixo de 24px como omissão, a decidir na implementação). As 4 outras folhas (`voice.css`, `mgmt.css`, `chat.css`, `components/ui.css`) só precisam de uma substituição mecânica do selector `.material-symbols-outlined` → `.ui-icon` (mesmas regras, mesmos valores `text-[Npx]`/`@apply`) — nenhuma delas precisa de reescrever os valores de tamanho em si.

Alternativa descartada: reescrever cada uma das dezenas de regras de tamanho existentes para um novo mecanismo (ex. prop `size` em vez de classe CSS). Rejeitada — maior superfície de mudança sem benefício para esta change; o mecanismo actual (CSS por contexto) já funciona bem, só precisa de continuar a encontrar o elemento certo.

### 5. `visual-fidelity` ganha uma excepção explícita para a forma do glifo

**Achado das revisões (`review-architect.md` e `review-fullstack.md`)**: os outros 30 mockups de produto (`docs/v2/mesa_*/code.html`, incluindo os `screen.png` usados como referência de fidelidade) renderizam Material Symbols, não Lucide — depois desta change, todo ícone de toda tela diverge em forma de glifo do seu `screen.png`. Sem ajuste, isto degradaria pela letra actual do requisito a classificação de todas as telas já certificadas **Fiel** (`docs/v2/AUDIT-fidelity.md` §9). Corrigido com um delta `MODIFIED` a `openspec/specs/frontend-v2/visual-fidelity/spec.md`, que passa a excluir explicitamente a forma do glifo (Lucide vs. Material Symbols) do critério de classificação — a comparação de ícones passa a incidir sobre posição/tamanho/estado, não sobre o desenho exacto do traço.

## Risks / Trade-offs

- [Nem todo nome Material-Symbols em uso tem um equivalente Lucide óbvio/exacto (glifos diferentes, nem sempre há correspondência 1:1 de conceito)] → Mitigação: a Tarefa de construção do mapa (`tasks.md`) exige enumerar os ≈130 nomes reais em uso (literais e vindos de dados) antes de escolher o equivalente para cada um, e registar explicitamente qualquer escolha que seja só "mais próxima" em vez de exacta — não adivinhar silenciosamente.
- [Esquecer um nome no mapa falha silenciosamente em tempo de execução, já que `name` é `string` sem validação de tipo em tempo de compilação] → Mitigação: a Tarefa de verificação roda a aplicação e inspecciona visualmente cada ecrã (ou escreve um pequeno script `verify-*.mjs` que importa `icon-map.ts` e confirma que todo nome usado em `grep -rohE '<Icon name="[a-z_]+"' frontend/src` tem uma entrada), para apanhar lacunas antes de entregar.
- [Bundle: 130 ícones Lucide importados individualmente ainda somam algum peso] → Mitigação: aceite — é uma fracção pequena de um pacote de 1600+ ícones com *tree-shaking*, e substitui o carregamento de uma fonte variável completa (`opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200`) que também tinha peso.

## Migration Plan

Mudança isolada a `Icon.tsx` + um módulo novo (`icon-map.ts`) + 5 folhas CSS (substituição mecânica de selector) + `index.html` (remover um `<link>`) + `package.json` (nova dependência `lucide-solid`). Nenhum call-site de `<Icon name=.../>` precisa de edição. Sem dependência de nenhuma outra change em curso.
