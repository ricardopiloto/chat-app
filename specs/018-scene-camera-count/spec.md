# Feature Specification: Número de câmeras na cena e re-layout

**Feature Branch**: `018-scene-camera-count`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Agora vamos editar o editor de cena. O criado do canal deve ter a opção de definir quantas cameras estarão na cena, isso deve reagendar o layout de acordo, Com 6 pessoas, se ele estiver usando \"mestre em destaque\" por exemplo, uma das janelas ainda é maior que as outras (em destaque) e as outras tem que ocupar o espaço restante, mesma coisa para o \"Faixa 5-up\" que efetivamente se tornaria um \"Faixa 6-up\" por que seriam 6 cameras."

**Depends on**: Editor de cena existente ([013-topbar-scene-ux](../013-topbar-scene-ux/) layout full-pane); cenas/layouts nomeados (Mestre em destaque, Painel 2×2, Faixa N-up).

## Clarifications

### Session 2026-09-04

- Q: Ao reduzir N, quem sai da composição? → A: O editor **escolhe manualmente** quais slots eliminar (não truncar automaticamente só pelos índices mais altos).
- Q: Quando pedir essa escolha? → A: **Só** se algum slot «a mais» estiver **ocupado**; se o excesso for só vazio, remover vazios automaticamente.
- Q: Qual janela é o «destaque» no Mestre? → A: Destaque = **slot geométrico fixo** da família Mestre; quem aparece lá define-se por atribuição (arrastar).
- Q: Intervalo permitido de N? → A: **2–8** (inclusive).
- Q: Quando o palco ao vivo reflecte o novo N? → A: Só depois de **Guardar** a cena (pré-visualização no rascunho imediata).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir quantas câmeras cabem na cena (Priority: P1)

Como **criador do canal** (quem já pode editar a cena), quero escolher **quantas câmeras/slots** a composição terá, para a cena refletir o tamanho real da mesa (ex. 6 participantes em vídeo) em vez de ficar presa a um número fixo do layout (ex. sempre 5).

**Why this priority**: Pedido central; sem o controlo de quantidade, o re-layout não tem parâmetro.

**Independent Test**: Abrir o editor de cena → alterar o número de câmeras → a pré-visualização mostra exactamente esse número de slots (vagos ou ocupados); guardar aplica à cena.

**Acceptance Scenarios**:

1. **Given** sou o criador/editor da cena num canal de voz/vídeo, **When** abro **Editar cena**, **Then** vejo um controlo claro para definir o **número de câmeras** da composição (além do seletor de família de layout).
2. **Given** altero o número (ex. de 5 para 6), **When** observo a pré-visualização **antes** de guardar, **Then** a grelha do rascunho mostra **6** posições e o layout reagenda-se de imediato; o palco ao vivo dos outros participantes **ainda** reflecte o N guardado anteriormente.
3. **Given** escolho um número válido e **guardo** a cena, **When** a cena está activa na chamada, **Then** o palco ao vivo passa a reflectir esse número de slots (com as atribuições guardadas).

---

### User Story 2 - «Mestre em destaque» adapta-se ao número escolhido (Priority: P1)

Como editor, com o layout **Mestre em destaque**, quero que **uma** janela continue **maior (em destaque)** e que as **restantes câmeras** preencham o espaço restante de forma equilibrada — inclusive com **6** câmeras (1 destaque + 5 satélites), não só com o máximo antigo fixo.

**Why this priority**: Exemplo explícito do pedido; preserva a identidade do layout.

**Independent Test**: No editor, layout Mestre + N=6 → pré-visualização com 1 tile dominante e 5 menores a ocupar o resto; N=4 → 1 dominante + 3 menores.

**Acceptance Scenarios**:

1. **Given** layout **Mestre em destaque** e N câmeras (N≥2), **When** vejo a pré-visualização/palco, **Then** existe **exactamente um** slot em destaque (maior) e **N−1** slots menores no espaço restante.
2. **Given** N=6 e Mestre em destaque, **When** comparo com N=5 no mesmo layout, **Then** o carácter «um grande + resto» mantém-se; só muda a quantidade de satélites.
3. **Given** o editor **diminui** N e pelo menos um dos slots que teria de sair está **ocupado**, **When** confirma a redução, **Then** deve **escolher quais slots remover** (entre os candidatos); ocupantes dos removidos → banco; layout reagenda com o novo N.
4. **Given** o editor **diminui** N e o excesso de slots está **apenas vazio**, **When** confirma a redução, **Then** os vazios a mais são removidos **automaticamente** sem passo de escolha manual.

---

### User Story 3 - «Faixa» torna-se N-up (Priority: P1)

Como editor, com o layout tipo **Faixa** (hoje «Faixa 5-up»), quero que a faixa passe a ter **N** células iguais (ex. N=6 → «Faixa 6-up»), ocupando a largura útil em faixa horizontal.

**Why this priority**: Exemplo explícito do pedido.

**Independent Test**: Layout Faixa + N=6 → seis tiles em fila com peso semelhante; rótulo/indicação reflecte N (ex. Faixa 6-up).

**Acceptance Scenarios**:

1. **Given** layout **Faixa** e N câmeras, **When** vejo a composição, **Then** há **N** janelas em faixa, com tamanhos equivalentes entre si (sem um «mestre» maior).
2. **Given** N=6, **When** o layout Faixa está activo, **Then** a UI comunica o equivalente a **Faixa 6-up** (rótulo ou descrição), não fica presa a «5-up» se N≠5.
3. **Given** N=3 na Faixa, **When** pré-visualizo, **Then** vejo três tiles em faixa (não cinco vazios fixos).

---

### User Story 4 - Painel em grelha também respeita N (Priority: P2)

Como editor, com o layout **Painel 2×2** (grelha equilibrada), quero que o número de câmeras escolhido **também** reorganize essa família para N slots o mais equilibrado possível (não só Mestre/Faixa), para o controlo de quantidade ser consistente em todos os layouts nomeados.

**Why this priority**: Consistência do editor; o utilizador citou Mestre/Faixa, mas deixar o Painel fixo em 4 enquanto N=6 seria incoerente.

**Independent Test**: Painel + N=6 → seis tiles em grelha equilibrada; Painel + N=4 → grelha 2×2 clássica.

**Acceptance Scenarios**:

1. **Given** layout Painel e N=4, **When** pré-visualizo, **Then** obtenho uma grelha equilibrada de 4 (como o 2×2 actual em espírito).
2. **Given** layout Painel e N=6, **When** pré-visualizo, **Then** vejo 6 slots sem um destaque «mestre» obrigatório — distribuição equilibrada.

---

### Edge Cases

- Reduzir N com excesso **só de slots vazios**: remover automaticamente os vazios necessários (sem diálogo de escolha).
- Reduzir N quando algum slot «a mais» está **ocupado**: o editor **escolhe quais slots eliminar**; ocupantes → **banco**; áudio na chamada mantém-se; sem crash. Não se assume truncagem cega pelos índices mais altos.
- Aumentar N: novos slots aparecem **vagos** na pré-visualização.
- N fora do intervalo permitido: o controlo impede ou rejeita com mensagem clara (não guarda valor inválido).
- Guardar com N diferente: o palco ao vivo só muda após **Guardar**; descartar rascunho não afecta o palco.
- Quem não pode editar a cena: não vê / não altera o número de câmeras.
- Participantes na chamada > N: continuam no banco (comportamento actual de «em chamada mas fora da composição»).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O editor de cena MUST permitir ao criador do canal (ou quem já tem permissão para editar a cena) definir o **número de câmeras/slots** da composição.
- **FR-002**: Ao alterar o número, a pré-visualização do editor MUST **reagendar** a grelha de imediato no rascunho, reflectindo exactamente esse número de slots.
- **FR-003**: Com o layout **Mestre em destaque** e N slots, MUST haver **um** slot em destaque (maior) numa **posição geométrica fixa** da família (não escolhida ad hoc por chamada) e **N−1** slots menores a ocupar o espaço restante; quem ocupa o destaque define-se pela atribuição de pessoa a esse slot.
- **FR-004**: Com o layout **Faixa**, a composição MUST apresentar **N** tiles em faixa com peso equivalente; a designação apresentada ao utilizador MUST reflectir N (ex. Faixa 6-up quando N=6), não um «5-up» fixo incorrecto.
- **FR-005**: Com o layout **Painel** (grelha equilibrada), a composição MUST apresentar **N** slots numa disposição equilibrada (sem forçar o padrão «mestre»).
- **FR-006**: Guardar a cena MUST persistir o número de slots escolhido juntamente com o layout e as atribuições, de modo a que o palco ao vivo da cena activa use esse N. Alterar N no editor MUST actualizar a **pré-visualização do rascunho** de imediato, mas MUST NOT alterar o palco ao vivo até **Guardar**.
- **FR-011**: Descartar o rascunho (ou fechar sem guardar) MUST restaurar o N e o layout previamente guardados, sem efeito no palco ao vivo.
- **FR-007**: Ao **diminuir** N:
  - Se for possível atingir o novo N removendo apenas slots **vazios**, a aplicação MUST removê-los **automaticamente** (sem passo de escolha).
  - Se a redução implicar remover pelo menos um slot **ocupado**, o editor MUST **escolher explicitamente quais slots eliminar** (não truncar só automaticamente pelos índices mais altos). Ocupantes dos slots eliminados MUST voltar ao banco (sem os expulsar da chamada).
  - Em ambos os casos, os slots mantidos MUST permanecer na composição com o novo N e o layout reagendado.
- **FR-008**: O número de câmeras MUST estar num intervalo permitido **2–8** (inclusive), cobrindo o exemplo de 6 e acima do máximo fixo histórico de 5 em alguns layouts.
- **FR-009**: Esta feature MUST NOT remover a capacidade de escolher a família de layout (Mestre / Painel / Faixa); o número de câmeras é um parâmetro **ortogonal** que redimensiona cada família.
- **FR-010**: Utilizadores sem permissão de edição de cena MUST NOT alterar o número de câmeras.

### Out of Scope

- Canvas livre (posições x/y/w/h arbitrárias).
- Layouts nomeados completamente novos além das três famílias actuais.
- Forçar automaticamente N = número de pessoas na chamada (o editor define N; o banco continua a absorver o excesso).
- Alterar quem pode criar canais ou permissões de voz além do necessário para o controlo no editor.

### Key Entities

- **Número de câmeras (N)**: inteiro 2–8; quantos slots a composição tem.
- **Família de layout**: Mestre em destaque | Painel (grelha) | Faixa; cada uma reage a N mantendo a sua identidade visual.
- **Slot**: posição na composição; pode estar vago ou atribuído a um participante.
- **Banco**: participantes na chamada fora dos N slots.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em **100%** das pré-visualizações testadas com N∈{2…8}, o número de slots visíveis coincide com N após alterar o controlo.
- **SC-002**: Com Mestre + N=6, um revisor identifica em **≤5 segundos** qual é a janela em destaque e confirma que as outras 5 ocupam o resto sem sobreposição inutilizável.
- **SC-003**: Com Faixa + N=6, **100%** das amostras mostram seis tiles em faixa (não cinco); o rótulo/descrição não afirma «5-up» de forma contraditória.
- **SC-004**: Após guardar N=6 e reabrir o editor/palco, o N persistido é **6** em **100%** das tentativas de amostra.
- **SC-005**: Em teste com 5 editores, **≥4** conseguem mudar N e perceber o re-layout sem instruções além do UI.

## Assumptions

- «Criador do canal» alinha-se a quem **já pode abrir o editor de cena** hoje (dono/criador); não se inventa um papel novo.
- As três famílias de layout existentes continuam; N é parâmetro partilhado que **escala** cada família (não só Mestre/Faixa).
- Intervalo **2–8** confirmado na clarificação; valores fora disso são rejeitados no UI.
- Labels como «Faixa 5-up» passam a ser dinâmicos com N (Faixa N-up).
- Persistência do N faz parte do **Guardar cena**; o rascunho mostra N de imediato, o palco ao vivo só após save (como o resto do editor).
- Participantes além de N permanecem no banco, como hoje.
- Ao reduzir N: escolha manual de slots **só** quando algum dos slots a remover está ocupado; excesso só vazio → remoção automática.
- No Mestre, o destaque é sempre a **mesma posição grande** do layout; não há «destaque móvel» nem auto-seguimento de uma pessoa.
