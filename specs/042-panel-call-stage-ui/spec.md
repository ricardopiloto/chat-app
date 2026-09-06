# Feature Specification: Painel de chamada e espaço do palco

**Feature Branch**: `042-panel-call-stage-ui`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "o botão de sair da chamada em … user-panel-calls is-disabled só deve ficar visível, se o usuário estiver em chamada de voz. Os ícones (microfone, câmera, deafen, sair de chamada) devem ter o mesmo tamanho. Aumente um pouco o espaço vertical que … stage ocupa da tela quando em chamada."

**Depends on**: barra de utilizador / controlos de chamada ([039-floating-user-bar](../039-floating-user-bar/)); vista de mesa de voz / palco.

## Clarifications

### Session 2026-09-06

- Q: Quanto (e de onde) ganhar altura no palco? → A: Compactar chrome vertical da mesa (margens do palco + cabeçalho/linha de privacidade) ~40–80px no total; call-controls e header permanecem utilizáveis (Option B).
- Q: Referência de tamanho dos ícones no painel? → A: **Não** precisam igualar o palco. Coerência estética no painel: os quatro (mic, deafen, câmera, sair) com o **mesmo tamanho**, usando o **ícone do microfone do painel como base**; devem caber no espaço actual do painel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controlos de chamada só quando em chamada (Priority: P1)

Como utilizador autenticado **fora** de uma chamada, quero que o grupo de controlos de chamada no painel inferior (microfone, ensurdecer, câmera, sair) **não apareça** — nem desabilitado — para o painel mostrar só identidade/conta e não sugerir acções de chamada inúteis.

**Why this priority**: Pedido explícito; o estado actual com controlos desabilitados (`is-disabled`) ocupa espaço e confunde.

**Independent Test**: Sem estar em voz → painel inferior sem fila de botões de chamada; entrar numa chamada e sair da mesa → a fila aparece activa; sair da chamada → a fila desaparece de novo.

**Acceptance Scenarios**:

1. **Given** não estou em nenhuma chamada de voz, **When** olho o painel de utilizador no fundo da barra lateral, **Then** **não** vejo o grupo de controlos de chamada (microfone, ensurdecer, câmera, sair) — nem cinzentos/desabilitados.
2. **Given** estou em chamada e **não** estou na vista da mesa dessa chamada, **When** olho o painel, **Then** o grupo de controlos de chamada está **visível e utilizável**.
3. **Given** estou em chamada e estou **na** vista da mesa dessa chamada, **When** olho o painel, **Then** o grupo continua **oculto** no painel (os controlos activos permanecem no palco), como já acordado para um único sítio activo.
4. **Given** encerro a chamada (pelo painel, palco ou outro sítio válido), **When** o estado deixa de ser «em chamada», **Then** o grupo de controlos no painel desaparece de imediato.

---

### User Story 2 - Ícones de chamada com o mesmo tamanho (Priority: P1)

Como participante em chamada a usar o painel, quero que os ícones de microfone, ensurdecer, câmera e sair tenham **o mesmo tamanho visual** entre si (base = microfone do painel), com coerência estética no espaço actual do painel — **sem** obrigar igualdade com os ícones do palco.

**Why this priority**: Pedido explícito de alinhamento visual; inconsistência actual entre botões (ex. sair vs mic).

**Independent Test**: Em chamada fora da mesa → comparar os quatro controlos principais; glifos alinhados ao tamanho do microfone do painel; cabem na fila actual.

**Acceptance Scenarios**:

1. **Given** o grupo de controlos está visível no painel, **When** comparo microfone, ensurdecer, câmera (botão principal) e sair, **Then** os ícones têm o **mesmo tamanho** aparente, tomando o **microfone do painel** como referência; os botões partilham a mesma altura/caixa de toque e cabem no layout actual do painel.
2. **Given** o chevron de blur junto à câmera (se presente), **When** avalio o conjunto, **Then** o botão principal da câmera mantém o mesmo tamanho de ícone que mic/deafen/sair; o chevron pode ser mais estreito; **não** é requisito igualar o tamanho aos call-controls do palco.

---

### User Story 3 - Mais espaço vertical para o palco na chamada (Priority: P1)

Como participante na mesa de voz, quero que a grelha do **palco** (área dos slots de vídeo) ocupe **mais** da altura útil do ecrã (ganho moderado ~40–80px via chrome compactado), para os vídeos/slots serem maiores.

**Why this priority**: Pedido explícito; melhora a leitura da cena em chamada.

**Independent Test**: Entrar na mesa em chamada → o bloco do palco ocupa mais altura relativa na área principal do que antes desta feature (comparação side-by-side ou checklist visual).

**Acceptance Scenarios**:

1. **Given** estou na vista da mesa com chamada activa, **When** olho a área principal, **Then** a região do palco usa **mais espaço vertical** do que antes — ganho moderado obtido ao compactar margens do palco e chrome do cabeçalho/linha de privacidade (ordem de ~40–80px no total), sem ecrã inteiro sem chrome.
2. **Given** o mesmo estado, **When** uso controlos da chamada e cabeçalhos essenciais, **Then** esses elementos **continuam acessíveis** (não são empurrados para fora da janela nem ficam inutilizáveis).
3. **Given** viewport estreita / drawer, **When** estou em chamada no palco, **Then** o ganho de altura do palco mantém-se sem partir o layout (sem scroll absurdo ou slots invisíveis).

---

### Edge Cases

- Utilizador em chamada noutro servidor com PiP: o grupo no painel segue a regra «em chamada e fora da mesa activa» — visível se a mesa da chamada não for a vista actual.
- Transição rápida entrar/sair de chamada: o grupo não deve ficar «fantasma» desabilitado; ou aparece activo ou some.
- Tema claro/escuro: tamanhos iguais e palco maior aplicam-se em ambos.
- Blur menu aberto: não altera a regra de visibilidade do grupo nem o tamanho base dos ícones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Fora de uma chamada de voz activa, o painel de utilizador MUST NOT mostrar o grupo de controlos de chamada (microfone, ensurdecer, câmera/blur, sair), incluindo estados desabilitados/visíveis-inúteis.
- **FR-002**: Em chamada de voz activa e **fora** da vista da mesa dessa chamada, o painel MUST mostrar o grupo de controlos de chamada activo (comportamento de produto já esperado para o sítio off-stage).
- **FR-003**: Em chamada e **na** vista da mesa dessa chamada, o painel MUST NOT mostrar o grupo de controlos de chamada (sítio activo = palco).
- **FR-004**: Esta feature supersede, no painel, a apresentação «visível mas desabilitado» fora de chamada definida em [039](../039-floating-user-bar/) — passa a **ocultar** o grupo nesse caso.
- **FR-005**: No grupo visível do painel, os ícones de microfone, ensurdecer, câmera (controlo principal) e sair MUST ter o mesmo tamanho visual entre si, usando o **ícone do microfone do painel como base**; MUST caber esteticamente no espaço actual do painel; MUST NOT exigir igualdade de tamanho com os call-controls do palco; os alvos de clique no painel MUST partilhar a mesma altura.
- **FR-006**: Na vista da mesa com chamada activa, a área do palco (grelha de slots) MUST ocupar uma fracção vertical **maior** da área principal do que antes desta alteração, ao compactar chrome vertical da mesa (margens do palco e espaço do cabeçalho / linha de privacidade), com ganho total tipicamente na ordem de **~40–80px** — sem reduzir call-controls do palco a um tamanho inutilizável.
- **FR-007**: O aumento de espaço do palco MUST NOT tornar inacessíveis os controlos essenciais da chamada no palco nem o chrome mínimo necessário à navegação.
- **FR-008**: Identidade, indicador online, handle e acesso à conta no painel MUST permanecerem visíveis independentemente de estar ou não em chamada.

### Key Entities

- **Grupo de controlos de chamada (painel)**: fila de acções de mídia/sair no painel inferior; agora condicionado a «em chamada ∧ fora da mesa».
- **Palco**: região principal da mesa de voz com a grelha de slots; deve ganhar altura relativa em chamada.
- **Chamada activa**: sessão de voz em que o utilizador está ligado (mesmo critério de produto já usado para PiP/painel).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 verificações sem chamada, 10/10 vezes o grupo de controlos de chamada **não** está presente no painel (0 botões mic/deafen/cam/sair nessa fila).
- **SC-002**: Em 10 sessões «em chamada + canal de texto», 10/10 vezes o grupo aparece no painel e desaparece ao encerrar a chamada.
- **SC-003**: Em revisão visual informal, ≥80% dos observadores consideram os quatro ícones principais do painel «do mesmo tamanho» entre si (referência: microfone do painel), sem exigir alinhamento ao palco.
- **SC-004**: Em comparação antes/depois na mesma janela de desktop típica, a altura útil do palco em chamada aumenta de forma perceptível na ordem de **~40–80px** (via menos margem/padding do palco e chrome de cabeçalho/privacidade), sem esconder nem inutilizar os botões de chamada do palco.
- **SC-005**: Utilizadores de teste deixam de reportar «botões de chamada cinzentos quando não estou em call» no painel.

## Assumptions

- A regra de «um sítio activo» (palco vs painel) de 039 mantém-se; esta feature só muda a visibilidade **fora de chamada** (ocultar em vez de desabilitar) e o polish de tamanho/altura.
- «Mesmo tamanho» no painel = os quatro controlos principais iguais entre si, **base = ícone do microfone do painel**; caber no layout actual; **não** exige igualdade com o palco; o chevron de blur pode ser mais estreito.
- O aumento do palco é moderado (~40–80px via margens + header/privacy); não ecrã completo sem cabeçalho/controlos; call-controls do palco não são o alvo principal de compressão.
- Não se pede alteração ao PiP nem novos controlos de chamada.
- Sem requisitos de backend nesta entrega.
