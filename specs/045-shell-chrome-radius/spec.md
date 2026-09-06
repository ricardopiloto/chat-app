# Feature Specification: Cantos arredondados no chrome da shell

**Feature Branch**: `045-shell-chrome-radius`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Os cantos das divs [sidebar-header, sidebar-nav, user-panel, home-empty pane, server-rail, topbar] também devem ser mais arredondadas" (follow-up a 044-rounded-borders; contentores da shell ainda afiados)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chrome principal com cantos visíveis (Priority: P1)

Como utilizadora autenticada, quero que as **grandes áreas** da shell — barra superior (topbar), rail de servidores, coluna da sidebar (incluindo cabeçalho do servidor e lista de canais), painel de utilizador e painel principal (ex.: ecrã vazio / home-empty) — mostrem cantos **claramente arredondados**, e não só os botões/inputs interiores, para a interface parecer consistente após o arredondamento geral do sistema.

**Why this priority**: Feedback directo pós-044; o valor está nas superfícies de chrome que ainda lêem como rectângulos afiados.

**Independent Test**: Abrir a shell autenticada e observar topbar, rail, sidebar (header + nav + user panel) e pane principal — cada um destes contentores tem cantos redondos visíveis (não apenas filhos internos).

**Acceptance Scenarios**:

1. **Given** estou na shell autenticada, **When** olho para a topbar, o server-rail e a sidebar, **Then** os contentores dessas regiões têm cantos arredondados perceptíveis.
2. **Given** o cabeçalho do servidor (sidebar-header) e a lista de canais (sidebar-nav) estão visíveis, **When** inspecciono as suas bordas exteriores / cantos da coluna, **Then** o arredondamento é coerente com o resto do chrome (não “só o botão do canal”).
3. **Given** o painel de utilizador está no fundo da sidebar, **When** observo os cantos inferiores da coluna / do painel, **Then** também estão arredondados de forma alinhada ao chrome.
4. **Given** o painel principal mostra o estado vazio (`home-empty` / mensagem “Escolha um canal”), **When** observo o contentor do pane, **Then** os cantos estão arredondados como as outras grandes superfícies.

---

### User Story 2 - Cantos não cortados pelo layout (Priority: P1)

Como utilizadora, quero **ver** os cantos redondos (sem ficarem escondidos por vizinhos colados sem folga), para o pedido “mais arredondadas” ter efeito real nestas divs.

**Why this priority**: Contentores full-bleed colados anulam visualmente qualquer `border-radius`; sem folga/espaço, a feature falha o teste visual.

**Independent Test**: Nos sítios listados em US1, pelo menos um canto por região é visível contra o fundo da app (não “clipado” por um rectângulo vizinho sem intervalo).

**Acceptance Scenarios**:

1. **Given** a composição shell está no desktop, **When** comparo as junções entre rail ↔ sidebar ↔ pane e topbar ↔ corpo, **Then** o arredondamento não desaparece por falta de espaço entre superfícies (há margem/gutter ou composição equivalente que deixe os cantos legíveis).
2. **Given** tema claro e tema escuro, **When** repito a observação, **Then** os cantos continuam visíveis em ambos.

---

### User Story 3 - Stage / drawer sem regressão (Priority: P2)

Como utilizadora em canal de voz (modo palco) ou em viewport estreita (drawer), quero que o chrome continue utilizável e que o arredondamento não parta o layout (overflow, gaps estranhos, cantos a cortar conteúdo).

**Why this priority**: Completa o âmbito da shell; secundário ao desktop autenticado estático.

**Independent Test**: Entrar em voz (stage) e/ou reduzir viewport: chrome arredondado mantém-se ou adapta-se sem clip óbvio de texto/controlos.

**Acceptance Scenarios**:

1. **Given** estou em modo palco com sidebar colapsável, **When** expand/collapse a lista de canais, **Then** não há regressão grave de layout atribuída aos cantos/gutters.
2. **Given** viewport estreita com navegação em drawer, **When** abro a nav, **Then** rail/sidebar/pane mantêm cantos coerentes sem conteúdo cortado nas arestas.

---

### Edge Cases

- Avatars e ícones de servidor na rail MUST continuar circulares (fora do âmbito “caixa de chrome”).
- Bordas internas (dividers header/nav) MUST NOT criar “cantos falsos” confusos; o arredondamento prioriza o **contentor exterior** de cada região de chrome.
- Se header/nav/user-panel forem visualmente uma **única** coluna sidebar, o arredondamento MUST aplicar-se de forma coerente à coluna (não obrigar três cápsulas empilhadas se isso fragmentar a sidebar).
- Scroll dentro de `sidebar-nav` MUST NOT revelar cantos “rectos” a cortar o fundo de forma feia; overflow alinhado ao contentor arredondado.
- Sem alterar tipografia, cores de marca nem comportamento de navegação — só forma/espaçamento mínimo necessário para cantos visíveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A shell autenticada MUST aplicar cantos arredondados perceptíveis às regiões de chrome: **topbar**, **server-rail**, **sidebar** (incluindo a percepção de header + nav + user-panel) e **pane** principal (incluindo estado `home-empty`).
- **FR-002**: O grau MUST alinhar-se ao sistema actual de cantos “moderado–forte” (044): caixas de chrome claramente redondas, sem transformar a shell numa grelha de pílulas.
- **FR-003**: O layout MUST garantir que esses cantos sejam **visíveis** (folga/gutter ou composição equivalente entre regiões e/ou face ao fundo da app), não apenas declarados mas clipados por vizinhos a 0px.
- **FR-004**: Temas claro e escuro MUST partilhar o mesmo tratamento de cantos/gutters do chrome.
- **FR-005**: Círculos e pílulas intencionais (avatars, badges) MUST permanecer intactos.
- **FR-006**: Modo palco e drawer MUST NOT regredir usabilidade (clip de texto, gaps inutilizáveis, sobreposição de controlos) por causa do arredondamento do chrome.
- **FR-007**: Esta feature MUST NOT reabrir o âmbito de auditar todos os botões/inputs já cobertos por 044; o foco é **contentores de chrome** da shell listados pelo feedback.

### Key Entities

- **Região de chrome**: topbar, server-rail, sidebar (coluna), user-panel (parte inferior da sidebar), pane principal / home-empty.
- **Gutter de chrome**: espaço mínimo entre regiões (ou face ao fundo) que permite ver o raio.
- **Grau de raio do sistema**: o mesmo vocabulário moderado–forte já adoptado na Mesa (044).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual das 6 regiões apontadas (topbar, server-rail, sidebar-header/coluna, sidebar-nav, user-panel, home-empty/pane), 6/6 mostram cantos redondos **visíveis** (não só controlos interiores).
- **SC-002**: ≥2/3 revisores familiarizados com o pós-044 identificam “a shell em si ficou mais redonda”, sem serem guiados para botões.
- **SC-003**: Temas claro e escuro: 2/2 passam a mesma checklist de chrome.
- **SC-004**: Smoke em stage + viewport estreita: zero regressões de layout reportadas (conteúdo cortado / nav inutilizável) atribuídas a esta mudança.

## Assumptions

- 044 cobriu tokens e caixas interiores; o gap residual é **contentores full-bleed** da shell sem raio (ou com raio invisível por colagem).
- Default de composição: permitir **pequenos gutters / inset** entre regiões de chrome (ou face ao fundo da app) para os cantos serem legíveis — preferível a radius “fantasma” em painéis colados.
- Se header, nav e user-panel forem uma única coluna visual, arredondar a **sidebar como um todo** (com user-panel integrado) satisfaz o pedido sem três cartões empilhados obrigatórios.
- Fora de âmbito: redesenhar tipografia, cores, ícones; CSS de fornecedores; ecrãs de auth (salvo se partilharem exactamente as mesmas classes de shell — não é o caso típico).

## Out of Scope

- Reabrir mapeamento massivo de botões/inputs já feitos em 044.
- Tornar a rail/sidebar “floating Discord nitro” com sombras elaboradas (só o necessário para cantos + gutters).
- Preferência de utilizador para “cantos afiados”.
