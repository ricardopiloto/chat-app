# Feature Specification: Miniatura flutuante da chamada de voz (PiP)

**Feature Branch**: `038-floating-voice-pip`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Vamos adicionar uma funcionalidade nova, quando o usuário clicar em algum canal de texto enquanto estiver em um canal de voz, nós devemos criar uma miniatura da chamada de voz e deixar ela flutuando sob o canto superior direito da aplicação, é o mesmo conceito que o Discord já faz hoje. Essa miniatura pode ser movida pela página, mas sempre vai \"grudar\" a algum dos quatro cantos da tela"

**Depends on**: sessão de chamada persistente ao navegar para texto ([028-voice-call-roster](../028-voice-call-roster/)); ecrã / palco da mesa de voz; shell da aplicação.

## Clarifications

### Session 2026-09-06

- Q: Conteúdo da miniatura (vídeo vs só estado)? → A: Preview de vídeo dos participantes com câmara + identidade da chamada; sem câmara, fallback de nome/estado.
- Q: Miniatura vs barra de chamada ligada? → A: Coexistem — barra e PiP ambos visíveis fora da mesa.
- Q: Lembrar canto após reload? → A: Não persiste entre reloads — sempre reabre no superior direito; dentro da mesma sessão de chamada na app, mantém o último canto até Sair.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Miniatura ao sair da vista da mesa (Priority: P1)

Como participante numa chamada de voz, quando abro um **canal de texto** (ou outra vista que não seja a mesa da chamada activa), quero ver uma **miniatura flutuante** da chamada no **canto superior direito**, para continuar a acompanhar a mesa sem perder o contexto da conversa de texto.

**Why this priority**: Pedido principal; espelha o PiP do Discord e fecha o buraco entre «continuo na chamada» e «já não vejo o palco».

**Independent Test**: Entrar na mesa de voz → abrir um canal de texto sem Sair → aparece miniatura no canto superior direito; voltar à mesa → a miniatura desaparece (a vista completa da chamada volta a ser o foco).

**Acceptance Scenarios**:

1. **Given** estou **na chamada** e a ver a mesa de voz, **When** abro um **canal de texto** do mesmo servidor (sem Sair), **Then** aparece uma **miniatura flutuante** da chamada no **canto superior direito**.
2. **Given** a miniatura está visível, **When** uso «Voltar à mesa» / abro de novo o canal de voz da chamada, **Then** a miniatura **deixa de** estar visível (volto à vista normal da chamada).
3. **Given** não estou em nenhuma chamada, **When** navego entre canais de texto, **Then** **não** aparece miniatura de chamada.

---

### User Story 2 - Arrastar e grudar nos cantos (Priority: P1)

Como utilizador com a miniatura visível, quero **arrastá-la** pela janela da aplicação e, ao largar, quero que ela **grude** automaticamente num dos **quatro cantos** do ecrã da app, para a posicionar sem cobrir o que estou a ler.

**Why this priority**: Pedido explícito; sem snap, o PiP fica no meio do conteúdo.

**Independent Test**: Arrastar a miniatura para perto de cada canto → ao soltar, alinha-se a esse canto; posição inicial por omissão é o canto superior direito.

**Acceptance Scenarios**:

1. **Given** a miniatura está no canto superior direito, **When** a arrasto e solto perto do canto **inferior direito**, **Then** fica **ancorada** nesse canto.
2. **Given** arrasto e solto perto do canto **superior esquerdo** (ou inferior esquerdo), **Then** fica ancorada nesse canto correspondente.
3. **Given** solto a miniatura no meio da área útil, **When** o sistema escolhe o canto, **Then** ancora no **canto mais próximo** dos quatro (não fica a flutuar no centro).
4. **Given** recarrego a página / reabro a app, volto a estar na chamada e abro texto, **When** a miniatura reaparece, **Then** ancora no **canto superior direito** (sem memória entre reloads).
5. **Given** na mesma sessão de chamada (sem reload) ancoro noutro canto, volto à mesa e abro texto de novo, **When** a miniatura reaparece, **Then** mantém o **último canto** escolhido até Sair.

---

### User Story 3 - Continuar a chamada e voltar (Priority: P2)

Como utilizador com a miniatura visível, quero poder **voltar à mesa** a partir da miniatura e **não** sair da chamada só por estar a ver texto, alinhado ao Discord.

**Why this priority**: Sem retorno fácil, a miniatura é só decorativa.

**Independent Test**: Com PiP visível em canal de texto, activar «voltar à mesa» (na miniatura ou controlo equivalente já existente) → vista da chamada; ocupação/chamada mantém-se enquanto não Sair.

**Acceptance Scenarios**:

1. **Given** a miniatura está visível, **When** activo a acção de **voltar à mesa** a partir da miniatura (ou equivalente claro), **Then** abro a vista da chamada activa e a miniatura desaparece.
2. **Given** a miniatura está visível, **When** **não** clico em Sair, **Then** continuo **na chamada** (áudio/ocupação) enquanto leio texto.
3. **Given** saio da chamada (Sair), **When** estou num canal de texto, **Then** a miniatura **desaparece**.

---

### Edge Cases

- Mudar para **outro canal de voz** (move de mesa): a miniatura reflecte a **nova** chamada ou desaparece até a vista não-mesa voltar a aplicar-se — MUST permanecer coerente com «uma chamada activa».
- Redimensionar a janela: a miniatura MUST permanecer no canto ancorado sem sair da área útil da aplicação.
- Sobreposição com diálogos / menus: a miniatura MUST NOT impedir fechar diálogos críticos; z-order razoável (abaixo de modais).
- Sem ninguém com câmera: a miniatura MUST continuar útil (identidade da chamada / estado), não desaparecer.
- Toque / rato: arrastar deve funcionar com o pointer principal da plataforma suportada.
- Relação com a **barra de chamada ligada** já existente na shell: a barra e a miniatura **coexistem** quando o utilizador está na chamada e fora da vista da mesa (não se substituem).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando o utilizador está **na chamada** e navega para um **canal de texto** (ou vista que não é a mesa da chamada activa), o sistema MUST mostrar uma **miniatura flutuante** da chamada.
- **FR-002**: A posição **inicial** da miniatura MUST ser o **canto superior direito** da área da aplicação.
- **FR-003**: O utilizador MUST poder **arrastar** a miniatura; ao soltar, MUST **ancorar** a um dos **quatro cantos** (o mais próximo se soltar fora de um canto exacto).
- **FR-004**: A miniatura MUST **desaparecer** quando o utilizador volta à vista da mesa da chamada activa ou quando **sai** da chamada.
- **FR-005**: Estar a ver texto com a miniatura MUST NOT terminar a chamada por si só.
- **FR-006**: A miniatura MUST oferecer uma forma clara de **voltar à mesa** da chamada activa.
- **FR-007**: O conteúdo da miniatura MUST mostrar **preview de vídeo** dos participantes com câmara ligada, mais identidade da chamada; quando não há vídeo útil, MUST usar fallback claro de **nome/estado** — conceito Discord PiP; a miniatura MUST permanecer útil sem vídeo.
- **FR-008**: A miniatura MUST permanecer dentro da área útil da aplicação ao ancorar e ao redimensionar a janela.
- **FR-009**: Enquanto a miniatura estiver visível, a **barra de chamada ligada** existente na shell MUST continuar disponível (barra e PiP **coexistem**; a miniatura NÃO substitui a barra nesta entrega).
- **FR-010**: Após **reload** completo da página / reabrir a app, a posição inicial da miniatura MUST ser o **canto superior direito** (sem persistência entre reloads). Dentro da **mesma sessão de chamada** na app (sem reload), o último canto ancorado MUST ser reutilizado quando a miniatura voltar a aparecer, até o utilizador **Sair**.

### Key Entities

- **Floating call miniature (PiP)**: Janela pequena flutuante que representa a chamada activa enquanto o utilizador não está na vista da mesa.
- **Corner anchor**: Um dos quatro cantos da área da aplicação (superior direito, superior esquerdo, inferior direito, inferior esquerdo).
- **Active call session**: A chamada em que o utilizador está até Sair / perda de ligação (já existente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 5 de 5 testes, ao abrir texto durante uma chamada, a miniatura aparece no canto superior direito em ≤2 s.
- **SC-002**: Em teste de arrastar até cada um dos 4 cantos, a miniatura ancora correctamente em 4 de 4.
- **SC-003**: Soltar no centro ancora no canto mais próximo em 5 de 5 tentativas.
- **SC-004**: Voltar à mesa a partir do fluxo da miniatura (ou controlo equivalente) funciona em 5 de 5; a miniatura desaparece.
- **SC-005**: Sair da chamada remove a miniatura em ≤2 s em 5 de 5 testes.
- **SC-006**: Utilizadores familiarizados com Discord reconhecem o padrão (miniatura + cantos) numa revisão qualitativa rápida.

## Assumptions

- O gatilho principal é «estou na chamada e deixei de estar na vista da mesa» — tipicamente ao abrir um canal de texto; o mesmo PiP aplica-se se a navegação for para outra vista não-mesa sem Sair.
- Posição por omissão: canto **superior direito**, como no pedido.
- Sem persistência de canto entre reloads / reabrir app; dentro da mesma sessão de chamada, o último canto mantém-se até Sair.
- Snap: exactamente **quatro cantos**; sem ímans a arestas intermédias nesta entrega.
- Continuar na chamada ao ler texto já é comportamento de produto (028); esta feature acrescenta a **representação visual** PiP.
- A barra de chamada ligada existente **mantém-se** junto com o PiP (não é removida quando a miniatura aparece).
- Não se exige PiP em dispositivos móveis com layout radicalmente diferente nesta entrega se o shell desktop for o foco — mas o comportamento de cantos aplica-se à área da app no viewport actual.
- Preferência de produto alinhada ao Discord: preview de vídeo quando disponível; miniatura útil mesmo sem vídeo (fallback de estado).
