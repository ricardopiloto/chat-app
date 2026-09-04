# Feature Specification: Chrome Mesa — botões, composer, palco colapsado e membros

**Feature Branch**: `008-shell-chrome-members`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Valide o HTML do protótipo v2; botões mais arredondados iguais ao protótipo; composer de texto a ocupar toda a largura do painel; Modo Palco colapsa (não oculta 100%) rail e canais; botão tipo Discord para listar membros do servidor à direita."

**Design ref**: `docs/design-ref/Mesa - Protótipo v2.dc.html` (botões `border-radius: 999px` / pill; composer full-bleed no painel; palco no protótipo zera a coluna esquerda — **esta feature diverge** e exige colapso visível em vez de ocultação total).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Botões com o arredondamento do protótipo (Priority: P1)

Como utilizador, quero que os botões da shell (primários, secundários, fantasmas usados no chrome Mesa) tenham o mesmo arredondamento “pílula” do protótipo Nocturne v2, para a UI deixar de parecer mais “quadrada” que a referência.

**Why this priority**: Pedido explícito de fidelidade visual; impacto transversal e imediato.

**Independent Test**: Abrir texto e voz; comparar botões de acção (Enviar, Convite, Modo palco, Editar cena, controlos de chamada, diálogos) com o protótipo — cantos claramente em pílula, não só `radius-md` suave.

**Acceptance Scenarios**:

1. **Given** a shell Mesa carregada, **When** o utilizador observa botões `.btn` / primários / secundários no chrome (não ícones de canal nem tiles de vídeo), **Then** o arredondamento coincide com o protótipo (pílula / raio máximo visual).
2. **Given** diálogos de criar servidor/canal e acções de voz, **When** compara com o HTML de referência, **Then** os botões de diálogo seguem o mesmo padrão de pílula.
3. **Given** controlos que já usavam pílula pontualmente, **When** se aplica a regra global, **Then** não há regressão (continuam pílula; sem misturar estilos contraditórios no mesmo grupo).

---

### User Story 2 - Composer de texto a largura total do painel (Priority: P1)

Como membro num canal de texto, quero que a caixa de mensagem (`composer`) use toda a largura útil do painel principal (alinhada às margens laterais do conteúdo), sem faixa estreita centrada/limitada.

**Why this priority**: Bug de layout reportado com DOM path concreto; afecta o fluxo diário de chat.

**Independent Test**: Abrir canal de texto em viewport largo; o `form.composer` estende-se de margem a margem do painel (padding lateral consistente com o protótipo), sem `max-width` que o deixe mais estreito que a lista de mensagens.

**Acceptance Scenarios**:

1. **Given** um canal de texto aberto em desktop largo, **When** se mede o composer, **Then** a largura do formulário corresponde à largura de conteúdo do painel (mesmas margens laterais que a lista de mensagens / cabeçalho).
2. **Given** o mesmo canal em viewport estreito ou drawer, **When** o painel encolhe, **Then** o composer continua a ocupar 100% da largura disponível do painel sem overflow horizontal.
3. **Given** o protótipo v2, **When** se compara visualmente, **Then** o composer Mesa não fica artificialmente mais estreito que a coluna de mensagens.

---

### User Story 3 - Modo Palco colapsa o chrome (não o esconde a 100%) (Priority: P1)

Como participante numa chamada em Modo Palco, quero que o rail de servidores e a coluna de canais **colapsem** para um estado compacto (ainda reconhecíveis / expansíveis), em vez de desaparecerem completamente, para eu poder voltar a navegar sem “perder” a shell.

**Why this priority**: Correcção explícita do comportamento actual (ocultação total); o protótipo zera a coluna — o produto escolhe colapso.

**Independent Test**: Entrar em Modo Palco → rail e coluna de canais ficam colapsados mas não `display: none` / largura zero sem affordance; sair do palco ou expandir restaura o chrome completo; rótulo do botão continua coerente (ex. «Mostrar canais» / «Modo palco»).

**Acceptance Scenarios**:

1. **Given** canal de voz e chrome expandido, **When** activa Modo Palco, **Then** o rail permanece visível em forma compacta (ícones) e a coluna de canais colapsa para uma faixa estreita ou estado mínimo com controlo para expandir — **não** desaparecem ambos por completo sem rasto.
2. **Given** Modo Palco activo, **When** o utilizador usa o controlo para mostrar/expandir canais (ou desactiva o palco), **Then** a coluna de canais e o layout normal voltam sem precisar de recarregar a página.
3. **Given** Modo Palco em telemóvel / drawer, **When** activa o palco, **Then** o princípio de colapso (não ocultação sem affordance) mantém-se; o palco continua a ganhar a maior parte do viewport.

**Design intent (produto)**:

- **Colapsado**: rail de ícones continua; coluna de canais reduz-se a uma faixa estreita (ou overlay/peek) com affordance clara «expandir / mostrar canais».
- **Expandido (palco off)**: layout actual de rail + sidebar + main.
- Evitar estado em que o utilizador não vê nenhum chrome de navegação e não sabe como o recuperar.

---

### User Story 4 - Lista de membros do servidor à direita (Priority: P1)

Como membro de um servidor, quero um botão no chrome do servidor (padrão Discord) que abre/fecha a listagem dos utilizadores com acesso a esse servidor, apresentada num painel à **direita** do ecrã.

**Why this priority**: Capacidade nova pedida; completa a paridade social básica da shell.

**Independent Test**: Com servidor seleccionado, clicar no botão de membros → painel direito lista membros do servidor; fechar esconde o painel; outro membro / outro servidor actualiza a lista.

**Acceptance Scenarios**:

1. **Given** servidor seleccionado, **When** o utilizador activa o botão de membros, **Then** abre um painel à direita com a lista de contas/membros desse servidor (pelo menos identificador visível, ex. handle).
2. **Given** o painel aberto, **When** o utilizador desactiva o botão ou fecha o painel, **Then** a lista deixa de ocupar a direita e o conteúdo principal recupera a largura.
3. **Given** o utilizador troca de servidor com o painel aberto, **When** a selecção muda, **Then** a lista reflecte os membros do novo servidor (ou o painel fecha de forma previsível — preferir actualizar a lista).
4. **Given** um membro que não é dono, **When** procura o botão, **Then** também o vê e pode consultar a lista (paridade Discord: listagem visível a membros).

---

### Edge Cases

- Sem servidor seleccionado: botão de membros desabilitado ou oculto.
- Servidor com um único membro: lista mostra pelo menos o próprio utilizador.
- Modo Palco + painel de membros: ambos podem coexistir; o main encolhe; priorizar legibilidade da grade.
- Composer: não deve sobrepor o painel de membros; o painel de texto partilha a largura restante.
- Telemóvel: lista de membros pode ser drawer/overlay full-height à direita sem partir o layout.
- Botões de ícone (rail, «+» de secção) podem manter raio próprio se o protótipo os tratar diferente das pílulas de acção — a regra de pílula aplica-se aos botões de acção de texto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os botões de acção do chrome Mesa (classes de botão primário/secundário/ghost usadas na shell, canais, voz e diálogos) MUST usar arredondamento tipo pílula alinhado ao protótipo v2 (`border-radius` máximo / 999px no protótipo).
- **FR-002**: O produto MUST NOT deixar o composer de canal de texto com largura máxima artificial inferior à do painel de mensagens; o `composer` MUST ocupar a largura útil lateral do painel.
- **FR-003**: Em Modo Palco, o produto MUST colapsar o rail e a navegação de canais em vez de os ocultar a 100% sem affordance; MUST existir forma clara de expandir / sair do palco e recuperar a navegação.
- **FR-004**: Com servidor seleccionado, o produto MUST oferecer um controlo (botão) para mostrar/ocultar a lista de membros do servidor.
- **FR-005**: A lista de membros MUST aparecer à direita do layout principal e listar os membros com acesso àquele servidor (reutilizando a listagem de membros já existente na instância, se disponível).
- **FR-006**: Qualquer membro do servidor MUST poder abrir a lista (não só o dono). Acções de gestão avançada (expulsar, cargos) ficam **fora de âmbito**.
- **FR-007**: O painel de membros MUST actualizar-se quando o servidor seleccionado muda (com painel aberto) ou fechar de forma documentada — preferência: actualizar a lista.
- **FR-008**: Estados de loading/vazio da lista MUST ser compreensíveis (ex. «A carregar…» / «Sem membros»).

### Out of Scope

- Presença online em tempo real / indicadores “online” estilo Discord (a menos que já existam dados triviais — não inventar).
- Moderação (kick/ban), papéis na lista, DM a partir da lista.
- Redesign completo do protótipo além de botões, composer, palco colapsado e membros.
- Alterar a regra de negócio de cenas da 007.

### Key Entities

- **Membro do servidor**: conta com acesso ao servidor seleccionado; mostrado na lista (handle / identidade legível).
- **Estado de chrome**: expandido | palco-colapsado; independente do painel de membros aberto/fechado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão lado a lado com o protótipo, **≥90%** dos botões de acção amostrados no chrome (mín. 10 controlos) usam arredondamento pílula equivalente ao HTML de referência.
- **SC-002**: Em viewport ≥1200px, a diferença de largura entre a área de mensagens e o `composer` é **≤8px** (atribuível só a padding), não a um `max-width` do formulário.
- **SC-003**: Em Modo Palco, **0** sessões de teste ficam sem nenhuma navegação visível nem botão para a recuperar; **100%** conseguem expandir/sair em ≤2 cliques.
- **SC-004**: **100%** dos membros de teste conseguem abrir a lista à direita e ver pelo menos o próprio handle no servidor seleccionado em ≤5 s após o clique (rede local).
- **SC-005**: Trocar de servidor com a lista aberta reflecte o novo conjunto de membros em **100%** das tentativas (ou fecha de forma explícita — se fechar, deve ser óbvio).

## Assumptions

- Referência visual: `docs/design-ref/Mesa - Protótipo v2.dc.html` (botões pílula; composer full width no painel).
- Divergência consciente do protótipo no palco: colapsar em vez de `0px` / ocultar total.
- Lista de membros = memberships do servidor; reutilizar a listagem de membros já existente na instância, se disponível.
- Botão de membros: localização no cabeçalho do canal / chrome do servidor (padrão Discord), acessível em texto e voz.
- Sem presença online nesta feature.
- Telemóvel: painel de membros em overlay/drawer à direita é aceitável.
- Tokens/base de botões podem viver no tema Mesa; o importante é o resultado visual pílula nos botões de acção.
