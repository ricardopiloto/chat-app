# Feature Specification: Avatares na lista de jogadores e nos canais de texto

**Feature Branch**: `030-voice-roster-avatars`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Com base na spec 028-voice-call-roster, na lista de jogadores, vamos adicionar também o ícone dos usuários." Extensão: "adicione nessa spec também a exibição do avatar nos canais de texto."

**Visual reference**:
- [docs/screenshots/02-canal-voz.jpg](../../docs/screenshots/02-canal-voz.jpg) — cada pessoa aninhada sob o canal de voz tem um **ícone circular à esquerda do nome**. Esta feature cobre **só** esse ícone de identidade; **não** inclui o distintivo «Anfitriã», o ícone de a falar, nem o rodapé «Disponível» da imagem.
- [docs/screenshots/01-canal-texto.jpg](../../docs/screenshots/01-canal-texto.jpg) — cada **grupo de mensagens** no canal de texto tem um **ícone circular à esquerda** do nome do autor. Esta feature cobre **só** esse ícone; **não** inclui distintivos de papel, cores de nome extra, nem reacções do mockup.

**Depends on**: lista aninhada e regras de quem aparece ([028-voice-call-roster](../028-voice-call-roster/)); foto de perfil e fallback de iniciais ([029-user-server-avatars](../029-user-server-avatars/)); canal de texto com grupos de mensagens já identificados por handle. O painel **Membros** e o chip da topbar permanecem superfícies de 029; esta spec **exige** o mesmo ícone na lista de jogadores **e** nos grupos de mensagens de texto.

## Clarifications

### Session 2026-09-05

- Q: Quando a linha aparece na lista, a foto já tem de estar correcta? → A: Foto correcta no instante em que a linha aparece (quem já tem foto não fica só com iniciais)
- Q: Se alguém já na lista altera ou remove a foto, os outros vêem o ícone novo de imediato? → A: Foto nova ou removida na lista só depois de actualizar ou reabrir a vista (como 029); a linha a aparecer continua com a foto já existente

As duas respostas aplicam-se também ao **grupo de mensagens** no canal de texto: foto correcta quando o grupo aparece; mudança de foto enquanto se lê o canal não exige aviso instantâneo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconhecer quem transmite pelo ícone (Priority: P1)

Como membro a olhar a coluna de canais, quero ver o **ícone de cada pessoa** (foto de perfil ou iniciais) **à esquerda do nome** na lista aninhada sob o canal de voz, para distinguir rapidamente quem está a transmitir sem depender só do handle.

**Why this priority**: Pedido original; a lista de 028 já mostra nomes; o mockup pede o ícone junto a cada linha.

**Independent Test**: Duas contas no mesmo servidor; A **já tem** foto de perfil e entra na chamada com microfone ou câmara ligados; B, a olhar a coluna, vê A aninhada sob esse canal **com a foto de A** (não só iniciais) à esquerda do handle, no mesmo instante em que o nome aparece. Sem foto, B vê o fallback de iniciais.

**Acceptance Scenarios**:

1. **Given** pelo menos uma pessoa na lista aninhada (microfone ou câmara ligados), **When** olho a coluna de canais, **Then** cada linha mostra um ícone circular à esquerda do identificador, no mesmo sítio que [02-canal-voz.jpg](../../docs/screenshots/02-canal-voz.jpg).
2. **Given** essa pessoa **já tem** foto de perfil, **When** a linha dela aparece na lista aninhada, **Then** o ícone **já é** essa foto (preenchendo o círculo), não um intervalo só com iniciais.
3. **Given** estou num canal de **texto** do mesmo servidor, **When** alguém transmite noutro canal de voz, **Then** continuo a ver o ícone dessa pessoa na lista aninhada (não preciso de abrir a mesa).
4. **Given** eu próprio estou na lista (mic ou câmara ligados), **When** olho a coluna, **Then** o meu ícone aparece na minha linha, igual ao critério de 028 para o meu nome.

---

### User Story 2 - Sem foto, iniciais estáveis (Priority: P1)

Como membro, quero que quem **ainda não tem** foto de perfil continue identificável na lista de jogadores **e** nas mensagens de texto, com o **mesmo fallback de iniciais**, sem linhas ou grupos partidos nem círculos vazios.

**Why this priority**: As listas misturam pessoas com e sem foto; o ícone não pode ser só para quem já fez upload.

**Independent Test**: Conta sem foto entra na chamada a transmitir **e** envia uma mensagem de texto → a linha na lista aninhada e o grupo de mensagens mostram iniciais no círculo + handle; o layout não rebenta.

**Acceptance Scenarios**:

1. **Given** uma pessoa visível na lista aninhada **sem** foto de perfil, **When** olho a linha, **Then** vejo o fallback de iniciais no círculo (o mesmo tipo de iniciais que no chip / membros) e o handle.
2. **Given** na mesma lista uma pessoa **com** foto e outra **sem**, **When** comparo as linhas, **Then** ambas têm um círculo do mesmo tamanho; só o conteúdo (foto vs iniciais) difere.
3. **Given** uma pessoa **já na lista** (ou com mensagens já visíveis) remove ou substitui a foto de perfil, **When** os outros continuam a olhar **sem** reabrir a vista, **Then** o ícone **pode** ficar o antigo; **When** actualizam ou reabrem a vista, **Then** passam a ver a foto nova ou o fallback de iniciais (não fica um buraco).

---

### User Story 3 - A lista de voz continua a ser a de 028 (Priority: P2)

Como membro, quero que **quem entra e sai** da lista aninhada continue a seguir as regras de 028 (só mic ou câmara ligados; cronómetro e painel Membros inalterados), para o ícone ser um acrescento visual e não uma lista diferente.

**Why this priority**: Evita regressão no pedido original.

**Independent Test**: Servidor com três membros; só um a transmitir → uma linha na lista aninhada, com ícone + nome; Membros continua a listar três; quem está na mesa só a ouvir não aparece.

**Acceptance Scenarios**:

1. **Given** três membros e só um com microfone ou câmara ligados, **When** olho a coluna e o painel Membros, **Then** a lista aninhada tem **uma** linha (ícone + identificador) e Membros continua com **três**.
2. **Given** alguém na chamada com mic **e** câmara desligados, **When** olho a lista aninhada, **Then** essa pessoa **não** aparece (com ou sem foto de perfil).
3. **Given** modo Palco com coluna de canais colapsada, **When** a faixa está estreita, **Then** a lista (ícones incluídos) pode ocultar-se como em 028; ao **mostrar canais**, ícones e nomes voltam a estar visíveis.

---

### User Story 4 - Ver o avatar de quem escreve no canal de texto (Priority: P1)

Como membro num canal de texto, quero ver o **ícone de identidade** (foto ou iniciais) **à esquerda do nome** em cada grupo de mensagens, no sítio de [01-canal-texto.jpg](../../docs/screenshots/01-canal-texto.jpg), para reconhecer quem escreveu sem depender só do handle.

**Why this priority**: Pedido explícito de alargar esta spec à exibição nos canais de texto; o mockup de texto já mostra o círculo junto ao autor.

**Independent Test**: A **já tem** foto de perfil e envia uma mensagem em `#geral`; B, a ler o canal, vê o grupo de A com a **foto de A** à esquerda do handle, no mesmo instante em que o grupo aparece. Sem foto, B vê iniciais no mesmo sítio. O layout do bloco de mensagem não parte.

**Acceptance Scenarios**:

1. **Given** um grupo de mensagens de um autor no canal de texto, **When** olho o histórico, **Then** vejo um ícone circular à esquerda do identificador do autor, alinhado com o nome como em [01-canal-texto.jpg](../../docs/screenshots/01-canal-texto.jpg).
2. **Given** o autor **já tem** foto de perfil, **When** o grupo aparece (histórico ou mensagem nova), **Then** o ícone **já é** essa foto, não um intervalo só com iniciais.
3. **Given** o autor **não** tem foto, **When** olho o grupo, **Then** vejo o fallback de iniciais no círculo, do mesmo tipo que no chip / membros / lista de jogadores.
4. **Given** várias mensagens seguidas do mesmo autor num só grupo, **When** olho o grupo, **Then** há **um** ícone (não um por cada linha de texto).
5. **Given** estou no canal de texto e a lista de voz aninhada também está visível, **When** a mesma pessoa transmite e escreve, **Then** vejo o ícone dela **nos dois sítios** (lista de jogadores e grupo de mensagens), com a mesma regra foto/iniciais.

---

### Edge Cases

- Handle longo (lista de voz): o nome pode encurtar com reticências; o ícone MUST permanecer visível; o nome acessível (dica / leitor de ecrã) MUST permanecer completo.
- Viewport estreito / drawer: ícone + nome na coluna de canais MUST caber sem overflow horizontal.
- Vários canais de voz ocupados: cada lista aninhada mostra os ícones das pessoas **desse** canal.
- Pessoa na lista noutro servidor: a coluna desse servidor não mostra a lista do primeiro (inalterado em 028).
- Pessoa que **já tinha** foto de perfil antes de aparecer na lista de voz **ou** num grupo de mensagens: os outros membros vêem essa foto **no mesmo instante** em que a linha/grupo aparece (não esperam reabrir a vista).
- Pessoa **já visível** (lista ou mensagens) que define, substitui ou remove a foto: os outros MUST NOT precisar de um aviso instantâneo; o ícone actualiza depois de actualizarem ou reabrirem a vista (mesmo critério de 029).
- Sem foto: nunca um círculo vazio ou ícone genérico diferente do fallback de iniciais já usado na app.
- Autor desconhecido / handle ainda não resolvido no canal de texto: o grupo MUST mesmo assim ter um círculo estável (iniciais a partir do identificador visível), sem buraco de layout.
- Fora de âmbito: distintivo de anfitrião, indicadores de a falar, estado «Disponível», ícones de microfone/câmara por linha, distintivos de papel junto ao nome no chat, lista de «quem está no canal de texto», imagem do servidor no rail (já 029), alterar quem entra na lista de voz, cronómetro, barra «ainda na chamada».

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada linha da lista aninhada de jogadores (pessoas no canal de voz/vídeo com microfone ou câmara ligados, per [028](../028-voice-call-roster/)) MUST mostrar um **ícone de identidade circular à esquerda** do identificador.
- **FR-002**: Se a pessoa **já tiver** foto de perfil no momento em que a linha da lista **ou** o grupo de mensagens aparece, o ícone MUST ser essa foto desde esse instante (preenchendo o círculo; recorte visual; a foto pode não ser quadrada). MUST NOT mostrar só iniciais como estado intermédio obrigatório.
- **FR-003**: Se a pessoa **não** tiver foto de perfil, o ícone MUST usar o **fallback de iniciais** já usado noutros sítios de identidade da app ([029](../029-user-server-avatars/)).
- **FR-004**: Todas as linhas da mesma lista de voz MUST usar um círculo do **mesmo tamanho**; foto e iniciais MUST alinhar-se de forma estável. Os grupos de mensagens de texto MUST usar um círculo estável entre si (pode ser maior que o da lista de voz, adequado ao bloco de mensagem).
- **FR-005**: Esta feature MUST NOT alterar quem aparece ou desaparece da lista aninhada, nem o cronómetro da sessão, nem o painel Membros.
- **FR-006**: O ícone da lista de voz MUST ser visível nas mesmas condições em que a lista aninhada já é visível (coluna expandida; membro do servidor; incluindo quando o canal seleccionado é de texto).
- **FR-007**: Textos visíveis MUST permanecer em português; o ícone é decorativo relativamente ao nome — o identificador (handle) continua a ser o texto da linha/grupo e o nome acessível MUST continuar completo.
- **FR-008**: Esta feature MUST NOT acrescentar distintivos de anfitrião, indicadores de a falar, ícones de estado de microfone/câmara por linha, nem distintivos de papel no chat.
- **FR-009**: Definir, substituir ou remover a foto de perfil **enquanto a pessoa já está visível** (lista de voz ou mensagens já no ecrã) MUST NOT exigir que os outros observadores vejam o ícone novo sem actualizar ou reabrir a vista. (A primeira aparição continua a FR-002.)
- **FR-010**: Cada grupo de mensagens num canal de texto MUST mostrar o **ícone de identidade do autor** à esquerda do identificador, no sítio de [01-canal-texto.jpg](../../docs/screenshots/01-canal-texto.jpg).
- **FR-011**: Esta feature MUST NOT criar uma lista de ocupação para canais de texto (não há «jogadores» aninhados sob canais `#`).

### Key Entities

- **Nested voice roster row**: Uma pessoa já listada sob um canal de voz (regra de 028) apresentada como **ícone de identidade + identificador**.
- **Text message group**: Bloco de uma ou mais mensagens seguidas do mesmo autor num canal de texto, apresentado como **ícone de identidade + identificador + conteúdo**.
- **User identity icon**: Foto de perfil da conta quando existe **no momento em que a linha ou o grupo aparece**; caso contrário as iniciais de fallback da mesma conta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um membro a olhar a coluna de canais identifica quem está na lista aninhada (ícone + nome) em menos de **5 segundos**, sem abrir a mesa.
- **SC-001b**: Depois de alguém **já com foto de perfil** ligar microfone ou câmara (já na chamada), outro membro vê a linha **com essa foto** (não só iniciais) em menos de **3 segundos**, no mesmo prazo em que 028 exige o nome.
- **SC-002**: Em **100%** das linhas visíveis da lista aninhada há um ícone circular (foto ou iniciais) à esquerda do identificador; nenhuma linha fica só com texto.
- **SC-003**: Numa lista ou histórico mistos (com e sem foto de perfil), **100%** das linhas/grupos sem foto mostram iniciais no círculo, nunca um círculo vazio.
- **SC-004**: Com N membros no servidor e M a transmitir (M ≤ N), a lista aninhada continua a ter **M** linhas (ícone não muda a contagem de 028); o painel Membros continua a mostrar **N**.
- **SC-005**: Numa coluna estreita (drawer ou viewport reduzido), a lista de voz com ícones permanece utilizável: identificadores legíveis ou com reticências, **sem** overflow horizontal da coluna.
- **SC-006**: Depois de alguém **já visível** (lista ou mensagens) alterar ou remover a foto, não é falha se outro membro continuar a ver o ícone antigo até actualizar ou reabrir a vista; após essa actualização, **100%** das linhas/grupos visíveis reflectem foto actual ou iniciais.
- **SC-007**: Um membro a ler um canal de texto identifica o autor de um grupo visível (ícone + nome) em menos de **5 segundos**; se o autor já tinha foto, o grupo mostra essa foto no instante em que aparece (histórico ao abrir o canal ou mensagem nova).

## Assumptions

- «Lista de jogadores» = a lista **aninhada sob o canal de voz** de [028](../028-voice-call-roster/), não o painel Membros, não a grade/palco, não a barra de chamada persistente.
- «Exibição do avatar nos canais de texto» = ícone de identidade em cada **grupo de mensagens** do canal `#`, no sítio do mockup [01-canal-texto.jpg](../../docs/screenshots/01-canal-texto.jpg) — **não** uma lista de quem está a ver o canal de texto.
- «Ícone dos usuários» = a **identidade visual da conta** já definida em [029](../029-user-server-avatars/) (foto de perfil ou iniciais). 029 já previa mensagens como superfície mínima; esta spec torna lista de voz **e** grupos de texto histórias de primeira linha da mesma feature.
- A regra de quem entra na lista de voz **não muda**: só microfone ou câmara ligados.
- Distintivo «Anfitriã», onda de a falar, rodapé de estado e distintivos de papel do mockup de texto **continuam fora de âmbito**.
- Quem **já tinha** foto quando a linha ou o grupo aparece: os observadores vêem foto + nome juntos (prazo de 028 para a lista de voz; imediato no grupo de texto que acaba de surgir).
- Quem **já está** visível e muda a foto: os outros actualizam o ícone como em 029 (depois de actualizarem ou reabrirem a vista). Esta feature MUST NOT exigir um canal ao vivo só para fotos.
- Círculo da lista de voz: compacto (menor que o das mensagens de texto). Círculo no chat: o tamanho já usado para identidade junto ao grupo de mensagens.
