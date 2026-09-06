# Feature Specification: Painel lateral do editor de cena — slots compactos no topo

**Feature Branch**: `034-scene-editor-side-layout`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Ajuste o layout de [scene-editor-side]. o número de slots precisa ocupar apenas a parte de cima, hoje dependendo do tamanho de tela ele ocupa a maior parte devido a distribuição igual que fazemos entre as três partes."

**Depends on**: editor de cena / composição ([018](../018-scene-camera-count/) — slots 2–8, layouts, banco).

**UI target**: painel lateral `.scene-editor-side` do editor de cena (secções «Câmeras na cena» / número de slots, «Layout da cena», «No banco»).

## Clarifications

### Session 2026-09-06

- Q: Depois dos slots compactos, como dividir o resto da coluna? → A: Empilhar por conteúdo; scroll no painel inteiro se precisar

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Número de slots só no topo (Priority: P1)

Como dono/editor da cena, quero que o bloco **«Câmeras na cena» / número de slots (2–8)** ocupe **apenas o espaço necessário no topo** do painel lateral, para não desperdiçar a maior parte da altura do ecrã nessa secção quando a coluna é alta.

**Why this priority**: É o defeito reportado; a distribuição vertical igual entre as três partes faz o bloco de slots crescer demais.

**Independent Test**: Abrir o editor de cena numa janela alta (altura generosa do painel lateral); o select/controlo de número de slots fica no topo com altura compacta; o espaço vertical sobrante **não** fica vazio dentro do bloco de slots.

**Acceptance Scenarios**:

1. **Given** o editor de cena está aberto com o painel lateral visível e altura generosa, **When** olho a secção «Câmeras na cena» / número de slots, **Then** essa secção tem altura **próxima do conteúdo** (rótulo + controlo), **não** uma faixa alta vazia.
2. **Given** a mesma vista, **When** comparo as três partes do painel (slots, layout, banco), **Then** **não** partilham a altura útil em **terços iguais** de forma que o bloco de slots absorva ~1/3 (ou mais) da coluna só por distribuição igual.
3. **Given** mudo o número de slots (2–8), **When** o controlo actualiza, **Then** a funcionalidade de alterar N permanece igual; só muda o **espaço** que o bloco ocupa.

---

### User Story 2 - Layout e banco usam o resto da coluna (Priority: P1)

Como editor, quero que **«Layout da cena»** e **«No banco»** fiquem **logo abaixo** dos slots, cada um com altura pelo **conteúdo** (sem nova divisão igual do resto), e que o **painel inteiro** faça scroll se o conteúdo não couber — para ver layout e banco sem espaço morto no bloco de slots.

**Why this priority**: Complemento directo do pedido; a coluna deve empilhar de forma natural.

**Independent Test**: Com painel alto, após o bloco compacto de slots, layout e banco aparecem em sequência sem faixas vazias entre cabeçalhos; com conteúdo longo, scroll no painel lateral (não expandir slots).

**Acceptance Scenarios**:

1. **Given** painel lateral alto, **When** olho abaixo do número de slots, **Then** «Layout da cena» e «No banco» estão imediatamente abaixo (sem grande vazio herdado do bloco de slots) e têm altura alinhada ao respectivo conteúdo.
2. **Given** há várias pessoas no banco ou a lista de layouts é longa, **When** a coluna não chega, **Then** o **painel lateral inteiro** permite percorrer o conteúdo (scroll) **sem** expandir artificialmente a secção de slots nem partilhar o resto em metades iguais layout/banco.
3. **Given** janela mais baixa, **When** uso o editor, **Then** o bloco de slots continua compacto no topo e o resto do painel adapta-se (sem cortar o controlo de N de forma inutilizável).

---

### User Story 3 - Sem regressão do editor (Priority: P2)

Como editor, quero que Salvar/Descartar, escolha de layout, arrastar do banco para slots e reduzir N continuem a funcionar como hoje — só o **empilhamento visual** do painel lateral muda.

**Why this priority**: Evitar que um ajuste de layout parta o fluxo 018.

**Independent Test**: Percorrer quickstart mental do editor: mudar N, mudar layout, mover banco↔slot, guardar; tudo OK com o novo empilhamento.

**Acceptance Scenarios**:

1. **Given** o novo layout do painel, **When** altero layout da cena e número de slots, **Then** o rascunho e a pré-visualização comportam-se como antes.
2. **Given** há gente no banco, **When** atribuo a um slot, **Then** o fluxo banco↔slot continua utilizável no painel.

---

### Edge Cases

- Largura estreita / painel lateral abaixo do palco (layout empilhado &lt;~901px): o bloco de slots continua compacto no topo da coluna lateral; não reintroduzir distribuição igual problemática.
- Tema claro/escuro: só espaçamento; sem mudança de copy obrigatória.
- Secções vazias («Ninguém na chamada sem slot»): o banco pode ser baixo; slots **não** devem crescer para «preencher» esse vazio; layout e banco **não** partilham o resto em metades iguais.
- Fora de âmbito: redesenhar thumbnails de layout; mudar limites 2–8; lógica de reduce-N; mover controlos para o toolbar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No painel lateral do editor de cena, o bloco **número de slots / «Câmeras na cena»** MUST ocupar apenas a **altura do seu conteúdo** no **topo** do painel (compacto).
- **FR-002**: O painel MUST **não** distribuir a altura útil em **partes iguais** entre as três secções (slots, layout, banco) de forma que o bloco de slots cresça com a altura do ecrã.
- **FR-003**: As secções **«Layout da cena»** e **«No banco»** MUST empilhar **por conteúdo** logo abaixo dos slots (sem nova distribuição igual do espaço restante entre si). Se o conteúdo exceder a altura da coluna, o **painel lateral inteiro** MUST permitir scroll.
- **FR-004**: Alterar o número de slots (2–8), escolher layout e gerir o banco MUST permanecer possível com o mesmo significado funcional de hoje.
- **FR-005**: Em alturas de painel tipicamente usadas em desktop (coluna ~700px+), o bloco de slots MUST NOT ocupar a maior parte da coluna.

### Key Entities

- **Scene editor side panel**: Coluna lateral do editor (slots + layout + banco).
- **Slot count block**: Secção «Câmeras na cena» + controlo do número de slots.
- **Layout block**: Lista de opções de layout da cena.
- **Bank block**: «No banco» — participantes sem slot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num painel lateral com altura ≥600px, a altura do bloco de slots (rótulo + controlo + margens locais) é **≤120px** (ou visualmente equivalente a «só o topo»), não ~1/3 da coluna.
- **SC-002**: Um revisor confirma em ≤1 minuto que layout e banco estão logo abaixo dos slots, sem faixa vazia grande no bloco de slots.
- **SC-003**: Fluxos existentes (mudar N, layout, banco↔slot, guardar) passam num smoke test manual sem regressão funcional.
- **SC-004**: Em viewport estreita (painel empilhado), o bloco de slots continua compacto no topo da secção lateral.

## Assumptions

- As «três partes» = (1) câmeras/slots, (2) layout da cena, (3) no banco — no `.scene-editor-side`.
- A causa percebida é **distribuição vertical igual** (espaço partilhado) entre essas partes; a correcção é **empilhar por conteúdo** (slots compactos no topo; layout e banco também por conteúdo) com **scroll no painel inteiro** se necessário — não um novo split 50/50 layout/banco.
- Não se pede novo controlo de slots nem mudança de copy; só layout/espaçamento.
- O palco/pré-visualização à esquerda (ou acima) do painel **não** é o alvo desta feature.
