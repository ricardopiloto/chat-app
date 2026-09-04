# Feature Specification: Chrome Mesa — botões, composer, palco colapsado e membros

**Feature Branch**: `008-shell-chrome-members`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Valide o HTML do protótipo v2; botões mais arredondados iguais ao protótipo; composer de texto a ocupar toda a largura do painel; Modo Palco colapsa (não oculta 100%) rail e canais; botão tipo Discord para listar membros do servidor à direita."

**Design ref**: `docs/design-ref/Mesa - Protótipo v2.dc.html` (botões `border-radius: 999px` / pill; composer full-bleed no painel; palco no protótipo zera a coluna esquerda — **esta feature diverge** e exige colapso visível em vez de ocultação total).

## Clarifications

### Session 2026-09-04

- Q: Como colapsa o Modo Palco (rail + canais)? → A: Rail de ícones permanece; coluna de canais vira faixa estreita com «mostrar canais» (expande a coluna sem sair do palco); «Modo palco» desliga o palco
- Q: Onde fica o botão da lista de membros? → A: Cabeçalho do canal (texto e voz) — ícone/botão «Membros»
- Q: Trocar de servidor com a lista aberta? → A: Manter o painel aberto e actualizar a lista para o novo servidor

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

**Independent Test**: Entrar em Modo Palco → rail de ícones continua visível; coluna de canais fica numa faixa estreita com controlo «mostrar canais»; expandir canais não sai do palco; «Modo palco» (ou equivalente) desliga o palco e restaura o chrome completo.

**Acceptance Scenarios**:

1. **Given** canal de voz e chrome expandido, **When** activa Modo Palco, **Then** o rail de servidores permanece (ícones) e a coluna de canais colapsa para uma **faixa estreita** com affordance «mostrar canais» — **não** desaparecem ambos por completo.
2. **Given** Modo Palco activo e coluna colapsada, **When** o utilizador activa «mostrar canais», **Then** a coluna de canais expande **sem** sair do Modo Palco; pode voltar a colapsar.
3. **Given** Modo Palco activo, **When** desactiva Modo Palco, **Then** rail + coluna voltam ao layout expandido normal sem recarregar a página.
4. **Given** Modo Palco em telemóvel / drawer, **When** activa o palco, **Then** o mesmo princípio (rail visível + canais em faixa/colapso com affordance) mantém-se; o palco ganha a maior parte do viewport.

**Design intent (produto)**:

- **Palco ON, canais colapsados**: rail de ícones intacto; coluna de canais = faixa estreita + «mostrar canais».
- **Palco ON, canais expandidos**: utilizador pediu «mostrar canais»; ainda em modo palco.
- **Palco OFF**: layout actual de rail + sidebar + main.
- Evitar estado sem navegação visível e sem forma de recuperar.

---

### User Story 4 - Lista de membros do servidor à direita (Priority: P1)

Como membro de um servidor, quero um botão no chrome do servidor (padrão Discord) que abre/fecha a listagem dos utilizadores com acesso a esse servidor, apresentada num painel à **direita** do ecrã.

**Why this priority**: Capacidade nova pedida; completa a paridade social básica da shell.

**Independent Test**: Num canal de texto ou voz, clicar «Membros» no cabeçalho → painel direito lista membros; fechar esconde o painel; trocar de servidor actualiza a lista.

**Acceptance Scenarios**:

1. **Given** um canal de texto ou voz aberto com servidor seleccionado, **When** o utilizador activa «Membros» no cabeçalho do canal, **Then** abre um painel à direita com a lista de membros desse servidor (pelo menos identificador visível, ex. handle).
2. **Given** o painel aberto, **When** o utilizador desactiva o botão ou fecha o painel, **Then** a lista deixa de ocupar a direita e o conteúdo principal recupera a largura.
3. **Given** o utilizador troca de servidor com o painel aberto, **When** a selecção muda, **Then** o painel **permanece aberto** e a lista passa a mostrar os membros do novo servidor.
4. **Given** um membro que não é dono, **When** procura o botão no cabeçalho do canal, **Then** também o vê e pode consultar a lista.
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
- **FR-003**: Em Modo Palco, o rail de servidores MUST permanecer visível (ícones). A coluna de canais MUST colapsar para uma faixa estreita com controlo «mostrar canais» que expande a coluna **sem** sair do palco. Desactivar Modo Palco MUST restaurar o chrome expandido completo. MUST NOT ocultar rail + canais a 100% sem affordance.
- **FR-004**: Com servidor seleccionado e um canal aberto (texto ou voz), o produto MUST oferecer no **cabeçalho do canal** um controlo (botão/ícone «Membros») para mostrar/ocultar a lista de membros do servidor. MUST NOT colocar esse controlo só no topbar global nem só no cabeçalho da sidebar do servidor.
- **FR-005**: A lista de membros MUST aparecer à direita do layout principal e listar os membros com acesso àquele servidor (reutilizando a listagem de membros já existente na instância, se disponível).
- **FR-006**: Qualquer membro do servidor MUST poder abrir a lista (não só o dono). Acções de gestão avançada (expulsar, cargos) ficam **fora de âmbito**.
- **FR-007**: Com o painel de membros aberto, ao mudar o servidor seleccionado o produto MUST **manter o painel aberto** e MUST actualizar a lista para os membros do novo servidor (MUST NOT fechar só por trocar de servidor).
- **FR-008**: Estados de loading/vazio da lista MUST ser compreensíveis (ex. «A carregar…» / «Sem membros»).
- **FR-009**: O botão «Membros» MUST estar disponível tanto em canais de texto como de voz/vídeo (mesmo padrão de cabeçalho).
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
- **SC-003**: Em Modo Palco, o rail permanece visível em **100%** das observações; a coluna de canais colapsa com «mostrar canais»; **100%** dos testers expandem canais ou saem do palco em ≤2 cliques sem perder navegação.
- **SC-004**: **100%** dos membros de teste conseguem abrir a lista à direita e ver pelo menos o próprio handle no servidor seleccionado em ≤5 s após o clique (rede local).
- **SC-005**: Trocar de servidor com a lista aberta mantém o painel aberto e reflecte o novo conjunto de membros em **100%** das tentativas.

## Assumptions

- Referência visual: `docs/design-ref/Mesa - Protótipo v2.dc.html` (botões pílula; composer full width no painel).
- Divergência consciente do protótipo no palco: rail permanece; canais em faixa estreita + «mostrar canais» (não overlay/peek nem hide total); «Modo palco» desliga o palco.
- Lista de membros = memberships do servidor; reutilizar a listagem de membros já existente na instância, se disponível.
- Botão de membros: no **cabeçalho do canal** (texto e voz), padrão Discord; não no topbar global.
- Painel de membros: ao trocar de servidor, permanece aberto e refresca a lista; estado inicial = fechado até o utilizador abrir.
- Telemóvel: painel de membros em overlay/drawer à direita é aceitável.
- Tokens/base de botões podem viver no tema Mesa; o importante é o resultado visual pílula nos botões de acção.
