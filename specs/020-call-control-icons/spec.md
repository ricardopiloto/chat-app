# Feature Specification: Ícones e split da barra de chamada

**Feature Branch**: `020-call-control-icons`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos melhorar os indicativos de microfone, camera e sair. Microfone troque apenas para o icone de microfone; Camera, troque apenas para o icone de camera; Sair, mantenha o icone atual, só troque a cor do botão para vermelho. Para a seta que aparece junto do botão da camera, utilize o modelo que é aplicado no discord para microfone como exemplo (imagem)"

**Depends on**: [012-shell-iconography-typography](../012-shell-iconography-typography/) (ícones da barra de chamada); [015-camera-background-blur](../015-camera-background-blur/) (menu de blur na seta da câmara).

## Clarifications

### Session 2026-09-04

- Q: Rótulo visível em «Sair»? → A: Manter ícone + texto «Sair» no botão vermelho.
- Q: Tooltip ao pairar em Microfone / Câmara? → A: Tooltip ao pairar/foco com o nome curto (ligado/desligado).

## Design rationale (referência Discord)

O utilizador forneceu o **split button de microfone do Discord** como modelo visual **apenas para a câmara + seta de fundo**:

| Elemento | Padrão de referência |
|----------|----------------------|
| Contentor | Um único bloco arredondado (fundo contínuo) |
| Acção principal | Ícone à esquerda (área clicável maior) |
| Separador | Linha vertical subtil entre ícone e seta |
| Menu | Chevron para baixo numa faixa estreita à direita, dentro do mesmo contentor |

Hoje a câmara Mesa já tem ícone + seta separados, mas não lê como um único controlo unificado (dois botões «colados»). Esta feature alinha o chrome ao modelo Discord **sem** mudar o comportamento do menu de blur nem o toggle de câmara.

Microfone e Sair **não** ganham split nesta feature — só câmara.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Microfone só com ícone (Priority: P1)

Como participante numa chamada de voz/vídeo, quero ver só o ícone de microfone (ligado/desligado) na barra de controlos, sem a palavra «Microfone», para uma barra mais compacta e alinhada a produtos de referência.

**Why this priority**: Pedido explícito e mudança isolada de apresentação.

**Independent Test**: Em chamada ao vivo, o controlo de microfone mostra apenas o ícone; o toggle liga/desliga como hoje; nome acessível e tooltip ao pairar/foco descrevem o estado.

**Acceptance Scenarios**:

1. **Given** estou numa chamada ao vivo, **When** olho para o controlo de microfone, **Then** não vejo o texto «Microfone» — só o ícone de microfone (ou o ícone de microfone desligado quando muted).
2. **Given** o microfone ligado, **When** activo o controlo, **Then** o estado passa a desligado (ícone correspondente) e o áudio deixa de ser publicado como hoje.
3. **Given** teclado ou leitor de ecrã, **When** foco o controlo, **Then** o nome acessível continua a descrever microfone ligado/desligado.
4. **Given** rato ou foco de teclado no microfone, **When** pairou / foquei sem activar, **Then** aparece um tooltip com o nome curto do estado (ex. «Microfone ligado» / «Microfone desligado»).

---

### User Story 2 - Câmara só com ícone e split Discord (Priority: P1)

Como participante numa chamada, quero a câmara representada só pelo ícone, e a seta de opções de fundo no mesmo contentor visual estilo Discord (ícone | separador | chevron), para reconhecer imediatamente o split e abrir o menu de blur sem ambiguidade.

**Why this priority**: Pedido principal do modelo visual; depende do split unificado.

**Independent Test**: Em chamada, o bloco câmara é um único contentor com ícone + linha + seta; clicar no ícone liga/desliga câmara; clicar na seta abre/fecha o menu de fundo; sem texto «Câmara».

**Acceptance Scenarios**:

1. **Given** estou numa chamada ao vivo, **When** olho para o controlo de câmara, **Then** vejo um único bloco arredondado com ícone de câmara à esquerda, separador vertical subtil, e chevron à direita — sem a palavra «Câmara».
2. **Given** o bloco de câmara, **When** activo a área do ícone, **Then** a câmara liga/desliga como hoje (ícone on/off).
3. **Given** o bloco de câmara, **When** activo a área do chevron, **Then** o menu de fundo (sem blur / blur leve / blur forte) abre ou fecha como hoje; o indicador de blur activo na seta (se existir) mantém-se reconhecível.
4. **Given** teclado ou leitor de ecrã, **When** foco cada parte do split, **Then** há nomes acessíveis distintos para toggle de câmara e para o menu de fundo.
5. **Given** rato ou foco de teclado na área do ícone de câmara, **When** pairou / foquei sem activar, **Then** aparece um tooltip com o nome curto do estado (ex. «Câmara ligada» / «Câmara desligada»).

---

### User Story 3 - Sair em vermelho (Priority: P1)

Como participante numa chamada, quero o botão Sair com o mesmo ícone de desligar chamada, mas com fundo vermelho, para o reconhecer imediatamente como acção destrutiva / saída.

**Why this priority**: Pedido explícito; risco baixo; fecha o trio de controlos principais.

**Independent Test**: Em chamada, o botão Sair mostra o ícone actual de hangup e fundo vermelho; ao activar, sai da chamada como hoje.

**Acceptance Scenarios**:

1. **Given** estou numa chamada ao vivo, **When** olho para Sair, **Then** vejo o ícone actual de desligar chamada **e** o texto «Sair», com cor de fundo vermelha (contraste legível).
2. **Given** o botão Sair, **When** o activo, **Then** saio da chamada como hoje.
3. **Given** o pedido desta feature, **When** comparo com antes, **Then** o ícone de hangup e o rótulo «Sair» mantêm-se; só a cor do botão passa a vermelho.

---

### Edge Cases

- Microfone ou câmara desligados: ícones «off» continuam a comunicar o estado sem texto.
- Menu de blur aberto: o split permanece estável; fechar por fora / seleção de opção não parte o contentor visual.
- Tema claro e escuro: o vermelho de Sair e o chrome do split mantêm contraste suficiente; o split não depende só de modo escuro.
- Controlos admin («Gravar cena…» / «Parar gravação») fora do âmbito desta feature — não precisam de passar a ícone-only.
- Alvos de toque: áreas de ícone e chevron continuam utilizáveis (≥ ~44×44 px efectivos ou equivalente confortável).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O controlo de microfone na barra de chamada MUST mostrar apenas o ícone de microfone (estados ligado/desligado); MUST NOT mostrar o rótulo textual «Microfone».
- **FR-002**: O controlo de câmara (área de toggle) MUST mostrar apenas o ícone de câmara (estados ligado/desligado); MUST NOT mostrar o rótulo textual «Câmara».
- **FR-003**: O botão Sair MUST manter o ícone actual de desligar chamada **e** o rótulo textual «Sair», e MUST usar cor de fundo vermelha (estilo de acção destrutiva / saída), com contraste legível.
- **FR-004**: A câmara e a seta de opções de fundo MUST aparecerem como um **único** contentor visual partilhado (cantos arredondados contínuos), com **separador vertical subtil** entre a área do ícone e a área do chevron — alinhado ao modelo Discord de microfone fornecido.
- **FR-005**: Activar a área do ícone de câmara MUST continuar a ligar/desligar a câmara; activar a área do chevron MUST continuar a abrir/fechar o menu de fundo da câmara (blur); comportamentos de media e preferências existentes MUST permanecer.
- **FR-006**: Microfone e Sair MUST NOT adoptar o padrão split nesta feature.
- **FR-007**: Os controlos de microfone e de toggle de câmara (icon-only) MUST expor nomes acessíveis **e** um tooltip ao pairar ou ao receber foco de teclado, com o nome curto do estado (ligado/desligado); a área do chevron de fundo MUST manter nome acessível distinto (tooltip opcional se já alinhado ao mesmo padrão).
- **FR-008**: O comportamento de gravar/parar gravação e a linha de privacidade E2EE MUST permanecer fora desta alteração visual (sem regressão intencional).
- **FR-009**: O botão Sair MUST NOT depender de tooltip para ser compreendido (já tem texto «Sair»); tooltip extra em Sair está fora de âmbito.

### Key Entities

Não há novas entidades de dados. Trata-se de apresentação da barra de controlos da chamada já existente (microfone, câmara + menu de fundo, sair).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual em chamada, microfone e câmara não mostram as palavras «Microfone» / «Câmara»; só ícones.
- **SC-002**: Em revisão visual, o bloco câmara+seta é reconhecível como um único split (contentor + separador + chevron) sem parecer dois botões independentes mal alinhados.
- **SC-003**: Em revisão visual em tema claro e escuro, o botão Sair é claramente vermelho, mostra ícone de hangup **e** o texto «Sair».
- **SC-004**: Em teste manual, ligar/desligar microfone e câmara, abrir o menu de blur e sair da chamada completam-se à primeira tentativa sem passos extra face a hoje.
- **SC-005**: Leitor de ecrã ou inspeção de acessibilidade identifica nomes distintos para microfone, toggle de câmara, menu de fundo e sair.
- **SC-006**: Em teste manual com rato, pairar sobre microfone e sobre o ícone de câmara mostra tooltip com o nome curto do estado em ≤1 s de pairar estável.

## Assumptions

- O âmbito é a barra de controlos da chamada ao vivo (voz/vídeo); não inclui o editor de cena nem o chrome do cabeçalho.
- O rótulo textual «Sair» **permanece** junto ao ícone; a alteração pedida para Sair é a **cor** do botão (vermelho), não remover texto nem mudar o desenho do ícone.
- Microfone e câmara icon-only usam tooltip nativo ou equivalente ao pairar/foco; o conteúdo espelha o nome acessível do estado actual.
- O menu Sem blur / Blur leve / Blur forte e a preferência local de blur (015) não mudam de conteúdo.
- «Vermelho» significa um vermelho de acção destrutiva coerente com o tema Mesa (legível em claro e escuro), não necessariamente o vermelho exacto do Discord.
- Gravar / Parar gravação e outros botões admin ficam como estão.
- Não há alterações de API, permissões ou media pipeline além da UI da barra.
