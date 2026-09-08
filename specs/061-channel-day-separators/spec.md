# Feature Specification: Separadores de dia no canal de texto

**Feature Branch**: `061-channel-day-separators`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos melhorar os canais de texto, vamos criar uma linha de separação entre o dia atual e o ultimo dia que teve mensagem enviada. Será uma \"dash line\" com o dia no meio \"--------- 08 Setembro 2026 ---------\" mostrando o dia atual, dessa maneira nós sempre teremos uma linha separando os dias. A linha só deve existir se houverem mensagens para aquele dia, dias sem mensagens não tem linha no chat."

**Depends on**: canais de texto com histórico de mensagens datadas (comportamento actual do produto).

**Problem**: Num canal de texto com mensagens de vários dias, é difícil perceber rapidamente onde acaba um dia e começa outro. Falta um marcador visual claro entre dias que tiveram conversa.

## Clarifications

### Session 2026-09-08

- Q: How should today (and optionally yesterday) appear on the separator? → A: Hoje / Ontem for today/yesterday; full date otherwise
- Q: Should the day separator stick to the top while scrolling through that day’s messages? → A: Sticky — current day label pins at top while scrolling that day’s block
- Q: With sticky enabled, do inline dash-line separators still appear at each day boundary? → A: Both — inline dash line at day start + sticky while scrolling
- Q: When the inline day separator is already visible at the top of the viewport, should the sticky label still show? → A: Hide sticky when the inline separator for that day is visible at the top

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver separador ao mudar de dia (Priority: P1)

Como membro a ler um canal de texto, quero ver uma linha horizontal com o **dia** no centro sempre que as mensagens passam de um dia civil para outro (desde que esse dia tenha mensagens), para orientar-me no tempo da conversa.

**Why this priority**: Pedido central; valor imediato na leitura do histórico.

**Independent Test**: Abrir um canal com mensagens em pelo menos dois dias distintos → entre o último bloco de um dia e o primeiro do dia seguinte aparece um separador (dash line + rótulo Hoje/Ontem/data); não há separadores para dias sem mensagens.

**Acceptance Scenarios**:

1. **Given** o canal tem mensagens no dia D1 e no dia D2 (D2 depois de D1), **When** vejo o histórico ordenado no tempo, **Then** aparece **um** separador de dia no início do bloco de mensagens de D2 (entre D1 e D2), com o rótulo de **D2**.
2. **Given** o canal tem mensagens só num único dia, **When** abro o canal, **Then** aparece o separador desse dia no início desse bloco (ou de forma equivalente visível para identificar o dia) — sem inventar dias vazios.
3. **Given** entre duas mensagens consecutivas no histórico **não** há mudança de dia civil, **When** leio a lista, **Then** **não** há separador de dia entre elas.

---

### User Story 2 - Sem linhas para dias sem mensagens (Priority: P1)

Como membro, quero que **não** apareçam linhas de dia para calendários «em branco» (dias sem qualquer mensagem no canal), para o chat não ficar poluído com marcadores vazios.

**Why this priority**: Explicitamente pedido; evita ruído visual.

**Independent Test**: Histórico com mensagens em segunda e quarta (terça sem mensagens) → separadores só para segunda e quarta; **nenhum** separador de terça.

**Acceptance Scenarios**:

1. **Given** há mensagens em D1 e D3, e **zero** mensagens em D2 (dia intermédio), **When** vejo o canal, **Then** vejo separadores associados a D1 e D3 (conforme regra de mudança de dia), e **não** vejo um separador rotulado como D2.
2. **Given** carrego histórico mais antigo que introduz um dia novo com mensagens, **When** esse dia passa a ter mensagens visíveis, **Then** o separador desse dia aparece; dias ainda sem mensagens continuam sem linha.

---

### User Story 3 - Formato legível do rótulo (Priority: P2)

Como membro, quero o texto do separador centrado numa linha com traços de cada lado, usando **Hoje** / **Ontem** quando o dia civil for hoje ou ontem (fuso local), e **«DD Mês AAAA»** (ex.: `08 Setembro 2026`) para dias mais antigos, para reconhecer o dia de relance.

**Why this priority**: Define a aparência pedida; secundário ao comportamento de agrupamento.

**Independent Test**: Inspeccionar separadores → dash line + rótulo; hoje/ontem com rótulo relativo; dias anteriores com data completa; leitura fácil em tema claro/escuro.

**Acceptance Scenarios**:

1. **Given** um separador para um dia anterior a ontem (ex. 8 de setembro de 2026), **When** o vejo, **Then** o rótulo segue o padrão **dia + mês por extenso + ano** (ex.: `08 Setembro 2026`), com traços/linhas de cada lado.
2. **Given** um separador para o dia civil de **hoje** (fuso local), **When** o vejo, **Then** o rótulo é **Hoje** (não a data completa), com traços de cada lado.
3. **Given** um separador para o dia civil de **ontem** (fuso local), **When** o vejo, **Then** o rótulo é **Ontem**, com traços de cada lado.
4. **Given** o tema da app (claro/escuro), **When** vejo o separador, **Then** permanece legível (contraste adequado) sem competir visualmente com as mensagens.

---

### User Story 4 - Separador sticky ao scroll (Priority: P2)

Como membro a fazer scroll no histórico, quero que o rótulo do **dia civil actualmente em vista** fique **fixado no topo** da área de mensagens enquanto percorro esse bloco, para não perder a referência temporal quando o separador inline já saiu do ecrã.

**Why this priority**: Orientação contínua durante scroll; **complementa** (não substitui) os separadores inline nas fronteiras de dia.

**Independent Test**: Canal com ≥2 dias → ver dash line inline no início de cada dia **e**, ao scrollar no meio de um bloco, rótulo sticky no topo; ao cruzar dias, sticky actualiza.

**Acceptance Scenarios**:

1. **Given** o canal tem mensagens em vários dias, **When** vejo o histórico em repouso, **Then** cada dia com mensagens tem o seu separador **inline** (dash line) no início do bloco.
2. **Given** estou a fazer scroll dentro do bloco de mensagens do dia D, **When** o separador inline de D já não está visível, **Then** o rótulo sticky no topo mostra o rótulo de D (Hoje / Ontem / data completa, conforme FR-005).
3. **Given** o separador inline do dia em vista está visível no topo da viewport, **When** não fiz scroll suficiente para o esconder, **Then** o sticky **não** está visível (evita rótulo duplicado).
4. **Given** o scroll atravessa a fronteira de D1 para D2, **When** as mensagens de D2 passam a ser o dia em vista, **Then** o sticky actualiza para o rótulo de D2 (salvo se o inline de D2 estiver visível no topo).
5. **Given** o canal não tem mensagens, **When** abro o canal, **Then** não há separador inline nem sticky de dia.

---

### Edge Cases

- Canal sem mensagens: **nenhum** separador (inline nem sticky).
- Uma única mensagem: um separador para o dia dessa mensagem (início do bloco); sticky reflecte esse dia enquanto o bloco está em vista.
- Mensagens no «hoje» e no «ontem»: separadores para ambos os dias que têm mensagens; rótulos **Hoje** e **Ontem**; mudança de dia à meia-noite local (rótulos relativos actualizam-se quando o dia civil local muda).
- Carregar mais histórico (scroll / paginação): separadores recalculados para os dias presentes nas mensagens carregadas; sem linhas para dias ausentes; sticky segue o dia em vista.
- Fuso horário: o «dia civil» é o do **fuso local do utilizador** (relógio do dispositivo).
- Sticky e inline: quando o separador inline do dia em vista está visível no topo, o sticky fica oculto; quando o inline sai de vista, o sticky aparece.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No canal de texto, o sistema MUST mostrar um separador de dia **inline** (dash line na lista) sempre que, na sequência cronológica de mensagens **carregadas**, o dia civil da mensagem actual for diferente do dia civil da mensagem anterior (ou for a primeira mensagem da lista).
- **FR-002**: O separador **inline** MUST incluir um rótulo no centro e traços/linha (dash line) de ambos os lados (ex.: `--------- Hoje ---------` ou `--------- 08 Setembro 2026 ---------`).
- **FR-003**: O sistema MUST NOT inserir separadores (inline ou sticky) para dias civis que **não** tenham pelo menos uma mensagem presente no histórico mostrado.
- **FR-004**: O dia civil MUST ser determinado no **fuso horário local** do utilizador.
- **FR-005**: O rótulo (inline e sticky) MUST ser **Hoje** se o dia civil for o dia actual local; **Ontem** se for o dia civil imediatamente anterior; caso contrário MUST usar dia com dois dígitos, mês por extenso e ano com quatro dígitos, em português do produto (ex.: `08 Setembro 2026`).
- **FR-006**: Separadores MUST actualizar-se quando o conjunto de mensagens visíveis muda (ex.: novas mensagens, carregar histórico antigo) e quando o dia civil local muda (para manter Hoje/Ontem correctos), sem exigir recarregar a app.
- **FR-007**: Separadores são apenas apresentação no canal de texto; MUST NOT alterar persistência, envio ou permissões de mensagens.
- **FR-008**: Além dos separadores inline, o sistema MUST mostrar um rótulo de dia **sticky** no topo da viewport do chat quando há mensagens e o separador **inline** do dia civil em vista **não** está visível no topo; o sticky MUST corresponder ao dia em vista, actualizar-se ao atravessar fronteiras de dia, e MUST NOT aparecer quando não há mensagens ou quando o inline correspondente já está visível no topo. O sticky **não** substitui os separadores inline.

### Key Entities

- **Mensagem (vista)**: Conteúdo já mostrado no canal, com instante de criação usado para o dia civil.
- **Separador de dia**: Marcador visual associado a um dia civil que tem ≥1 mensagem na lista; não é uma mensagem (inclui forma inline na lista e/ou rótulo sticky no topo durante scroll).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em canais de teste com mensagens em N dias distintos (N≥2), o utilizador vê exactamente **N separadores inline** (um por dia com mensagens), sem separadores inline extra para dias vazios; o sticky não conta como separador inline adicional na lista.
- **SC-002**: Em canais só com mensagens num único dia, o utilizador identifica esse dia via um separador inline em ≤5 segundos sem abrir detalhes técnicos.
- **SC-003**: 100% dos casos de teste manuais do quickstart (dias consecutivos, dia intermédio vazio, canal vazio) passam na primeira revisão de UI.
- **SC-004**: Nenhum dia sem mensagens apresenta linha de separação nos cenários de aceitação.
- **SC-005**: Ao fazer scroll através de um bloco de dia (com o inline desse dia fora de vista no topo), o utilizador continua a ver o rótulo desse dia no sticky; com o inline visível no topo, não há rótulo sticky duplicado.

## Assumptions

- Âmbito: **canais de texto** apenas (voz/vídeo fora de âmbito).
- Idioma do mês: português (pt), alinhado com a UI Mesa («Setembro», não «September»).
- Posição: separador **inline** **antes** do primeiro grupo/mensagem daquele dia na lista.
- Sticky **e** inline coexistem: dash line na lista + rótulo fixo no topo quando o inline do dia em vista já saiu do topo da viewport (sticky oculto se o inline correspondente estiver visível no topo).
- Rótulos relativos: **Hoje** e **Ontem** no fuso local; restantes dias com data completa.
- A regra aplica-se às mensagens **já carregadas** no cliente; não inventa dias entre gaps de calendário.
- Acessibilidade: o separador deve ser anunciável de forma razoável (ex. texto da data visível, não só decoração).
