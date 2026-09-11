# Feature Specification: Destaque de ecrã visível na Grade

**Feature Branch**: `086-fix-spotlight-layout`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: Quando o utilizador clica em destacar o compartilhamento de tela, o tile destacado acaba numa zona fora de visão / esmagada na parte inferior da Grade (altura ~8px); o «destacar» comporta-se como «esconder».

**Problem**: Em modo Grade, o controlo de destaque (spotlight) numa partilha de ecrã não aumenta de forma útil o ecrã partilhado. O tile destacado fica minúsculo e deslocado para fora da área útil do palco (abaixo das câmaras), pelo que o conteúdo deixa de ser visível. O utilizador espera um ecrã dominante e legível; recebe o oposto.

**Relationship to 083**: Mantém destaque **só em tiles de ecrã**, grid unificado **quando não há destaque**, ordem cams→telas, chips e resto de 082/085. Com destaque activo, o layout passa a **palco principal (ecrã destacado) + faixa secundária** (câmaras e outros ecrãs); sem destaque, restaura o grid unificado 083.

## Clarifications

### Session 2026-09-10

- Q: Layout when spotlight is on? → A: Main stage = highlighted screen; cameras (and other screens) in a compact secondary strip.
- Q: Where should the secondary strip sit? → A: Bottom strip under the main screen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Destacar torna o ecrã grande e visível (Priority: P1)

Como participante em **Grade** a ver uma partilha de ecrã, quero que ao clicar em **destacar** o tile dessa partilha fique **claramente maior e dentro da área visível** do palco, para poder acompanhar o conteúdo partilhado — não escondido nem esmagado no fundo.

**Why this priority**: O destaque é inútil (ou prejudicial) no estado actual; corrige o regresso de usabilidade reportado.

**Independent Test**: Com ≥1 câmara + 1 partilha na Grade, activar destaque no tile de ecrã; o ecrã partilhado ocupa a **região principal** (acima) e permanece legível; as câmaras (e outros ecrãs) ficam numa **faixa secundária compacta no fundo**.

**Acceptance Scenarios**:

1. **Given** estou em Grade com pelo menos uma câmara e uma partilha de ecrã, **When** activo o destaque nessa partilha, **Then** o tile de ecrã destacado ocupa a **área principal superior** do palco Grade (inteiramente visível e legível), e as câmaras aparecem numa **faixa secundária no fundo** — não o ecrã esmagado sob as cams.
2. **Given** o destaque está activo, **When** olho para o palco, **Then** consigo ler/ver o conteúdo da partilha sem deslocar o layout da app nem «caçar» um tile fora de vista.
3. **Given** o destaque está activo, **When** desactivo o destaque (mesmo controlo / estrela), **Then** o layout volta ao **grid unificado equilibrado** 083 (todos os tiles com tamanho útil comparável).

---

### User Story 2 - Destaque não esconde o ecrã (Priority: P1)

Como participante, quero que «destacar» **nunca** reduza o tile de ecrã a um estado efectivamente oculto, para a acção corresponder ao significado do rótulo (destacar / spotlight), não a esconder.

**Why this priority**: Confirma o anti-requisito reportado («está funcionando mais como um esconder»).

**Independent Test**: Antes vs depois do clique em destacar: a área do tile de ecrã destacado não diminui para um tamanho ilegível; aumenta ou mantém-se dominante.

**Acceptance Scenarios**:

1. **Given** um tile de ecrã com tamanho normal no grid, **When** activo o destaque, **Then** esse ecrã passa à **região principal** do palco (área útil maior e legível), não fica menor/oculto.
2. **Given** várias câmaras + uma partilha, **When** o destaque está ligado, **Then** o ecrã destacado é o **palco principal**; as câmaras ficam na faixa secundária, não «por cima» a esmagar o ecrã.

---

### User Story 3 - Câmaras e partilha continuam utilizáveis (Priority: P2)

Como participante, quero que com destaque activo as câmaras (e outras partilhas, se existirem) continuem identificáveis, e que sem destaque o grid unificado 083 continue a funcionar, para não trocar um bug por outro.

**Why this priority**: Protege o layout unificado e multi-tile.

**Independent Test**: Com destaque: ecrã grande + cams ainda presentes. Sem destaque: grid igual 083. Segunda partilha sem destaque permanece dimmed/secundária se esse for o comportamento actual, mas legível quando não destacada.

**Acceptance Scenarios**:

1. **Given** destaque activo numa partilha, **When** vejo o palco, **Then** os tiles de câmara ainda aparecem na **faixa secundária** — não desaparecem todos.
2. **Given** ninguém tem destaque, **When** vejo a Grade com cams + ecrãs, **Then** o comportamento do grid unificado (083) mantém-se (tiles equilibrados; ecrãs com fit 085).
3. **Given** destaque activo e uma segunda partilha sem destaque, **When** vejo a faixa secundária, **Then** essa segunda partilha (e/ou câmaras) permanece identificável na faixa — não compete com o palco principal.
---

### Edge Cases

- Só 1 tile no palco (só ecrã): destaque pode ser no-op visual ou reforço leve; não deve esmagar o único tile.
- Muitas câmaras (ex. 3+) + 1 ecrã: ecrã destacado continua dominante e dentro do viewport.
- Spotlight + 085 contain/letterbox: conteúdo do ecrã continua «mostrar tudo» dentro do tile grande.
- Alternar destaque entre duas partilhas: o ecrã activo fica dominante; o anterior volta a tamanho normal / dimmed.
- Alternar Grade ↔ Composition: Composition sem vídeo de ecrã inalterado; ao voltar à Grade com destaque ainda activo, o ecrã volta visível e grande (não esmagado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Activar destaque num tile de partilha de ecrã na Grade MUST mostrar esse ecrã na **região principal (main stage)** do palco, legível e dominante.
- **FR-002**: O ecrã destacado MUST permanecer **inteiramente dentro** da área visível do palco Grade (sem ficar cortado, fora de vista, ou com altura efectivamente ilegível).
- **FR-003**: Activar destaque MUST NOT reduzir a área útil do ecrã destacado a um estado ilegível («esconder»); MUST passar ao layout **main stage + faixa secundária**.
- **FR-004**: Com destaque activo, tiles de câmara (e outros ecrãs não destacados) MUST aparecer numa **faixa secundária compacta no fundo** do palco Grade (filmstrip sob o ecrã principal), ainda identificáveis.
- **FR-005**: Desactivar destaque MUST restaurar o **grid unificado equilibrado** 083.
- **FR-006**: Destaque continua a aplicar-se **apenas** a tiles de ecrã (083); câmaras sem controlo de destaque.
- **FR-007**: Fit «mostrar tudo» / letterbox (085) MUST continuar a aplicar-se ao ecrã na região principal (e a ecrãs na faixa, se presentes).
- **FR-008**: Capture, indicadores, chips e regras de Composição (sem vídeo de ecrã) MUST permanecer inalterados.
- **FR-009**: Sem destaque activo, a Grade MUST NOT usar o layout main-stage+faixa; MUST usar o grid unificado 083.
### Key Entities

- **Tile de ecrã destacado**: partilha com spotlight local activo; ocupa a **região principal** do palco.
- **Faixa secundária (filmstrip)**: câmaras e outros ecrãs não destacados, compactos, **no fundo** do palco sob o ecrã principal.
- **Palco Grade**: área da Grade; com destaque = main stage + faixa; sem destaque = grid unificado 083.
- **Tiles de câmara**: faces; na faixa quando há destaque de ecrã.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão manual com cams + 1 partilha, após clicar destacar, 100% dos revisores vêem o ecrã na **região principal** (visível sem scroll) e as cams numa **faixa secundária no fundo** do palco.
- **SC-002**: A área útil do ecrã destacado após o clique é **maior** (não menor) do que imediatamente antes do destaque, em 100% das corridas do quickstart (anti-«esconder»).
- **SC-003**: Com destaque activo, ≥1 tile de câmara permanece identificável na faixa secundária.
- **SC-004**: Desligar destaque restaura o grid unificado 083 com tiles legíveis sem rejoin, em 100% das corridas.
- **SC-005**: Composição e partilha start/stop não regressam; ecrã na região principal mantém enquadramento «mostrar tudo» (085).

## Assumptions

- O destaque continua **local** (só neste cliente), como em 082/083.
- Com destaque: layout **main stage (ecrã destacado em cima) + faixa secundária no fundo** (cams e outros ecrãs). Sem destaque: grid unificado 083.
- O problema reportado (tile ~8px no fundo) é o sintoma a eliminar; não reintroduzir span de grid que esmague o ecrã.
- «Dominante» = região principal do palco dedicada ao ecrã destacado; cams na faixa compacta.
- Não é pedido um modo teatro fullscreen separado fora da Grade nesta feature.
