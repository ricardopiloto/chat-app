# Feature Specification: Cantos arredondados no chrome da shell

**Feature Branch**: `045-shell-chrome-radius`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Os cantos das divs [sidebar-header, sidebar-nav, user-panel, home-empty pane, server-rail, topbar] também devem ser mais arredondadas" (follow-up a 044-rounded-borders; contentores da shell ainda afiados)

## Clarifications

### Session 2026-09-06

- Q: Como compor a sidebar (header / nav / user-panel)? → A: Cartões separados — header, nav e user-panel cada um com cantos + folga entre si
- Q: Intensidade dos gutters / floating entre regiões? → A: Subtil — folga pequena e uniforme entre cartões/regiões
- Q: Como posicionar a topbar no layout? → A: Cartão inset — topbar com folga face às bordas da app, alinhada às colunas abaixo

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chrome principal com cantos visíveis (Priority: P1)

Como utilizadora autenticada, quero que as **grandes áreas** da shell — barra superior (topbar), rail de servidores, coluna da sidebar (incluindo cabeçalho do servidor e lista de canais), painel de utilizador e painel principal (ex.: ecrã vazio / home-empty) — mostrem cantos **claramente arredondados**, e não só os botões/inputs interiores, para a interface parecer consistente após o arredondamento geral do sistema.

**Why this priority**: Feedback directo pós-044; o valor está nas superfícies de chrome que ainda lêem como rectângulos afiados.

**Independent Test**: Abrir a shell autenticada e observar topbar, rail, sidebar (header + nav + user panel) e pane principal — cada um destes contentores tem cantos redondos visíveis (não apenas filhos internos).

**Acceptance Scenarios**:

1. **Given** estou na shell autenticada, **When** olho para a topbar, o server-rail e a sidebar, **Then** os contentores dessas regiões têm cantos arredondados perceptíveis; a **topbar** é um cartão com **inset** (folga face às bordas da app), alinhada às colunas abaixo — não full-bleed à janela.
2. **Given** o cabeçalho do servidor (sidebar-header) e a lista de canais (sidebar-nav) estão visíveis, **When** inspecciono cada um, **Then** são **cartões distintos** com cantos arredondados e folga entre si (não uma única caixa sem divisão visual).
3. **Given** o painel de utilizador está no fundo da sidebar, **When** observo o user-panel, **Then** é um cartão próprio com cantos arredondados e folga face ao nav acima.
4. **Given** o painel principal mostra o estado vazio (`home-empty` / mensagem “Escolha um canal”), **When** observo o contentor do pane, **Then** os cantos estão arredondados como as outras grandes superfícies.

---

### User Story 2 - Cantos não cortados pelo layout (Priority: P1)

Como utilizadora, quero **ver** os cantos redondos (sem ficarem escondidos por vizinhos colados sem folga), para o pedido “mais arredondadas” ter efeito real nestas divs.

**Why this priority**: Contentores full-bleed colados anulam visualmente qualquer `border-radius`; sem folga/espaço, a feature falha o teste visual.

**Independent Test**: Nos sítios listados em US1, pelo menos um canto por região é visível contra o fundo da app (não “clipado” por um rectângulo vizinho sem intervalo).

**Acceptance Scenarios**:

1. **Given** a composição shell está no desktop, **When** comparo as junções entre rail ↔ sidebar ↔ pane, topbar ↔ corpo, e entre header ↔ nav ↔ user-panel, **Then** há **folga subtil e uniforme** (não quase-colado nem gaps generosos tipo dashboard) que deixa os cantos legíveis.
2. **Given** tema claro e tema escuro, **When** repito a observação, **Then** os cantos e a folga subtil continuam visíveis em ambos.

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
- Bordas internas (dividers header/nav) MUST NOT criar “cantos falsos” confusos; com cartões separados, preferir folga entre cartões em vez de só uma linha afiada dentro do mesmo bloco.
- Header, nav e user-panel MUST ser **cartões distintos** (cantos + folga); não fundir a sidebar numa única cápsula que esconda esses três contentores.
- Scroll dentro de `sidebar-nav` MUST NOT revelar cantos “rectos” a cortar o fundo de forma feia; overflow alinhado ao cartão do nav.
- Sem alterar tipografia, cores de marca nem comportamento de navegação — só forma/espaçamento mínimo necessário para cantos visíveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A shell autenticada MUST aplicar cantos arredondados perceptíveis às regiões de chrome: **topbar**, **server-rail**, **sidebar-header**, **sidebar-nav**, **user-panel** (cada um como superfície distinta) e **pane** principal (incluindo estado `home-empty`).
- **FR-002**: O grau MUST alinhar-se ao sistema actual de cantos “moderado–forte” (044): caixas de chrome claramente redondas, sem transformar a shell numa grelha de pílulas.
- **FR-003**: O layout MUST usar **gutters subtis e uniformes** entre cartões/regiões (e face ao fundo da app quando necessário) para os cantos serem **visíveis** — nem quase-colados (raio clipado) nem gaps generosos de “floating dashboard”.
- **FR-004**: Temas claro e escuro MUST partilhar o mesmo tratamento de cantos/gutters do chrome.
- **FR-005**: Círculos e pílulas intencionais (avatars, badges) MUST permanecer intactos.
- **FR-006**: Modo palco e drawer MUST NOT regredir usabilidade (clip de texto, gaps inutilizáveis, sobreposição de controlos) por causa do arredondamento do chrome.
- **FR-007**: Esta feature MUST NOT reabrir o âmbito de auditar todos os botões/inputs já cobertos por 044; o foco é **contentores de chrome** da shell listados pelo feedback.
- **FR-008**: **sidebar-header**, **sidebar-nav** e **user-panel** MUST ser **cartões separados** (cada um com cantos + folga subtil entre si), não uma única coluna visual sem divisão.
- **FR-009**: A intensidade da folga MUST ser **subtil** (clarificado 2026-09-06): pequena e uniforme em toda a shell autenticada.
- **FR-010**: A **topbar** MUST ser um **cartão inset** (folga face às bordas da app), alinhada visualmente às colunas abaixo — MUST NOT permanecer full-bleed colada às bordas da janela.

### Key Entities

- **Região de chrome**: topbar, server-rail, sidebar-header, sidebar-nav, user-panel, pane principal / home-empty (cada uma como cartão/superfície distinta onde aplicável).
- **Cartão de sidebar**: um dos três blocos header | nav | user-panel, com raio próprio e gutter subtil face aos vizinhos.
- **Gutter de chrome**: folga **subtil e uniforme** entre regiões/cartões (ou face ao fundo) que permite ver o raio.
- **Grau de raio do sistema**: o mesmo vocabulário moderado–forte já adoptado na Mesa (044).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual das 6 regiões apontadas (topbar, server-rail, sidebar-header, sidebar-nav, user-panel, home-empty/pane), 6/6 mostram cantos redondos **visíveis** como cartões/superfícies distintas (não só controlos interiores).
- **SC-002**: ≥2/3 revisores familiarizados com o pós-044 identificam “a shell em si ficou mais redonda”, sem serem guiados para botões.
- **SC-003**: Temas claro e escuro: 2/2 passam a mesma checklist de chrome.
- **SC-004**: Smoke em stage + viewport estreita: zero regressões de layout reportadas (conteúdo cortado / nav inutilizável) atribuídas a esta mudança.
- **SC-005**: Em revisão informal, a folga entre cartões lê-se como **subtil** (não “quase colado” nem “dashboard com gaps largos”) em ≥2/3 dos revisores.

## Assumptions

- 044 cobriu tokens e caixas interiores; o gap residual é **contentores full-bleed** da shell sem raio (ou com raio invisível por colagem).
- Default de composição: **gutters subtis e uniformes** (clarificado 2026-09-06) entre cartões/regiões (e face ao fundo da app quando necessário) para os cantos serem legíveis — preferível a radius “fantasma” em painéis colados; rejeitado mínimo quase-colado e generoso tipo dashboard.
- Composição da sidebar (clarificado 2026-09-06): **cartões separados** para header, nav e user-panel (cantos + folga subtil entre si), não coluna una.
- Topbar (clarificado 2026-09-06): **cartão inset** alinhado às colunas; rejeitado full-bleed à janela e rejeitada faixa única só com inset externo sem alinhamento às colunas.
- Fora de âmbito: redesenhar tipografia, cores, ícones; CSS de fornecedores; ecrãs de auth (salvo se partilharem exactamente as mesmas classes de shell — não é o caso típico).

## Out of Scope

- Reabrir mapeamento massivo de botões/inputs já feitos em 044.
- Tornar a rail/sidebar “floating Discord nitro” com sombras elaboradas (só o necessário para cantos + gutters).
- Preferência de utilizador para “cantos afiados”.
