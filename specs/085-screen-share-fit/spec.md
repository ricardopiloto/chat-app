# Feature Specification: Partilha de ecrã sem o «zoom» das câmaras

**Feature Branch**: `085-screen-share-fit`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Para o screenshare, não aplique o mesmo \"zoom\" que fazemos nas webcams."

**Problem**: Em Grade, tiles de partilha de ecrã usam o mesmo enquadramento das câmaras (preencher o tile cortando o que «sobra»). Isso funciona para rostos, mas corta UI, texto e bordas do ecrã partilhado — o conteúdo fica ilegível ou incompleto.

**Relationship to 082/083**: Mantém captura, Grade-only, tiles unificados, chips, spotlight e Composição sem vídeo de ecrã. Altera **apenas** como o vídeo de partilha de ecrã é enquadrado dentro do tile (e pré-visualização local na Grade).

## Clarifications

### Session 2026-09-10

- Q: Where does «mostrar tudo» apply? → A: Grade only — every screen-share tile in Grade (remote + local preview), including spotlight.
- Q: Look of the empty area (letterbox)? → A: Neutral dark / slot-like empty area (simple letterbox).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o ecrã completo no tile (Priority: P1)

Como participante em modo **Grade** a ver uma partilha de ecrã, quero que o conteúdo partilhado apareça **inteiro** dentro do tile (sem o mesmo «zoom/crop» das webcams), para conseguir ler texto e ver a UI completa mesmo que o tile tenha proporção diferente do ecrã.

**Why this priority**: Corrige a legibilidade da partilha — o valor principal do screen share.

**Independent Test**: Partilhar um ecrã (ou janela) com conteúdo até às bordas; no tile de ecrã, o conteúdo visível não está cortado pelos lados; as câmaras no mesmo grid continuam com o enquadramento habitual de webcam.

**Acceptance Scenarios**:

1. **Given** estou em Grade com pelo menos uma partilha de ecrã activa, **When** olho para o tile dessa partilha, **Then** o quadro partilhado está **inteiro** no tile (pode haver barras/espaço vazio **neutro escuro / tipo slot** se a proporção não coincidir), **sem** cortar as margens do conteúdo como nas câmaras.
2. **Given** o mesmo tile de ecrã e tiles de câmara no mesmo grid, **When** comparo o enquadramento, **Then** as câmaras mantêm o comportamento actual de «preencher o tile» (rosto centrado, eventual corte), e **só** os tiles de partilha de ecrã usam o enquadramento «mostrar tudo».
3. **Given** uma partilha em destaque (spotlight) na Grade, **When** o tile de ecrã aumenta, **Then** o enquadramento «mostrar tudo» **mantém-se** (não volta ao crop das câmaras).

---

### User Story 2 - Pré-visualização local coerente (Priority: P2)

Como quem está a partilhar o ecrã, quero que a minha pré-visualização local do ecrã na Grade use o mesmo enquadramento «mostrar tudo», para o que eu vejo bater certo com o que os outros veem.

**Why this priority**: Evita surpresa local vs remoto; menor que P1 porque o impacto principal é quem assiste.

**Independent Test**: Iniciar partilha; o tile local de ecrã não corta o conteúdo como uma webcam.

**Acceptance Scenarios**:

1. **Given** estou a partilhar ecrã em Grade, **When** vejo o meu tile de ecrã, **Then** o enquadramento é «mostrar tudo», igual ao dos outros participantes que vêem a minha partilha.

---

### Edge Cases

- Proporção do ecrã/janela muito diferente do tile (ultrawide, portrait): conteúdo completo com letterbox neutro escuro / tipo slot; sem crop forçado.
- Várias partilhas em simultâneo: cada tile de ecrã usa «mostrar tudo»; câmaras inalteradas.
- Parar a partilha: tiles de câmara continuam com o enquadramento de webcam.
- Composição: continua sem vídeo de ecrã (fora de âmbito desta feature).
- PiP e outras superfícies fora da Grade: fora de âmbito (sem alteração de enquadramento nesta feature).
- Partilha só de áudio de sistema (sem vídeo de ecrã): sem mudança de enquadramento a aplicar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tiles de **partilha de ecrã** na Grade MUST mostrar o quadro partilhado **sem** o mesmo crop/«zoom para preencher» usado nas webcams; o conteúdo partilhado MUST permanecer **inteiro** e legível dentro do tile.
- **FR-002**: Tiles de **câmara** (Grade e Composição) MUST manter o enquadramento actual de webcam (preencher o tile; corte eventual aceite).
- **FR-003**: O enquadramento «mostrar tudo» MUST aplicar-se tanto a partilhas remotas como à pré-visualização local do partilhador na Grade.
- **FR-004**: Spotlight / redimensionamento do tile de ecrã MUST preservar o enquadramento «mostrar tudo» (não herdar o crop de câmara).
- **FR-005**: Esta feature MUST NOT alterar captura, permissões, indicadores, ordem de tiles, chips, nem a regra de Composição sem vídeo de ecrã.
- **FR-006**: O enquadramento «mostrar tudo» aplica-se **apenas** a tiles de partilha de ecrã na Grade (incluindo spotlight e pré-visualização local). PiP e outras superfícies fora da Grade estão **fora de âmbito**, mesmo que no futuro mostrem vídeo de ecrã.
- **FR-007**: Quando a proporção do quadro partilhado ≠ proporção do tile, o espaço vazio (letterbox) MUST ser uma área **neutra escura / tipo fundo de slot** — não precisa combinar com o chrome da Grade à volta.

### Key Entities

- **Tile de câmara**: vídeo de face; enquadramento «preencher» (comportamento existente).
- **Tile de partilha de ecrã**: vídeo do ecrã/janela; enquadramento «mostrar tudo» (novo comportamento desta feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes manuais com conteúdo até às bordas do ecrã/janela partilhado, revisores confirmam que **nenhuma** margem do conteúdo está cortada pelo tile de ecrã (letterbox neutro escuro / tipo slot permitido).
- **SC-002**: No mesmo ecrã Grade, tiles de câmara continuam a preencher o tile como antes (regressão visual de webcam = 0 alterações esperadas).
- **SC-003**: Com spotlight activo num tile de ecrã, o conteúdo partilhado continua completo (sem crop tipo webcam) em 100% das verificações do quickstart.
- **SC-004**: Quem partilha reconhece, na pré-visualização local, o mesmo tipo de enquadramento que descreve aos outros («vê-se tudo»), sem precisar de explicar cortes.

## Assumptions

- O «zoom» referido pelo utilizador é o enquadramento das webcams que **preenche** o tile e **corta** o que não cabe (não um controlo de zoom interactivo tipo lightbox).
- «Mostrar tudo» implica eventual letterbox (área neutra escura / tipo slot) quando a proporção do ecrã ≠ proporção do tile; isso é desejável em relação a cortar UI/texto.
- Espelho (flip horizontal) das webcams, se existir, **não** se aplica a partilhas de ecrã (já esperado; esta feature reforça a separação visual câmara vs ecrã).
- Sem novos controlos de utilizador (sem toggle «crop/fit» na v1).
- Âmbito visual: **só Grade** (tiles de ecrã remotos + pré-visualização local + spotlight). PiP e restantes superfícies fora de âmbito.
