# Feature Specification: Logo Mesa na topbar

**Feature Branch**: `051-topbar-logo-image`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Atualize o logo na aplicação para a imagem imgs/logo.png … topbar-brand (actualmente o texto «Mesa»)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marca visual na topbar (Priority: P1)

Como utilizador autenticado, quero ver o logótipo Mesa (imagem fornecida) na barra superior no sítio da marca, para reconhecer a aplicação de imediato.

**Why this priority**: Pedido explícito; a marca actual é um quadrado de cor + texto.

**Independent Test**: Abrir a app autenticada → na topbar, a área da marca mostra a imagem do logo; o nome acessível da aplicação continua claro.

**Acceptance Scenarios**:

1. **Given** estou na shell autenticada, **When** olho a marca na topbar (área de brand), **Then** vejo a imagem do logótipo Mesa (não apenas um bloco de cor sólido genérico).
2. **Given** a mesma vista, **When** inspecciono a marca para leitores de ecrã / acessibilidade, **Then** a aplicação continua identificável como «Mesa» (nome acessível presente).

---

### User Story 2 - Tema claro e escuro (Priority: P2)

Como utilizador que alterna tema claro/escuro, quero que o logo continue legível e nítido em ambos.

**Why this priority**: O asset é escuro; não pode desaparecer no tema escuro nem ficar ilegível no claro.

**Independent Test**: Alternar tema → logo visível e com cantos/proporção coerentes com o chrome.

**Acceptance Scenarios**:

1. **Given** tema escuro, **When** olho a topbar, **Then** o logo está visível e nítido.
2. **Given** tema claro, **When** olho a topbar, **Then** o logo permanece reconhecível (sem «sumir» no fundo).

---

### User Story 3 - Ecrã de autenticação alinhado (Priority: P2)

Como visitante no ecrã de login/registo, quero a mesma marca visual Mesa usada na shell, para consistência de produto.

**Why this priority**: O ecrã de auth já usa o mesmo «mark» + nome; evitar duas identidades.

**Independent Test**: Abrir login → brand pane mostra a mesma imagem de logo (proporção adequada ao layout de auth).

**Acceptance Scenarios**:

1. **Given** o ecrã de autenticação, **When** olho o bloco de marca, **Then** vejo a mesma imagem de logo Mesa (não o quadrado de cor antigo).

---

### Edge Cases

- Viewport estreita / menu hamburger: o logo cabe na topbar sem empurrar acções críticas para fora.
- Imagem em falta / falha de carga: o nome «Mesa» (ou fallback textual) continua perceptível.
- Preferência de movimento reduzido: sem animação obrigatória no logo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A área de marca da topbar autenticada MUST apresentar o logótipo Mesa a partir do asset de imagem fornecido pelo produto (`imgs/logo.png` na origem do pedido).
- **FR-002**: O marcador de marca antigo (bloco de cor sólido sem imagem) MUST ser substituído por essa imagem na topbar.
- **FR-003**: A marca MUST permanecer acessível como «Mesa» (texto visível e/ou nome acessível equivalente).
- **FR-004**: O logo MUST manter proporções correctas (sem distorção) e encaixar no ritmo visual da topbar (altura alinhada aos controlos vizinhos).
- **FR-005**: O logo MUST ser legível em tema claro e escuro.
- **FR-006**: O ecrã de autenticação MUST usar a mesma imagem de logo no bloco de marca (substituindo o mark de cor sólido).

### Key Entities

- **Logótipo Mesa**: asset de imagem oficial da marca (ícone quadrado arredondado com grelha e acento luminoso).
- **Área de marca (topbar)**: região esquerda da barra superior da shell.
- **Área de marca (auth)**: bloco de marca no painel de autenticação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 aberturas da shell autenticada, 10/10 vezes a topbar mostra a imagem do logo (não o bloco de cor genérico).
- **SC-002**: Em 5 verificações em tema claro e 5 em escuro, 10/10 o logo é reconhecível sem zoom.
- **SC-003**: Em 5 aberturas do ecrã de auth, 5/5 mostram a mesma imagem de logo no bloco de marca.
- **SC-004**: Em viewport estreita (~375px de largura), a topbar mantém o logo visível e as acções essenciais (pesquisa/tema) utilizáveis sem overflow horizontal indesejado.

## Assumptions

- O ficheiro fonte é `imgs/logo.png` no repositório; a entrega inclui-o nos assets servidos pela app frontend.
- O logo é um ícone (sem wordmark na imagem); o texto «Mesa» pode permanecer ao lado ou ser representado só de forma acessível — default: **imagem + texto «Mesa»** na topbar e no auth, substituindo apenas o mark colorido.
- Favicon / PWA icons / metadados de instalação ficam fora de âmbito salvo se já partilharem o mesmo asset por conveniência mínima.
- Não se pede redesign da topbar além da marca.

## Out of Scope

- Novo sistema de design / rebrand completo.
- Variantes claras/escuras separadas do logo (usar o mesmo PNG com CSS mínimo se necessário).
- Actualização obrigatória de favicon, Open Graph ou store listings.
