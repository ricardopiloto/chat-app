# Feature Specification: Painel de utilizador a atravessar a rail e borda do shell

**Feature Branch**: `048-user-panel-span-rail`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Faça o user-panel ocupar todo o espaço de onde está para a esquerda. Isso força a reduzir o tamanho vertical do server-rail. Olhando para a shell também, adicione uma borda fina pelo shell para dar um destaque maior."

## Clarifications

### Session 2026-09-06

- Q: Forma do painel alargado → A: Um cartão contínuo na base (largura rail + canais); rail encurtada acima com gutter
- Q: Onde corre a borda fina → A: Contorno fino à volta de todo o chrome (topbar + navegação + painel principal [+ membros])
- Q: Cantos da moldura exterior → A: Contorno exterior com cantos arredondados (mesmo ritmo dos cartões do chrome)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Painel de utilizador de ponta a ponta na navegação (Priority: P1)

Como utilizador autenticado, quero que a barra inferior do meu perfil (avatar, handle, controlos de chamada quando activos) ocupe toda a largura da zona de navegação esquerda — desde a margem esquerda da lista de servidores até ao fim da coluna de canais — para o bloco de identidade ler como uma base contínua da shell, não só um cartão estreito sob a lista de canais.

**Why this priority**: Pedido principal de composição; define a nova geometria do chrome.

**Independent Test**: Abrir a app autenticado; confirmar visualmente que o painel de utilizador cobre a largura da rail + sidebar e que a lista de servidores termina acima desse painel.

**Acceptance Scenarios**:

1. **Given** a shell normal (canais + rail visíveis), **When** o utilizador observa a coluna de navegação, **Then** o painel de utilizador aparece como **um único cartão contínuo** na base, com largura rail + coluna de canais (não um cartão só sob a sidebar nem dois stubs lado a lado).
2. **Given** o mesmo estado, **When** se compara a altura da rail de servidores com o layout anterior, **Then** a rail é mais baixa: o seu fundo termina acima do painel, separado por o **mesmo gutter** usado entre os outros cartões do chrome (não desce ao lado do painel até ao fundo).
3. **Given** o painel com controlos de chamada visíveis (em chamada fora do stage), **When** o utilizador usa mic / surdez / câmara / sair, **Then** os controlos continuam utilizáveis e legíveis dentro do painel alargado.

---

### User Story 2 - Rail de servidores encurtada verticalmente (Priority: P1)

Como utilizador com vários servidores, quero que a lista de servidores ocupe apenas o espaço vertical acima do painel de utilizador, para o painel “roubar” essa faixa inferior sem sobrepor ícones de servidor.

**Why this priority**: Consequência explícita do pedido (“força a reduzir o tamanho vertical” da rail); sem isto o painel alargado colide com a rail.

**Independent Test**: Com vários servidores na lista, confirmar que o último ícone e o botão “+” ficam acima do painel; scroll da lista (se existir) respeita a área acima do painel.

**Acceptance Scenarios**:

1. **Given** servidores suficientes para preencher a rail, **When** o utilizador faz scroll na lista (se aplicável), **Then** o conteúdo da rail permanece na área acima do painel de utilizador e não fica oculto por baixo dele.
2. **Given** poucos servidores, **When** a shell está em altura típica de desktop, **Then** há espaço vazio na rail acima do painel, sem o painel invadir a coluna de ícones.

---

### User Story 3 - Borda fina a destacar o shell (Priority: P2)

Como utilizador, quero uma borda fina à volta de **todo o chrome** (topbar + navegação + painel principal [+ membros]), para o quadro Mesa destacar-se melhor do fundo da página.

**Why this priority**: Segundo pedido explícito; reforço visual sem mudar fluxos.

**Independent Test**: Comparar a borda exterior do shell com o fundo da app; a borda é visível mas subtil em tema claro e escuro.

**Acceptance Scenarios**:

1. **Given** a app aberta em tema nocturno (ou o tema activo por omissão), **When** o utilizador observa o contorno da área de trabalho, **Then** existe uma borda fina contínua à volta de **todo o chrome** (topbar + navegação + painel principal, e membros quando abertos), separando esse quadro do fundo da página — não só à volta da grelha abaixo da topbar nem só da navegação esquerda.
2. **Given** o tema claro (se disponível), **When** o mesmo contorno é observado, **Then** a borda permanece legível, com cantos arredondados no ritmo dos cartões internos, sem glow exagerado nem moldura grossa.

---

### Edge Cases

- Em **modo stage** (canais colapsados a faixa estreita): o painel de utilizador MUST continuar a cobrir a largura da navegação esquerda (rail + faixa/sidebar), e a rail MUST continuar a terminar acima do painel.
- Com **painel de membros** aberto à direita: a geometria do painel de utilizador e da rail à esquerda MUST manter-se; a borda fina MUST continuar a envolver o chrome **completo**, incluindo a coluna de membros.
- Viewport estreita / altura reduzida: o painel MUST permanecer utilizável; a rail MUST continuar a permitir aceder aos servidores (scroll se necessário) sem o painel cobrir ícones.
- Não MUST quebrar o gutter / cartões inset já existentes do chrome (cantos arredondados e separação subtil entre cartões).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O painel de utilizador (identidade + controlos associados) MUST renderizar como **um único cartão contínuo** na base da navegação esquerda, ocupando a largura desde a margem esquerda da rail até à margem direita da coluna de canais (ou faixa equivalente em stage) — não um cartão só sob a sidebar nem dois cartões alinhados na base.
- **FR-002**: A rail de servidores MUST ter a sua altura útil limitada à área **acima** desse cartão-base, com **gutter** entre o fundo da rail e o topo do painel (mesmo ritmo dos outros cartões inset); MUST NOT estender-se verticalmente ao lado do painel até ao fundo da shell.
- **FR-003**: O conteúdo e acções do painel de utilizador (handle, menu de conta, controlos de voz quando visíveis) MUST permanecerem funcionais após o alargamento.
- **FR-004**: O chrome da aplicação (topbar + navegação esquerda + painel principal [+ membros quando visíveis]) MUST apresentar uma **borda fina** no seu **contorno exterior conjunto**, aumentando o destaque face ao fundo — MUST NOT limitar-se à grelha abaixo da topbar nem só à coluna de navegação.
- **FR-005**: A borda MUST ser subtil (fina), com **cantos arredondados no mesmo ritmo** dos cartões inset do chrome, coerente com o sistema visual Mesa e legível em temas claros e escuros — sem glow, sem moldura grossa, e sem substituir os gutters internos entre cartões.
- **FR-006**: Em modo stage e com membros abertos, FR-001–FR-004 MUST continuar a cumprir-se sem regressões óbvias de layout (sobreposição, corte de controlos, rail inacessível).

### Key Entities

- **Painel de utilizador**: cartão contínuo na base da navegação esquerda (largura rail + canais), identidade/controlos.
- **Rail de servidores**: lista vertical de servidores + acção de criar; altura limitada pelo painel.
- **Shell / chrome**: composição principal (topbar + navegação + painel [+ membros]); o contorno exterior conjunto recebe a borda fina de destaque.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em viewport desktop típica (≥1280×720), 100% das revisões visuais confirmam um **único cartão** de painel de utilizador cuja largura coincide com a soma visual rail + sidebar, com gutter entre o fundo da rail e o topo desse cartão.
- **SC-002**: Em 100% das mesmas revisões, a rail de servidores termina acima do topo do painel de utilizador (sem ícones de servidor sob ou ao lado do painel na faixa inferior).
- **SC-003**: Em chamada com controlos no painel, 100% das acções primárias (mute / surdez / câmara / sair, quando aplicáveis) permanecem accionáveis sem scroll horizontal obrigatório do painel.
- **SC-004**: Em tema claro e escuro, 100% dos revisores distinguem o contorno do **chrome completo** (incluindo topbar) do fundo graças à borda fina com cantos arredondados (sem a descreverem como “moldura grossa”, “rectângulos afiados” ou “neon”).
- **SC-005**: Modo stage e membros abertos: zero sobreposições que escondam o handle ou o último servidor acessível na rail.

## Assumptions

- O alargamento é só de **layout/chrome**; não muda permissões, APIs nem o conteúdo semântico do painel.
- “Para a esquerda” significa alinhar o painel à margem esquerda da **navegação** (rail), não atravessar o painel principal de mensagens/stage.
- A borda “pelo shell” é o **contorno exterior de todo o chrome** (topbar + shell), não molduras extra em cada cartão interno nem só na grelha abaixo da topbar.
- Espessura “fina” ≈ 1px (ou o token de borda subtil já usado no produto); cor derivada do sistema de tema (sem roxo/glow); cantos do contorno exterior no mesmo ritmo dos cartões inset.
- Gutters e cartões inset de [045-shell-chrome-radius](../045-shell-chrome-radius/) mantêm-se; o painel-base unificado usa o mesmo gutter face à rail; esta feature **ajusta geometria** do painel/rail e **adiciona** destaque de contorno.
- Comportamento mobile estreito fora do foco desta feature; desktop/shell actual é o alvo.

## Out of Scope

- Redesign dos controlos de voz ou tipografia do handle.
- Alterar larguras nominais da rail (68px) ou sidebar (238px) para outros valores, excepto o necessário para o painel atravessar ambas.
- Novas funcionalidades no menu de conta.
- Alterar a topbar ou o conteúdo do painel principal além do contorno do shell.
