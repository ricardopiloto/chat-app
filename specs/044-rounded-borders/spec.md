# Feature Specification: Bordas mais arredondadas em todo o sistema

**Feature Branch**: `044-rounded-borders`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Vamos fazer bordas mais arredondadas pelo sistema"

## Clarifications

### Session 2026-09-06

- Q: Qual o grau de arredondamento das caixas (relativo ao baseline actual)? → A: Moderado–forte — claramente mais redondo; caixas ainda ≠ pílulas
- Q: Qual o alcance da actualização (tokens vs hardcodes)? → A: Tokens + alinhar hardcodes de caixas no tema Mesa (shell, auth, voz); sem auditoria exaustiva de todo o CSS/inline
- Q: Como escala o raio entre superfícies pequenas e grandes? → A: Escala partilhada — sm/md/lg sobem juntos (proporcional ao grau moderado–forte)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interface visualmente mais suave (Priority: P1)

Como utilizadora da Mesa, quero que painéis, botões, campos e cartões em toda a aplicação tenham cantos **mais arredondados** do que hoje, para a interface parecer mais moderna e acolhedora, de forma consistente em claro e escuro.

**Why this priority**: Pedido principal; o valor é perceptível em qualquer ecrã autenticado.

**Independent Test**: Abrir a app (sidebar, canal de texto, diálogos, painel de utilizador) e comparar com o estado anterior — cantos de superfícies rectangulares estão claramente mais redondos, sem quebrar layouts.

**Acceptance Scenarios**:

1. **Given** estou autenticada na shell principal, **When** observo painéis, botões primários/secundários e campos de texto, **Then** os cantos dessas superfícies estão visivelmente mais arredondados do que na versão anterior.
2. **Given** abro um diálogo ou menu flutuante, **When** vejo o contentor, **Then** o raio dos cantos acompanha o mesmo “grau” de arredondamento do resto do sistema.
3. **Given** alterno entre tema claro e tema escuro, **When** revisito os mesmos componentes, **Then** o arredondamento permanece consistente (não só num tema).

---

### User Story 2 - Formas especiais preservadas (Priority: P1)

Como utilizadora, quero que elementos pensados para serem **círculos** ou **pílulas** (avatars, indicadores, chips totalmente redondos) continuem a ler-se como círculos/pílulas, e não como “caixas só um pouco mais redondas”, para não perder significado visual.

**Why this priority**: Evita regressão estética e de UX em controlos já circulares.

**Independent Test**: Avatars, botões-ícone circulares e badges em pílula continuam redondos a 100% (ou equivalente visual); só caixas/painéis “rectangulares” ganham mais raio.

**Acceptance Scenarios**:

1. **Given** vejo avatars e ícones de servidor na rail, **When** inspecciono a forma, **Then** continuam circulares (não viram rectângulos com cantos grandes).
2. **Given** vejo controlos ou badges desenhados como pílula, **When** os comparo com antes, **Then** mantêm o aspecto de pílula; o aumento de raio aplica-se às superfícies “caixa”.

---

### User Story 3 - Coerência em ecrãs de chamada e auth (Priority: P2)

Como utilizadora, quero o mesmo tratamento de cantos no palco/chamada e nos ecrãs de autenticação/convite, para a marca Mesa não “mudar de personalidade” ao mudar de ecrã.

**Why this priority**: Completa o “pelo sistema”; secundário ao shell principal mas ainda no âmbito.

**Independent Test**: Pré-join / controlos de chamada e ecrã de login/auth mostram o mesmo grau de arredondamento das caixas do shell.

**Acceptance Scenarios**:

1. **Given** estou num canal de voz (pré-join ou controlos), **When** vejo cartões/botões de caixa, **Then** usam o mesmo sistema de cantos mais arredondados.
2. **Given** estou no ecrã de autenticação ou convite, **When** vejo o formulário/painéis, **Then** os cantos seguem o mesmo padrão (sem regressar ao estilo antigo).

---

### Edge Cases

- Elementos com raio **assimétrico** (só um lado arredondado) MUST manter a intenção (ex.: só cantos esquerdos), apenas escalando o valor para o novo grau do sistema.
- Scrollbars, focus rings e overlays fullscreen MUST NOT forçar cantos que quebrem a área útil ou criem “buracos” estranhos.
- Densidade em mobile/drawer: arredondamento maior MUST NOT cortar texto ou ícones nas arestas.
- Componentes que já usam tokens de raio do design system MUST herdar o aumento via esses tokens; hardcodes isolados MUST ser alinhados ou justificados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST aumentar de forma **consistente** o raio dos cantos das superfícies rectangulares (painéis, botões em caixa, inputs, menus, diálogos, cartões) em toda a aplicação autenticada e nos ecrãs de auth/convite cobertos pelo design system actual.
- **FR-002**: O aumento MUST ser **moderado–forte**: claramente perceptível face ao estado actual (não subtil de ~1px), mantendo caixas distinguíveis de pílulas/cápsulas.
- **FR-003**: Avatars, ícones de servidor circulares e controlos/badges em **pílula/círculo completo** MUST conservar a forma circular/pílula (não são tratados como caixas a arredondar “a meio”).
- **FR-004**: Temas claro e escuro MUST partilhar o mesmo grau de arredondamento.
- **FR-005**: O arredondamento MUST aplicar-se de forma **sistemática**: actualizar tokens partilhados **e** alinhar hardcodes de superfícies caixa no tema Mesa (shell, auth, voz), evitando ilhas com cantos afiados; auditoria exaustiva de todo o CSS/inline da app está fora de âmbito.
- **FR-006**: A alteração MUST NOT introduzir overflow visual óbvio (conteúdo cortado pelos cantos) nos fluxos principais: shell, canal de texto, voz, diálogos.
- **FR-007**: O aumento MUST seguir uma **escala partilhada** (pequeno / médio / grande sobem juntos de forma proporcional ao grau moderado–forte), sem privilegiar só painéis grandes nem achatar todos os tamanhos num único raio.

### Key Entities

- **Grau de arredondamento do sistema**: o “quanto” os cantos de caixas ficam mais redondos em relação ao baseline actual (**moderado–forte**).
- **Escala de raio partilhada**: degraus pequeno / médio / grande que sobem em conjunto.
- **Superfície caixa**: painel, botão rectangular, input, menu, diálogo, cartão.
- **Superfície circular/pílula**: avatar, badge full-pill, botão redondo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual informal com 3 pessoas familiarizadas com a UI actual, ≥2/3 identificam “cantos mais redondos” sem serem avisadas do que mudou.
- **SC-002**: Em 10 ecrãs/componentes amostrados (sidebar, rail, canal de texto, diálogo, painel de utilizador, input, botão, menu, auth, voz), 10/10 caixas relevantes mostram o novo grau; 0/10 avatars deixam de parecer circulares.
- **SC-003**: Temas claro e escuro: 2/2 passam a mesma checklist visual de arredondamento.
- **SC-004**: Zero regressões de layout reportadas nos fluxos principais (texto, voz, diálogos) atribuídas a cantos a cortar conteúdo, em passe de smoke pós-mudança.

## Assumptions

- O pedido é **visual de produto** (mais suave), não uma alteração de comportamento funcional.
- O grau de arredondamento das caixas é **moderado–forte** (clarificado 2026-09-06): claramente mais redondo que hoje; caixas ainda se distinguem de pílulas (não transformar todos os botões em capsules).
- Alcance (clarificado 2026-09-06): tokens partilhados **mais** hardcodes de caixas no tema Mesa (shell, auth, voz); não inclui caça exaustiva a estilos inline/raros fora desse tema.
- Escala (clarificado 2026-09-06): degraus pequeno / médio / grande sobem **juntos** (proporcional); não “painéis muito mais / botões pouco” nem um raio único para tudo.
- “Pelo sistema” inclui shell autenticada + auth/convite + voz cobertos pelo tema Mesa; não exige redesenhar superfícies fora desse design system (ex.: HTML cru sem classes Mesa, CSS de fornecedores).

## Out of Scope

- Auditoria exaustiva de todo o CSS/inline da aplicação além do tema Mesa.
- Alterar formas circulares/pílula intencionais (avatars, badges full-pill, botões redondos).
- Mudanças de espaçamento, tipografia, cor ou elevação (só raio de cantos).
