# Feature Specification: Lista de participantes e duração da chamada de voz

**Feature Branch**: `028-voice-call-roster`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Vamos adicionar a lista de pessoas logadas para os canais de voz/video, similar ao Discord, comum timer mostrando a quanto tempo a chamada já está acontecendo."

**Visual reference**: [docs/screenshots/02-canal-voz.jpg](../../docs/screenshots/02-canal-voz.jpg) — lista de pessoas **aninhada** sob o canal de voz seleccionado (ex. «Mesa de Produto»). O timer de duração **não** aparece nessa imagem; entra nesta feature. A imagem mostra todos os nomes na mesa; **esta feature só lista quem tem microfone ou câmera ligados**.

**Depends on**: canais de voz/vídeo existentes (entrar/sair da chamada, coluna de canais); painel **Membros** do servidor ([008](../008-shell-chrome-members/), [019](../019-members-invite-icons/)) permanece distinto.

## Clarifications

### Session 2026-09-05

- Q: Quando é que alguém aparece na lista aninhada sob o canal de voz? → A: Só quem tem **microfone ou câmera ligados** (na chamada daquele canal); mudo e câmera desligada ao mesmo tempo **não** aparece.
- Q: O cronómetro segue a lista (só mídia ligada) ou a chamada inteira? → A: Conta enquanto houver **alguém na chamada**, mesmo com a lista aninhada vazia (todos só a ouvir).
- Q: O que conta como estar «na chamada» (liga/desliga o cronómetro e a ocupação silenciosa)? → A: **Mesa activa** — a pessoa juntou-se à chamada até **Sair** ou perder a ligação; microfone e câmera podem estar os dois desligados.
- Q: Abrir um canal de texto sem Sair tira da chamada? → A: **Não** — permaneces na chamada até Sair (ou perda de ligação), mesmo a ver texto, como no Discord.
- Q: Clicar noutro canal de voz enquanto já estou numa mesa? → A: **Move** a chamada para esse canal (sais do anterior e juntas-te ao novo); não ficas em duas mesas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quem está a transmitir no canal de voz (Priority: P1)

Como membro de um servidor, quero ver **quem tem microfone ou câmera ligados** em cada canal de voz/vídeo, listado **debaixo do nome do canal** na coluna de canais, mesmo que eu esteja noutro canal (texto ou outra mesa), para saber quem está «visível/audível» sem abrir o palco.

**Why this priority**: É o pedido principal; hoje o canal de voz na coluna mostra só o nome.

**Independent Test**: Duas contas no mesmo servidor; A entra na chamada **com microfone ou câmera ligados**; B, a olhar a coluna de canais (pode estar num canal de texto), vê o identificador de A aninhado sob esse canal de voz. A desliga microfone **e** câmera (ou sai); a linha de A desaparece.

**Acceptance Scenarios**:

1. **Given** um canal de voz/vídeo sem ninguém com microfone ou câmera ligados, **When** olho a coluna de canais, **Then** vejo o nome do canal **sem** lista de pessoas por baixo.
2. **Given** pelo menos uma pessoa nesse canal **com microfone ou câmera ligados**, **When** qualquer membro do servidor olha a coluna de canais, **Then** vê esses identificadores aninhados sob o nome desse canal (não a lista completa de membros do servidor, nem quem está na mesa só a ouvir com mic e câmera off).
3. **Given** estou num canal de **texto** do mesmo servidor, **When** alguém noutro canal de voz tem mic ou câmera ligados, **Then** continuo a ver essa pessoa aninhada sob esse canal de voz (não preciso de abrir a mesa).
4. **Given** vários canais de voz, **When** há gente a transmitir em canais diferentes, **Then** cada um aparece só **debaixo do canal em que está**.
5. **Given** eu próprio estou na chamada **com microfone ou câmera ligados**, **When** olho a coluna, **Then** o meu identificador também aparece na lista desse canal.
6. **Given** estou na chamada mas com microfone **e** câmera desligados, **When** olho a coluna, **Then** o meu identificador **não** aparece na lista aninhada.

---

### User Story 2 - Saber há quanto tempo a chamada corre (Priority: P1)

Como membro, quero um **cronómetro da chamada em curso** nesse canal (desde que deixou de estar vazia até voltar a ficar vazia), para perceber se a mesa «já começou há muito» — não o tempo *pessoal* desde que *eu* entrei.

**Why this priority**: Pedido explícito; complementar à lista (Discord mostra tempo de ligação pessoal no painel inferior; aqui o produto pede duração **da chamada**).

**Independent Test**: A junta-se à mesa sozinha → o tempo começa próximo de zero e avança. B junta-se mais tarde → B (e A) vêem o **mesmo** tempo decorrido da sessão, não um relógio a zero para B. O último a sair da mesa (Sair ou perda de ligação) → o cronómetro desaparece; a próxima ocupação começa do zero.

**Acceptance Scenarios**:

1. **Given** o canal de voz estava sem ninguém na mesa, **When** a primeira pessoa **junta-se à chamada**, **Then** passa a existir um indicador de duração visível para os membros que vêem esse canal na coluna (e, se estiver nesse canal aberto, também no cabeçalho da mesa).
2. **Given** a chamada já corre há vários minutos, **When** outra pessoa junta-se à mesa, **Then** o tempo mostrado **não** recomeça; reflecte a sessão em curso.
3. **Given** a última pessoa sai da mesa (Sair ou perda de ligação), **When** ninguém resta na chamada, **Then** o cronómetro **desaparece** (não fica congelado).
4. **Given** uma nova ocupação mais tarde, **When** alguém volta a juntar-se, **Then** o tempo começa de novo a partir do início dessa sessão.
5. **Given** o tempo passa, **When** observo o indicador, **Then** avança de segundo a segundo de forma legível (ex. `mm:ss` ou `h:mm:ss` quando passa de uma hora).
6. **Given** há gente na chamada mas **ninguém** com microfone ou câmera ligados, **When** olho a coluna, **Then** a lista aninhada está vazia **e** o cronómetro **continua** visível e a avançar.
7. **Given** alguém só **abre** o ecrã do canal de voz sem se juntar à mesa, **When** olho a coluna, **Then** o cronómetro **não** arranca por causa dessa visita.
8. **Given** estou na chamada e abro um canal de **texto** do mesmo servidor (sem Sair), **When** olho a coluna, **Then** o cronómetro **continua** (eu continuo na mesa).

---

### User Story 5 - Continuar na mesa ao ler texto (Priority: P1)

Como participante já na chamada, quero **permanecer na mesa** quando abro um canal de texto (sem carregar em Sair), para ouvir/falar enquanto leio o chat, como no Discord.

**Why this priority**: Sem isto, a lista e o timer mentem assim que alguém muda de canal; o padrão Discord é a chamada seguir o utilizador até Sair.

**Independent Test**: A junta-se à mesa (mic ou câmera on); A abre `#geral`; B continua a ver A na lista aninhada e o timer a andar. A usa Sair (alcançável sem estar no ecrã da mesa) → A desaparece da ocupação.

**Acceptance Scenarios**:

1. **Given** estou na chamada, **When** abro um canal de texto do mesmo servidor **sem** Sair, **Then** continuo na chamada: ocupação e cronómetro não me removem só por mudar de ecrã.
2. **Given** estou na chamada a ver texto, **When** tenho microfone ou câmera ligados, **Then** o meu identificador permanece na lista aninhada desse canal de voz.
3. **Given** estou na chamada a ver texto, **When** preciso de sair, **Then** consigo **Sair** da chamada (e voltar à mesa) sem ser obrigado a estar no palco da voz no mesmo instante.
4. **Given** estou na chamada fora do ecrã da mesa, **When** olho a interface, **Then** é óbvio que a chamada continua (indicação persistente no chrome), para não ficar a transmitir sem saber.
5. **Given** estou na chamada do canal de voz A, **When** activo (entro) noutro canal de voz B, **Then** deixo A e passo a estar na chamada de B (listas e cronómetros de A e B actualizam-se em conformidade).

---

### User Story 3 - A lista acompanha quem liga e desliga mídia (Priority: P1)

Como membro a olhar a coluna de canais, quero que nomes apareçam e desapareçam **à medida** que as pessoas ligam ou desligam microfone/câmera (ou entram/saem da chamada), sem ter de recarregar a página.

**Why this priority**: Sem actualização ao vivo a lista mente.

**Independent Test**: Com a coluna visível, alguém liga o microfone → aparece; desliga mic e câmera → some; sai da chamada → some. Sem refresh manual, em poucos segundos.

**Acceptance Scenarios**:

1. **Given** uma chamada com duas pessoas visíveis na lista (mic ou câmera on), **When** uma terceira liga microfone ou câmera nesse canal, **Then** o identificador dela aparece na lista sem recarregar.
2. **Given** uma pessoa visível na lista, **When** desliga microfone **e** câmera (permanecendo na chamada), **Then** o identificador some da lista.
3. **Given** uma pessoa visível na lista, **When** sai da chamada (Sair), **Then** o identificador some da lista.
4. **Given** ninguém com mic ou câmera ligados, **When** olho o canal, **Then** a lista aninhada some por completo.

---

### User Story 4 - Não confundir com «membros do servidor» (Priority: P2)

Como membro, quero que esta lista **não** substitua o painel Membros (todos os membros do servidor) nem mostre quem está só «com sessão aberta» noutro sítio da instância.

**Why this priority**: O pedido falou em «pessoas logadas»; debaixo do canal de voz só entram quem cumpre a regra de mídia deste produto.

**Independent Test**: Servidor com três membros; só um na voz **com mic ou câmera ligados** → lista aninhada tem uma pessoa; o painel Membros continua a listar os três.

**Acceptance Scenarios**:

1. **Given** três membros no servidor e só um na chamada de voz **com microfone ou câmera ligados**, **When** comparo a coluna de canais com o painel Membros, **Then** a lista aninhada tem **uma** pessoa e Membros continua a mostrar as **três**.
2. **Given** membros com sessão na app mas **fora** de qualquer canal de voz, **When** olho os canais de voz sem ninguém a transmitir, **Then** **não** aparecem aninhados só por estarem ligados à instância.
3. **Given** o ícone/painel Membros do cabeçalho, **When** o uso, **Then** o comportamento actual (lista do servidor) **não é removido** nem substituído por esta lista.

---

### Edge Cases

- Ninguém com microfone ou câmera ligados nesse canal: sem lista aninhada; se ainda houver pessoas **na chamada** só a ouvir, o cronómetro **mantém-se**.
- Abrir o ecrã do canal de voz **sem** juntar-se à mesa: **não** conta como estar na chamada (nem lista nem início do cronómetro por essa pessoa).
- Navegar para um canal de **texto**: **não** tira da chamada.
- Clicar / juntar-se a **outro** canal de voz: **sais** da mesa actual e **entras** na nova (uma chamada de voz de cada vez). Se eras o último em A, o cronómetro de A desaparece; B usa a sessão de B (nova ou já em curso).
- Reabrir o canal de voz **em que já estás**: mostra a mesa; **não** é um segundo join nem reinicia o cronómetro.
- Pessoa na chamada a abrir outro servidor: a coluna desse outro servidor não mostra a lista do primeiro; a ocupação **no canal de voz original continua** até Sair ou perda de ligação; ao voltar ao servidor, o estado actual reflecte isso.
- Fechar o separador / perder a rede: deixa de estar na chamada; o cronómetro pára quando essa era a última pessoa.
- Pessoa na chamada com mic e câmera off: **não** entra na lista aninhada; pode continuar visível na grade/palco da mesa.
- Ligar só um dos dois (mic **ou** câmera) basta para aparecer; desligar **ambos** remove da lista.
- Vários canais de voz ocupados ao mesmo tempo: listas e tempos **independentes**.
- Modo Palco com coluna de canais colapsada: a lista completa de nomes pode não caber na faixa estreita; ao **mostrar canais** (coluna expandida) a lista aninhada e o tempo MUST voltar a estar visíveis. Não é obrigatório um segundo sítio de nomes só no palco.
- Viewport estreito / drawer: a lista aninhada permanece utilizável (identificadores legíveis; o tempo não deve empurrar o layout até overflow horizontal da coluna).
- Identificador longo: pode encurtar com reticências; o nome acessível (dica / leitor de ecrã) MUST permanecer completo.
- Quem **não** é membro do servidor: **não** vê ocupação desses canais.
- Não incluir nesta entrega: indicadores de a falar / distintivo de anfitrião, canais AFK, nem o estado «Disponível» do chip de utilizador no fundo da coluna. (Mudo/câmera off **definem quem entra na lista**, mas não há ícones extra de estado nesta entrega.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A coluna de canais MUST, para cada canal de voz/vídeo, mostrar uma lista aninhada só das pessoas **nesse canal com microfone ligado ou câmera ligada**, logo abaixo do nome do canal (mesmo sítio que [02-canal-voz.jpg](../../docs/screenshots/02-canal-voz.jpg)).
- **FR-002**: A lista aninhada MUST NOT incluir membros do servidor que não estão nesse canal, utilizadores só com sessão na instância, nem ocupantes da chamada com **microfone e câmera ambos desligados**.
- **FR-003**: Membros do servidor MUST ver essa lista mesmo quando o canal seleccionado é de texto (ou outro canal de voz).
- **FR-004**: Quando ninguém nesse canal tem microfone ou câmera ligados, a UI MUST NOT mostrar lista aninhada para esse canal (o cronómetro pode continuar se ainda houver alguém na chamada).
- **FR-005**: Enquanto o canal tiver pelo menos uma pessoa **na chamada** (com ou sem mic/câmera), a UI MUST mostrar a **duração da sessão de chamada** (tempo desde a primeira entrada após o canal estar vazio), igual para todos os observadores, avançando até a última pessoa sair da chamada.
- **FR-006**: O cronómetro MUST estar visível na coluna junto ao canal com chamada em curso, **mesmo que a lista aninhada esteja vazia**; se o utilizador tiver esse canal de voz aberto (mesa), MUST também aparecer no cabeçalho da mesa.
- **FR-007**: O cronómetro MUST desaparecer só quando **ninguém** resta na chamada; a sessão seguinte MUST contar o tempo de novo desde o início. Desligar mic e câmera MUST NOT por si só parar o cronómetro.
- **FR-008**: Ligar/desligar microfone ou câmera, e entrar/sair da chamada, MUST actualizar a lista aninhada para os outros membros **sem** recarregar a página, em poucos segundos.
- **FR-009**: A pessoa MUST aparecer na lista do canal só se estiver nessa chamada **e** tiver microfone ou câmera ligados (incluindo ela própria).
- **FR-010**: O painel Membros do servidor MUST continuar a listar os membros do servidor; esta feature MUST NOT o substituir.
- **FR-011**: Só membros do servidor MUST ver estas listas nos canais de voz desse servidor.
- **FR-012**: Textos visíveis desta feature MUST estar em português (duração, nomes já existentes da conta).
- **FR-013**: «Na chamada» / mesa activa MUST significar: a pessoa **juntou-se** à chamada daquele canal e ainda não saiu (**Sair**, perda de ligação, ou **mudança para outro canal de voz**). MUST NOT bastar ter o canal aberto no ecrã. Microfone e câmera desligados MUST NOT, por si, tirar a pessoa da chamada. Abrir um canal de **texto** MUST NOT, por si, tirar a pessoa da chamada.
- **FR-014**: Enquanto a pessoa está na chamada e **não** está no ecrã da mesa, a UI MUST (1) indicar de forma persistente que a chamada continua e (2) permitir **Sair** e regressar à mesa, sem exigir que o palco de voz esteja aberto no mesmo instante.
- **FR-015**: Uma pessoa MUST estar no máximo numa chamada de voz de cada vez. Juntar-se a um canal de voz diferente MUST tirá-la da chamada anterior e colocá-la na nova.

### Key Entities

- **Voice occupancy (lista)**: Pessoas **neste momento** numa chamada de um canal de voz/vídeo **com microfone ligado ou câmera ligada**.
- **Call session**: Período contínuo em que um canal de voz/vídeo tem pelo menos uma pessoa **na chamada** (mesa activa; independentemente de mic/câmera); começa na primeira junção após zero pessoas na mesa e termina quando a última sai, perde a ligação, ou muda para outro canal de voz.
- **Nested voice roster**: Apresentação, na coluna de canais, dos identificadores de **Voice occupancy (lista)** debaixo do canal correspondente, mais o tempo da **Call session** enquanto existir.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois de alguém **ligar** microfone ou câmera num canal de voz (já na chamada), outro membro do mesmo servidor que esteja a olhar a coluna de canais vê essa pessoa na lista aninhada em **menos de 3 segundos** (sem refresh manual).
- **SC-002**: Com o canal com chamada em curso, o tempo mostrado está **a ±2 segundos** do tempo real da sessão de chamada; um que entra a meio vê o **mesmo** tempo que quem já estava, não um relógio a zero.
- **SC-003**: Em **100%** dos casos em que ninguém nesse canal tem mic ou câmera ligados, a lista aninhada deixa de estar visível para esse canal; se ainda houver alguém na chamada, o cronómetro **permanece**.
- **SC-003b**: Em **100%** dos casos em que a última pessoa sai da chamada, o cronómetro deixa de estar visível para esse canal.
- **SC-004**: Num servidor de teste com N membros, K na chamada e M com mic ou câmera ligados (M ≤ K < N), a lista aninhada tem **M** entradas e o painel Membros continua a mostrar **N**.
- **SC-005**: Um membro consegue dizer quem está a transmitir (mic ou câmera) numa mesa de voz **sem abrir** essa mesa, só pela coluna de canais, em menos de **5 segundos** de observação.
- **SC-006**: Depois de se juntar à mesa e abrir um canal de texto **sem Sair**, a pessoa continua a contar para a ocupação e o cronómetro **não** pára só por essa navegação; outro membro vê o estado correcto em menos de **3 segundos**.
- **SC-007**: Ao mudar da mesa A para a mesa B, em menos de **3 segundos** a pessoa deixa de contar em A e passa a contar em B (lista se tiver mic/câmera; cronómetros de A/B coerentes com quem resta em cada canal).

## Assumptions

- «Pessoas logadas» no pedido = pessoas **naquele canal de voz/vídeo com microfone ou câmera ligados**, não todos os que têm sessão na instância e não todos os que estão na mesa só a ouvir.
- O timer é a duração da **sessão de chamada do canal** (há pelo menos uma pessoa na mesa), não o tempo pessoal de cada um e **não** o tempo em que há alguém a transmitir. Lista vazia + cronómetro a correr é um estado válido.
- A referência [02-canal-voz.jpg](../../docs/screenshots/02-canal-voz.jpg) define o **sítio** da lista (aninhada na coluna); o critério de quem entra na lista **diverge** da imagem (só mídia ligada).
- Identificador mostrado = o mesmo nome/handle já usado noutros sítios da app (grade, Membros).
- Actualização «em poucos segundos» é suficiente; não se exige sincronização à milissegundo.
- Indicadores visuais extra de a falar / anfitrião / AFK **ficam de fora**; o estado mic/câmera só filtra a lista.
- A grade/palco existente pode mostrar pessoas na mesa que **não** estão na lista aninhada (mic e câmera off); isso é esperado.
- «Na chamada» = mesa activa até **Sair**, perda de ligação, ou **mudança para outro canal de voz**. Navegar para texto **não** termina a chamada; o chrome MUST mostrar que a mesa continua e permitir Sair / voltar. Uma pessoa, uma mesa de voz de cada vez.
