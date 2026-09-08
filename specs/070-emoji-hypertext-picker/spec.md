# Feature Specification: Emoji no título do canal, no chat e picker

**Feature Branch**: `070-emoji-hypertext-picker`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos permitir hypertext emoji no título do canal e vamos permitir hypertext emoji no chat também, adicione um ícone de emoji para o usuário poder selecionar caso ele não saiba os atalhos de cabeça. Quando o usuário estiver digitando, se ele digitar algum atalho,não vamos substituir automaticamente, vamos dar a opção ao usuário de substituir o texto por emoji ou não."

**Amendment (2026-09-08)**: Ícone de emoji e novo ícone **Enviar** (estilo avião de papel / Telegram) **dentro** da área do campo de mensagem, alinhados à **direita**; ícone de **anexo (+)** dentro do mesmo campo, alinhado à **esquerda**; o texto digitado **não** pode sobrepor os ícones.

**Problem**: Títulos de canal e mensagens de chat não oferecem um caminho claro para usar **emoji** (caracteres emoji legíveis no texto). Quem não memoriza atalhos não tem um selector; quem digita atalhos corre o risco de substituição automática indesejada. É preciso permitir emoji no título e no chat, com **picker** e com **confirmação** quando um atalho é reconhecido — nunca substituir sozinho. O composer actual tem anexo e «Enviar» fora do campo de texto; o pedido alinha anexo, emoji e envio **dentro** do campo, sem o texto escrever por cima dos ícones.

## Clarifications

### Session 2026-09-08

- Q: UI da opção de substituição do atalho? → A: Sugestão inline (como o picker de @); Enter/clique aceita; Esc ou continuar a escrever = manter o atalho
- Q: Atalhos também no nome do canal? → A: Atalhos + sugestão só no **composer**; no nome do canal só picker (e teclado do SO)
- Q: Quando aparece a sugestão de atalho? → A: Após `:`, lista filtrada enquanto digita; aceitar com Enter/clique ou Esc para fechar — sem auto-replace (incl. ao fechar `:nome:`)
- Q: Layout do composer (amendment)? → A: Anexo (+) **dentro** do campo, à **esquerda**; emoji + **Enviar** (ícone avião de papel) **dentro** do campo, à **direita**; texto não sobrepõe ícones
- Q: Quando o ícone Enviar (avião) fica activo? → A: Activo com texto não vazio **ou** anexo pendente; inactivo se ambos vazios

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emoji no título do canal (Priority: P1)

Como membro autorizado a criar ou renomear um canal, quero poder incluir **emoji** no **nome/título** do canal, para o canal ficar reconhecível na lista lateral e no resto da app.

**Why this priority**: Pedido explícito; nomes sem emoji são o bloqueio base.

**Independent Test**: Criar ou renomear um canal com um emoji no nome → o nome guarda e mostra o emoji em todo o sítio onde o título do canal aparece.

**Acceptance Scenarios**:

1. **Given** posso criar/renomear um canal, **When** incluo um ou mais emoji no nome e confirmo, **Then** o título guardado e mostrado inclui esses emoji (não são removidos nem convertidos em texto «quebrado»).
2. **Given** um canal já tem emoji no título, **When** vejo a lista de canais / cabeçalhos que mostram o nome, **Then** o emoji aparece de forma legível junto ao resto do nome.
3. **Given** um nome só com texto (sem emoji), **When** crio/renomeio como hoje, **Then** o comportamento continua válido (emoji é opcional).

---

### User Story 2 - Emoji no chat (Priority: P1)

Como membro a escrever num canal de texto, quero poder incluir **emoji** no corpo da mensagem, para expressar tom e reacção no texto enviado.

**Why this priority**: Segundo pedido explícito; o chat é o uso quotidiano.

**Independent Test**: Enviar uma mensagem com emoji no texto → o histórico mostra os mesmos emoji para quem consegue ler a mensagem.

**Acceptance Scenarios**:

1. **Given** estou no composer de um canal de texto, **When** incluo emoji no texto e envio, **Then** a mensagem publicada contém esses emoji no conteúdo legível.
2. **Given** uma mensagem com emoji já enviada, **When** a leio no histórico, **Then** os emoji aparecem no corpo (não só como código cru de atalho, se já tiverem sido convertidos ou inseridos como emoji).
3. **Given** mensagens só de texto sem emoji, **When** continuo a conversar, **Then** o fluxo de envio/leitura não regrede.

---

### User Story 3 - Ícone de picker de emoji (Priority: P1)

Como membro que **não** sabe atalhos de cabeça, quero um **ícone de emoji** no composer (e, quando aplicável, na edição do nome do canal) que abre um selector, para escolher e inserir um emoji sem memorizar códigos. No composer, esse ícone fica **dentro da caixa de mensagem**, alinhado à **direita** (junto ao envio).

**Why this priority**: Pedido explícito; torna emoji acessível.

**Independent Test**: Clicar no ícone de emoji à direita dentro do campo → abrir selector → escolher emoji → o emoji entra no campo; o texto não fica por baixo do ícone.

**Acceptance Scenarios**:

1. **Given** o composer de chat está disponível, **When** vejo a caixa «Escrever mensagem…», **Then** o ícone de emoji está **dentro** dessa caixa, alinhado à **direita**.
2. **Given** o composer disponível, **When** clico no ícone de emoji, **Then** abre um selector de emoji utilizável.
3. **Given** o selector aberto, **When** escolho um emoji, **Then** esse emoji é **inserido** no campo na posição do cursor (ou no fim) e posso continuar a escrever.
4. **Given** estou a editar o **nome do canal** (criar/renomear) e o picker está disponível nesse fluxo, **When** escolho um emoji, **Then** ele entra no campo do nome.
5. **Given** o selector aberto, **When** cancelo / fecho sem escolher, **Then** o texto do campo não muda por causa do fecho.

---

### User Story 4 - Atalho sem substituição automática (Priority: P1)

Como membro a digitar no **composer**, se eu escrever um **atalho** de emoji reconhecido, quero que o sistema **não** substitua automaticamente o texto; quero uma **sugestão inline** para aceitar a substituição ou manter o atalho.

**Why this priority**: Regra explícita do pedido; evita surpresas ao escrever.

**Independent Test**: Digitar `:` no composer → lista filtrada; continuar a filtrar; Enter/clique insere emoji; Esc ou ignorar mantém o texto; fechar `:nome:` sozinho não substitui.

**Acceptance Scenarios**:

1. **Given** estou no **composer** e digito `:`, **When** continuo a escrever caracteres do atalho, **Then** aparece uma **lista filtrada** de emoji/atalhos compatíveis e o texto digitado **não** é substituído sozinho.
2. **Given** a lista filtrada está visível, **When** pressiono Enter ou clico num item, **Then** o segmento do atalho em curso (desde o `:`) é substituído pelo emoji escolhido.
3. **Given** a lista está visível, **When** pressiono Esc ou continuo de forma que a sugestão se dispense sem aceitar, **Then** o texto do atalho (ou parcial) permanece no composer.
4. **Given** digitei um atalho completo `:nome:`, **When** não aceitei explicitamente (Enter/clique), **Then** o texto permanece como escrito — fechar o segundo `:` **não** força substituição automática.
5. **Given** estou a editar o **nome do canal**, **When** digito `:`, **Then** **não** aparece sugestão de atalho (emoji via picker ou teclado do SO).
6. **Given** a sugestão de emoji está aberta, **When** usaria Enter para enviar a mensagem, **Then** Enter aceita a sugestão (não envia), no mesmo espírito do picker de menções.

---

### User Story 5 - Composer: anexo, emoji e enviar na caixa (Priority: P1)

Como membro a escrever no chat, quero o **anexo (+)** à **esquerda dentro** da caixa de mensagem, e à **direita dentro** da mesma caixa o **ícone de emoji** e um **ícone Enviar** (avião de papel, estilo Telegram — em vez do botão com texto «Enviar»), para um composer compacto e familiar; o texto que digito **não** pode aparecer por cima desses ícones.

**Why this priority**: Amendment explícito ao layout do composer; define onde vive o ícone de emoji e o controlo de envio.

**Independent Test**: Abrir um canal de texto com permissão de escrita → na caixa de input: + à esquerda; emoji + avião à direita; digitar uma linha longa → caracteres não cobrem os ícones; clicar no avião envia (mesmo efeito do envio actual).

**Acceptance Scenarios**:

1. **Given** o composer está disponível, **When** olho para a caixa de mensagem, **Then** o controlo de **anexo (+)** está **dentro** da caixa, alinhado à **esquerda** (antes da área de texto).
2. **Given** o composer está disponível, **When** olho para a direita da caixa, **Then** vejo o **ícone de emoji** e o **ícone Enviar** (avião de papel), ambos **dentro** da caixa, sem o rótulo de texto «Enviar» como botão principal.
3. **Given** estou a digitar (incluindo texto longo), **When** o caret ou o texto se aproximam das extremidades, **Then** o texto **não** escreve por cima dos ícones (há espaço reservado / o texto fica entre anexo e o grupo direito).
4. **Given** tenho texto não vazio **ou** pelo menos um anexo pendente, **When** activo o ícone Enviar (avião), **Then** a mensagem é enviada como no fluxo actual de envio.
5. **Given** o draft está vazio **e** não há anexos pendentes, **When** vejo o ícone Enviar, **Then** está **inactivo** (não envia mensagem vazia).
6. **Given** o anexo está dentro da caixa, **When** o uso, **Then** o fluxo de anexar imagem continua a funcionar (não é só decorativo).

---

### Edge Cases

- Nome de canal só com emoji, ou emoji no início/meio/fim: permitido desde que as regras actuais de nome não-vazio / limites de comprimento (se existirem) continuem a aplicar-se de forma justa (emoji conta como parte do nome).
- Vários emoji no mesmo nome ou mensagem: permitidos.
- Atalho incompleto (ainda a escrever após `:`): mostrar lista filtrada; **não** substituir até aceitar.
- Fechar `:nome:` sem aceitar: texto permanece; sem auto-replace.
- Atalho ambíguo ou desconhecido: lista vazia ou sem match; texto fica como escrito.
- Com sugestão aberta, Enter aceita item (não envia a mensagem), alinhado ao picker de menções.
- Selector com muitos emoji: deve ser navegável (pesquisa ou categorias) o suficiente para achar um emoji comum em poucos segundos.
- Teclado / IME que já insere emoji nativo: continua a funcionar; o picker é complementar.
- Viewport estreito: ícones dentro da caixa permanecem utilizáveis (alvos clicáveis); o texto continua sem sobrepor ícones.
- Ícones desactivados (ex. sem permissão de envio, a enviar, limite de anexos, **avião sem texto nem anexos**): estado visual claro; não bloqueiam a leitura do placeholder/texto de forma ilegível.
- Fora de âmbito desta feature: packs de emoji personalizados do servidor, stickers, reacções por clique noutro sítio (salvo se já existirem e não forem tocados).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir **emoji** (caracteres emoji padrão no texto) no **título/nome** do canal, na criação e na renomeação, e MUST mostrar esses emoji onde o nome do canal é apresentado aos membros.
- **FR-002**: O sistema MUST permitir emoji no **corpo das mensagens** de chat de texto (composer → mensagem publicada → leitura no histórico).
- **FR-003**: O produto MUST disponibilizar um **controlo com ícone de emoji** que abre um **selector** para inserir emoji sem conhecer atalhos.
- **FR-004**: No composer de chat, o ícone de emoji MUST estar **dentro da caixa de mensagem** (a mesma área visual do campo «Escrever mensagem…»), alinhado à **direita**, junto ao controlo de envio.
- **FR-004a**: O selector MUST também estar disponível no fluxo de **edição/criação do nome do canal** quando o utilizador está a definir o título (posição do ícone nesse fluxo pode seguir o padrão do campo de nome, sem obrigar o mesmo layout do composer).
- **FR-005**: Escolher um emoji no selector MUST **inserir** esse emoji no campo activo (não substituir todo o conteúdo do campo).
- **FR-006**: Quando o utilizador digita um **atalho** de emoji no **composer** de chat, o sistema MUST **não** substituir automaticamente o texto pelo emoji.
- **FR-007**: Assim que o utilizador digita `:` no composer (início de atalho), o sistema MUST mostrar uma **lista filtrada** de sugestões (padrão semelhante ao picker de menções), actualizada enquanto digita.
- **FR-008**: **Enter** ou **clique** num item da lista MUST aceitar a substituição do segmento em curso; **Esc** ou dispensar sem aceitar MUST manter o texto; Enter com a lista aberta MUST NOT enviar a mensagem.
- **FR-009**: Aceitar MUST substituir apenas o segmento do atalho em curso pelo emoji correspondente.
- **FR-009a**: O reconhecimento de atalhos e a sugestão inline MUST aplicar-se **apenas ao composer** de chat; o campo de **nome do canal** MUST NOT mostrar sugestão de atalho (emoji via picker ou teclado do SO).
- **FR-009b**: Completar um atalho com o segundo `:` (`:nome:`) MUST NOT por si só substituir o texto; a substituição exige aceitação explícita (Enter/clique).
- **FR-010**: Emoji inseridos (picker ou substituição aceite) MUST permanecer legíveis nos contextos de título e chat descritos acima, em tema claro e escuro.
- **FR-011**: O controlo de **anexo (+)** MUST estar **dentro** da caixa de mensagem do composer, alinhado à **esquerda** (antes da área de texto).
- **FR-012**: O envio da mensagem no composer MUST usar um **ícone** reconhecível de **avião de papel** (estilo Telegram / «carta dobrada em avião»), **dentro** da caixa à **direita**, em vez do botão com o texto «Enviar» como controlo principal.
- **FR-013**: O ícone Enviar MUST preservar o comportamento de envio actual (submeter a mensagem / anexos pendentes conforme regras já existentes).
- **FR-013a**: O ícone Enviar MUST estar **activo** quando há texto não vazio **ou** pelo menos um anexo pendente; MUST estar **inactivo** quando o draft está vazio e não há anexos pendentes.
- **FR-014**: O texto e o caret no campo de mensagem MUST NOT sobrepor os ícones (anexo, emoji, enviar); a área digitável fica entre o grupo esquerdo e o grupo direito.
- **FR-015**: Os ícones dentro da caixa MUST ter rótulos acessíveis (ex. «Anexar imagem», «Emoji», «Enviar») para leitores de ecrã, mesmo sem texto visível «Enviar».

### Key Entities

- **Emoji (no texto)**: Caracteres emoji padrão inseridos como parte do nome do canal ou do corpo da mensagem; o utilizador vê o glifo, não um código oculto obrigatório.
- **Atalho de emoji**: Sequência de texto (ex. `:nome:`) reconhecível; substituição só via **sugestão inline** aceite pelo utilizador.
- **Selector de emoji**: UI accionada por ícone que lista emoji e permite inserção no campo activo.
- **Caixa de mensagem (composer)**: Campo onde o membro escreve; contém internamente anexo (esquerda) e emoji + enviar (direita), com texto sem sobreposição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em ≤ 2 minutos, um membro autorizado cria ou renomeia um canal com emoji no título e confirma que o emoji aparece na lista de canais.
- **SC-002**: Em ≤ 2 minutos, um membro envia uma mensagem com emoji (via picker) e vê o mesmo emoji no histórico.
- **SC-003**: Em 100% das tentativas de teste, digitar `:` / `:parcial` / `:nome:` **nunca** substitui sozinho; a lista filtrada (quando há matches) aparece sem forçar emoji.
- **SC-004**: Em testes Enter/clique vs Esc, aceitar produz emoji e dispensar mantém o texto; com lista aberta, Enter não envia a mensagem.
- **SC-005**: Um membro que não conhece atalhos consegue inserir um emoji comum só com o ícone + selector em ≤ 30 segundos.
- **SC-006**: Em revisão visual do composer, anexo está à esquerda dentro da caixa; emoji e avião de enviar à direita dentro da caixa; não existe botão de texto «Enviar» como controlo principal.
- **SC-007**: Ao digitar uma mensagem longa de teste, nenhum carácter fica visualmente por baixo/por cima dos ícones da caixa.
- **SC-008**: Com composer vazio e sem anexos, o avião está inactivo; com texto ou anexo pendente, fica activo e envia.

## Assumptions

- «Hypertext emoji» significa **emoji Unicode padrão** no texto (título e mensagem), não packs de imagem custom do servidor nesta feature.
- Atalhos: após `:` no **composer**, **lista filtrada** enquanto digita; Enter/clique aceita; Esc dispensa; fechar `:nome:` **não** auto-substitui — clarificado.
- Nome do canal: emoji via **picker** (e teclado do SO); sem fluxo de atalho/sugestão — clarificado.
- Layout do composer (amendment): ícones **dentro** da caixa de mensagem — **+** à esquerda; **emoji** + **enviar (avião)** à direita; padding/área de texto evita sobreposição — clarificado.
- Ordem à direita: emoji imediatamente à esquerda do ícone Enviar (grupo direito compacto).
- O picker cobre um conjunto **útil** de emoji comuns (não é obrigatório o catálogo Unicode completo na primeira entrega, desde que os mais usados estejam presentes e pesquisáveis ou categorizados).
- Inserção via teclado do SO (painéis nativos de emoji) continua válida e não é bloqueada.
- Regras existentes de permissão (quem pode criar/renomear canal, quem pode enviar mensagem) não mudam; só o conteúdo permitido passa a incluir emoji e o chrome do composer.
- Canais de voz: o **nome** do canal de voz também pode incluir emoji (mesmo critério de título); o «chat» desta feature refere-se ao composer de **mensagens de texto**.
- Criptografia ponta-a-ponta do corpo da mensagem (se aplicável): o emoji faz parte do texto em claro do cliente como qualquer outro carácter; não se introduz metadado obrigatório de «tipo emoji» separado do texto.
- Ícone Enviar (avião): activo com texto não vazio **ou** anexo pendente; inactivo se ambos vazios — clarificado.
- Enter no composer (sem sugestão aberta) continua a poder enviar, como hoje, além do clique no ícone avião (sujeito às mesmas regras de conteúdo válido).
