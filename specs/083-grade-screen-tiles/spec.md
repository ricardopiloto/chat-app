# Feature Specification: Telas partilhadas como tiles iguais na Grade

**Feature Branch**: `083-grade-screen-tiles`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: Ajuste da área de screenshare criada na spec 082. O screenshare precisa comportar-se como se fosse outra câmara a entrar no modo Grade; a implementação actual reserva uma área fixa para o ecrã e reduz demasiado as câmaras, o que é esteticamente fraco e pouco prático.

**Problem**: Em modo Grade, as partilhas de ecrã ocupam uma banda fixa dominante e as câmaras ficam numa faixa secundária muito pequena. Quem usa a chamada vê o layout desequilibrado e pouco útil, sobretudo com várias pessoas e uma ou mais telas.

**Relationship to 082**: Esta feature **altera apenas o layout visual da Grade** quando há partilhas. Mantém-se o resto do comportamento de 082 (iniciar/parar só em Grade, sem tiles em Composição, indicadores, multi-share, spotlight local de ecrãs no grid unificado, câmara independente, sem auto-modo/restauro).

## Clarifications

### Session 2026-09-10

- Q: O destaque local no grid unificado? → A: Manter destaque só para partilhas de ecrã (adaptado ao grid unificado; não reintroduz bandas).
- Q: Ordem dos tiles no grid unificado? → A: Todas as câmaras primeiro; a seguir todas as telas.
- Q: Como distinguir tile de ecrã vs câmara? → A: Handle + indicação «tela» / ícone de partilha no chip.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Grade trata tela como mais um tile (Priority: P1)

Como participante em modo **Grade**, quero que cada tela partilhada apareça como **mais um tile no mesmo grid** das câmaras (como se fosse outra «câmara»), para que o espaço seja dividido de forma equilibrada e legível, sem uma zona fixa de screen share a esmagar as faces.

**Why this priority**: Corrige o problema principal de usabilidade e estética reportado após 082.

**Independent Test**: Com 1 partilha + N câmaras na Grade, o layout é um único grid de tiles (tela + câmaras) com tamanhos comparáveis; não há faixa fixa «só ecrã» + faixa minúscula «só câmaras».

**Acceptance Scenarios**:

1. **Given** estou em Grade com pelo menos uma câmara e uma partilha de ecrã activa, **When** vejo o painel de voz, **Then** a tela e as câmaras partilham o **mesmo** arranjo de grade (não duas bandas com alturas fixas desiguais), com **câmaras primeiro** e **telas a seguir**.
2. **Given** só existe uma partilha e nenhuma outra câmara visível além da minha, **When** vejo a Grade, **Then** a tela ocupa um tile do grid como qualquer outro participante de vídeo (sem layout especial de «palco de ecrã»).
3. **Given** havia o layout de bandas de 082, **When** esta feature está activa, **Then** esse layout de banda primaria/secundária **deixa de ser** o comportamento da Grade com partilhas.

---

### User Story 2 - Várias telas e câmaras no mesmo grid (Priority: P1)

Como participante com **várias** partilhas e câmaras, quero que todos esses fluxos de vídeo entrem no **mesmo** grid da Grade, para poder ver faces e ecrãs sem que as câmaras fiquem inutilizáveis.

**Why this priority**: Multi-share já é produto (082); o ajuste de layout tem de cobrir N telas + M câmaras.

**Independent Test**: Dois partilhadores + várias câmaras → todos os tiles no mesmo grid; câmaras primeiro, telas a seguir; divisão equilibrada (ou destaque local de ecrã).

**Acceptance Scenarios**:

1. **Given** dois participantes partilham ecrã e há câmaras activas, **When** vejo a Grade, **Then** vejo tiles de câmara primeiro e, a seguir, um tile por tela partilhada — tudo no mesmo grid.
2. **Given** um participante publica câmara **e** ecrã, **When** vejo a Grade, **Then** aparecem **dois** tiles distintos para essa pessoa (um de câmara na secção de câmaras, um de ecrã na secção de telas), ambos no mesmo grid, e o tile de ecrã mostra o handle **com** indicação visual de partilha de tela.
3. **Given** o último partilhador para, **When** a Grade actualiza, **Then** restam só os tiles de câmara no mesmo estilo de grid (sem «buraco» de banda de ecrã).
4. **Given** vejo um tile de ecrã, **When** leio o chip, **Then** identifico o partilhador pelo handle e que o tile é uma tela (não só a câmara).

---

### User Story 3 - Destaque local continua útil no grid unificado (Priority: P2)

Como participante na Grade, quero poder **destacar localmente** uma tela partilhada (ampliar esse tile no grid unificado) sem voltar ao layout de bandas fixas, para legibilidade pontual de mapa/ficha. Câmaras **não** são alvos de destaque.

**Why this priority**: Preserva a utilidade do destaque de 082 no novo layout.

**Independent Test**: Destacar uma tela → esse tile cresce no **meu** cliente; os outros tiles (câmaras e outras telas) partilham o resto; sem faixa fixa de ecrã; tentar destacar só câmara não está disponível.

**Acceptance Scenarios**:

1. **Given** estou em Grade com partilhas no grid unificado, **When** destaco a tela de A, **Then** o tile de ecrã de A fica maior localmente e os restantes tiles reorganizam-se no espaço restante — só no meu cliente.
2. **Given** tenho destaque activo, **When** A deixa de partilhar, **Then** o destaque limpa-se e o grid volta ao equilíbrio entre os tiles restantes.
3. **Given** não estou em Grade, **When** procuro destacar, **Then** o controlo continua indisponível (como em 082).
4. **Given** estou em Grade, **When** procuro destacar um tile que é só câmara, **Then** esse tile **não** é um alvo válido de destaque.

---

### Edge Cases

- Zero partilhas: Grade comporta-se como antes de screen share (só câmaras / identidades em chamada).
- Só partilha(s) sem câmaras: grid só com tiles de ecrã (a «secção» de câmaras fica vazia), divisão equilibrada.
- Ordem estável: câmaras (ordem da chamada) → telas (ordem estável entre partilhadores); novas partilhas acrescentam-se no fim do bloco de telas.
- Muitos tiles (ex. 6+): o grid continua a caber de forma utilizável (colunas/linhas automáticas); apertado é aceitável, mas **não** à custa de esmagar só as câmaras.
- Composição: inalterada face a 082 — sem tiles de ecrã; áudio da partilha continua.
- Indicadores Grade/sidebar e controlo de partilha só em Grade: inalterados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Em modo Grade, cada partilha de ecrã activa MUST ser representada como um **tile de vídeo** no **mesmo** grid usado para câmaras (paridade visual de «mais uma câmara»), não numa região de layout separada e fixa.
- **FR-002**: O produto MUST NÃO usar o layout de «banda de ecrãs prioritária + faixa secundária de câmaras» introduzido em 082 para a Grade com partilhas.
- **FR-003**: Um participante com câmara e ecrã activos MUST gerar até **dois** tiles no grid da Grade (câmara e ecrã), ambos no arranjo unificado.
- **FR-003a**: Tiles de ecrã MUST mostrar no chip o handle do partilhador **e** uma indicação explícita de partilha de tela (texto e/ou ícone); tiles de câmara mantêm o chip de handle como hoje.
- **FR-004**: Sem destaque local, os tiles do grid (câmaras e ecrãs) MUST partilhar o espaço de forma **equilibrada** (tamanhos comparáveis dentro do mesmo arranjo). A ordem MUST ser: **todas as câmaras primeiro**, **depois todas as telas partilhadas**.
- **FR-005**: O destaque local MUST permanecer disponível **apenas** para tiles de ecrã partilhado; MUST ampliar esse tile no cliente local dentro do grid unificado; MUST NÃO restaurar o layout de bandas fixas; tiles só de câmara NÃO MUST ser alvos de destaque.
- **FR-006**: As regras de 082 que **não** são layout de Grade MUST permanecer: iniciar/parar partilha só em Grade; sem tiles de ecrã em Composição; áudio da partilha em Composição; indicadores; multi-share; câmara independente da partilha; sem troca automática de modo nem restauro de cena.
- **FR-007**: Remover ou adaptar qualquer UI/CSS específica da «banda de screen share» que conflite com o grid unificado.

### Key Entities

- **Tile de Grade**: unidade visual no modo Grade — pode ser câmara de um participante ou ecrã partilhado de um participante; tiles de ecrã identificam-se no chip (handle + indicação de tela).
- **Partilha de ecrã activa**: inalterada face a 082 (conjunto canónico de quem partilha); só muda a forma como o ecrã é **mostrado** na Grade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 1 partilha + ≥2 câmaras na Grade, observadores confirmam um **único** grid de tiles (sem banda superior fixa de ecrã + faixa inferior de câmaras); ≥90% dos revisores internos classificam o layout como «equilibrado» vs o layout de bandas de 082.
- **SC-002**: Com 2 partilhas + câmaras, ambos os ecrãs e as câmaras permanecem **visíveis e utilizáveis** no mesmo grid (nenhuma câmara reduzida a uma faixa residual tipicamente &lt; ~20% da altura do painel só por existir partilha).
- **SC-003**: Mudar para Composição continua a esconder tiles de ecrã; voltar à Grade restaura o grid unificado sem regressão dos indicadores ou do controlo de partilha.
- **SC-004**: Destacar uma tela partilhada altera só o cliente local; ao parar a partilha destacada, o grid reequilibra sem intervenção; tiles só de câmara não oferecem destaque.

## Assumptions

- O pedido é um **ajuste de layout** sobre 082, não uma nova capacidade de captura/publicação.
- «Como outra câmara» significa **paridade de tratamento no grid** (mesmo arranjo, tamanhos equilibrados), não misturar a pista de ecrã com a de câmara num único tile.
- Spotlight local de ecrã (082) **mantém-se** no grid unificado; não se estende a câmaras; adapta-se sem reintroduzir bandas.
- Regras de Composição, permissões, E2EE e indicadores de 082 ficam fora do âmbito desta mudança excepto onde o layout as toque.
- Fonte de contexto: feedback pós-implementação de [082-screen-share](../082-screen-share/).
