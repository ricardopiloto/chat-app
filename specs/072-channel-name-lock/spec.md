# Feature Specification: Nome de canal (32 / hífen) e cadeado à direita

**Feature Branch**: `072-channel-name-lock`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Canais só podem ter até 32 caracteres no nome, espaços são automaticamente trocados por -. Mude o cadeado de canais privados para ficar alinhado a direita, e ele vai servir como limite de visualização do nome do canal, o nome do canal ficará escondido por trás do cadeado (ele limita até onde o texto é visivel)." + amendment: "reduza a área do texto para não fica muito em cima do cadeado, mesmo com o fade ela ficou misturada com o cadeado. Temos que ajustar o comportamento de escrita também, atualmente nós estamos liberando um textbox com 32 caracteres para o usuário e isso está causando um scroll lateral, temos que manter sem o scroll."

**Problem**: Nomes de canal podem ficar longos ou com espaços inconvenientes na lista da barra lateral. Em canais privados, o cadeado à direita ainda deixa o **texto misturado com o ícone** (o fade sozinho não separa bem). Além disso, ao **criar/renomear** com nomes longos (até 32), o campo de edição provoca **scroll horizontal** indesejado na linha/sidebar.

## Clarifications

### Session 2026-09-08

- Q: Quando aplicar espaços→`-` e o limite de 32? → A: Enquanto escreve — espaços → `-` em tempo real; input não passa de 32 caracteres
- Q: Nomes só com hífens após normalização — são válidos? → A: Inválidos — rejeitar vazios ou compostos só por `-`
- Q: Como contar os 32 caracteres se houver emoji? → A: Contagem pela string (comprimento do campo/API); sem regra especial de grafemas
- Q: Como o nome fica «atrás» do cadeado na sidebar? → A: Texto por baixo do cadeado com **fade suave** sob o ícone; cadeado tapa o excesso (nada legível à direita)
- Q (amendment): Texto ainda misturado com o cadeado? → A: **Reduzir a área do texto** — reservar espaço claro antes/sob o cadeado para o nome **não** ficar visualmente misturado com o ícone (fade sozinho não basta)
- Q (amendment): Scroll lateral ao editar nomes longos? → A: Campos de criar/renomear MUST **não** causar scroll horizontal; o texto edita-se **dentro** da largura disponível (clip/ellipsis ou equivalente), mantendo o limite de 32 no valor
- Q: Separação nome ↔ cadeado (reserva vs corte duro vs só fade)? → A: **Reserva clara** — padding/largura útil menor para o nome **não** se misturar com o ícone; fade MAY só na faixa reservada (não corte duro antes do ícone; não só fade mais agressivo)
- Q: «Sem scroll» ao editar — contentor vs campo interno? → A: Sem scroll horizontal do **contentor** (linha/sidebar/formulário); o input **pode** deslocar o caret por dentro; layout exterior estável

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nome com no máximo 32 caracteres e espaços → hífen (Priority: P1)

Como criador ou gestor de canal, quero que o nome do canal aceite no máximo **32 caracteres** e que **espaços sejam trocados automaticamente por `-`**, para nomes curtos, legíveis e consistentes na lista.

**Why this priority**: Regras de nome afectam criar e renomear — base da feature.

**Independent Test**: Ao criar ou renomear, introduzir espaços e/ou mais de 32 caracteres → o valor efectivo usa `-` em vez de espaços e não excede 32 caracteres; o canal grava/mostra esse nome.

**Acceptance Scenarios**:

1. **Given** estou a criar ou renomear um canal, **When** escrevo um nome com espaços (ex. `sala geral`), **Then** os espaços são convertidos para `-` **enquanto escrevo** (ex. `sala-geral`).
2. **Given** tento escrever mais de 32 caracteres (já após a normalização de espaços), **When** continuo a digitar, **Then** o campo **não aceita** caracteres além de 32 (limite em tempo real).
3. **Given** um nome válido ≤ 32 e com hífens em vez de espaços, **When** o canal é criado ou renomeado com sucesso, **Then** a lista e o cabeçalho do canal reflectem esse nome.

---

### User Story 2 - Cadeado privado à direita sem misturar com o texto (Priority: P1)

Como membro a ver a lista de canais, quero que o cadeado de canal **privado** fique **alinhado à direita** e que a **área do nome seja reduzida** de modo a **não** ficar misturada com o cadeado (mesmo com fade) — o ícone marca o fim da zona legível do nome.

**Why this priority**: Pedido original de layout + amendment: fade actual ainda deixa texto «em cima» do cadeado.

**Independent Test**: Canal privado com nome longo → cadeado à direita; faixa reservada sob/antes do ícone sem glifos misturados com o cadeado; nada legível à direita do ícone.

**Acceptance Scenarios**:

1. **Given** um canal **privado** na barra lateral, **When** olho para o item, **Then** o ícone de cadeado está **alinhado à direita** da linha do canal (não imediatamente a seguir ao `#` antes do nome, como único sítio).
2. **Given** um canal privado com nome longo (até 32 caracteres), **When** a largura da sidebar limita o espaço, **Then** a área útil do nome é **mais curta** (reserva/padding sob o ícone): glifos **não** se misturam com o desenho do cadeado; fade MAY existir **só** nessa faixa reservada; **nenhum** carácter é legível **à direita** do cadeado (não é obrigatório cortar o nome *antes* da zona do ícone).
3. **Given** um canal **público**, **When** olho para o item, **Then** **não** há cadeado; o nome usa o espaço disponível da linha conforme o padrão da lista (sem o limite do cadeado).

---

### User Story 3 - Criar e renomear com a mesma regra (Priority: P2)

Como utilizador com permissão para criar ou renomear, quero as **mesmas** regras de 32 caracteres e espaços→`-` em **criar** e **renomear**, para não haver surpresas entre fluxos.

**Why this priority**: Consistência; evita nomes inválidos só num dos caminhos.

**Independent Test**: Criar com regras OK; renomear outro canal com as mesmas regras OK.

**Acceptance Scenarios**:

1. **Given** o diálogo/fluxo de **criar** canal, **When** aplico espaços e comprimento excessivo, **Then** as regras de US1 aplicam-se.
2. **Given** o fluxo de **renomear** na sidebar, **When** aplico espaços e comprimento excessivo, **Then** as mesmas regras de US1 aplicam-se.

---

### User Story 4 - Edição sem scroll lateral (Priority: P1)

Como criador ou gestor a escrever o nome do canal (criar ou renomear), quero que o campo de texto **não provoque scroll horizontal** na linha ou na barra lateral, mesmo com um nome longo até 32 caracteres, para a UI permanecer estável.

**Why this priority**: Amendment explícito; o textbox largo a 32 caracteres está a causar scroll lateral.

**Independent Test**: Renomear (e criar, se o campo estiver numa largura limitada) com um nome de 32 caracteres → **sem** barra/deslocamento horizontal; o caret e o texto permanecem dentro da largura do campo/item.

**Acceptance Scenarios**:

1. **Given** estou a **renomear** um canal na sidebar, **When** digito até 32 caracteres, **Then** a linha do canal / sidebar **não** faz scroll horizontal (o campo pode deslocar o caret internamente).
2. **Given** estou a **criar** um canal no diálogo/formulário, **When** digito até 32 caracteres num campo de largura limitada, **Then** o **contentor** do formulário **não** faz scroll horizontal (caret interno no input é permitido).
3. **Given** o valor do nome já tem 32 caracteres, **When** continuo a digitar, **Then** o limite de 32 mantém-se **e** o contentor continua sem scroll lateral.

---

### Edge Cases

- Nome só com espaços: após normalização pode ficar vazio ou só hífens — MUST ser rejeitado (FR-004), com feedback claro.
- Vários espaços seguidos → vários `-` ou colapsados: default razoável = **cada espaço vira um `-`** (sem colapsar runs), salvo se o produto já tiver normalização mais forte; documentado em Assumptions.
- Caracteres que não são espaço (tabs, NBSP): tratados como espaço para efeitos de substituição, se aparecerem na entrada.
- Canal privado em modo renomear: o cadeado permanece à direita; a área do input é reduzida como o nome (sem misturar com o cadeado) **e** sem scroll lateral.
- Canais de texto e de voz/vídeo: as regras de nome, o cadeado (se privado) e a ausência de scroll lateral aplicam-se a **ambos** os tipos na lista.
- Nomes já existentes com >32 caracteres ou espaços (legado): fora do âmbito obrigatório de migração em massa; novos edits devem cumprir as regras. Idealmente, ao abrir rename, o draft já normalizado.
- Timer de chamada em canais de voz: o nome/cadeado não devem empurrar scroll horizontal; o cadeado continua legível à direita.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O nome de um canal MUST ter no máximo **32** unidades de comprimento da **string** do nome (após normalização de espaços), na mesma métrica que o campo de edição e a API usam para medir o texto; emoji conta nessa métrica sem regra de grafema. Nos fluxos de criar/renomear, o campo MUST **impedir** entrada além de 32 **enquanto o utilizador escreve**. O `#` de prefixo na UI NÃO conta para o limite.
- **FR-002**: Espaços no nome do canal MUST ser substituídos automaticamente por o carácter `-` (hífen) **em tempo real** durante a edição (criar e renomear).
- **FR-003**: As regras FR-001 e FR-002 MUST aplicar-se tanto à **criação** como à **renomeação** de canais.
- **FR-004**: Nomes vazios após normalização, **ou** nomes compostos **apenas** pelo carácter `-` (um ou mais hífens, sem outro carácter), MUST ser rejeitados; o utilizador recebe indicação de que o nome não é válido.
- **FR-005**: Em itens de canal **privado** na barra lateral, o ícone de cadeado MUST ficar **alinhado à direita** da linha do item.
- **FR-006**: A **área útil do texto do nome** em canais privados MUST ser **reduzida** com **reserva clara** (padding / largura útil menor) sob/antes do ícone, de modo que o nome **não** se misture visualmente com o desenho do cadeado. Fade suave MAY aplicar-se **apenas** nessa faixa reservada; MUST NOT depender só de um fade mais agressivo sem reserva. Corte duro do nome *antes* da zona do ícone NÃO é obrigatório. **Nenhum** carácter MUST ser legível **à direita** do cadeado.
- **FR-007**: Canais **públicos** MUST continuar sem cadeado; o layout do nome não depende do ícone de privado.
- **FR-008**: Prefixo `#` (ou equivalente actual) MUST permanecer legível; a limitação visual do nome aplica-se à zona do **nome**, com o cadeado à direita em privados.
- **FR-009**: Os campos de **criar** e **renomear** nome MUST **não** provocar **scroll horizontal** na linha do item, no painel lateral ou no contentor do formulário quando o utilizador escreve até 32 caracteres. O próprio campo **MAY** deslocar o caret/texto **internamente**; o layout exterior MUST permanecer estável.

### Key Entities

- **Nome de canal**: string de apresentação e identidade na lista; máx. 32 caracteres; espaços normalizados para `-`.
- **Canal privado**: canal com visibilidade privada; mostra cadeado na lista.
- **Item de canal (sidebar)**: linha com prefixo, nome (e cadeado se privado); área de texto limitada para não misturar com o cadeado.
- **Campo de edição de nome**: input de criar/renomear — valor ≤32, sem scroll lateral do contentor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos fluxos de criar/renomear testados, um nome com espaços resulta em hífens e nunca fica persistido com espaços literais.
- **SC-002**: Em 100% dos fluxos testados, não é possível persistir um nome com mais de 32 caracteres.
- **SC-003**: Em viewport de sidebar típica, para um canal privado com nome de 32 caracteres, um revisor confirma que o cadeado está à direita, que há **reserva clara** sob o ícone (nome sem misturar com o desenho do cadeado; fade só nessa faixa se existir), e que nenhum carácter é legível à direita do ícone.
- **SC-004**: Canais públicos no mesmo teste não mostram cadeado e o nome continua utilizável.
- **SC-005**: Em teste de renomear (e criar) com nome de 32 caracteres, **não** ocorre scroll horizontal da **sidebar/linha/formulário** durante a digitação (deslocamento interno do caret no input é aceite).

## Assumptions

- As regras de 32 caracteres e espaços→`-` aplicam-se a **texto e voz/vídeo**.
- Substituição: cada espaço (e equivalentes de espaço na entrada) → um `-` **em tempo real**; não é obrigatório colapsar hífens repetidos neste MVP.
- Contagem de 32 é o **comprimento da string** do nome (após hífens), como o campo/API medem — emoji e outros caracteres contam nessa métrica, **sem** regra especial de «1 emoji = 1 grafema»; o limite é aplicado **enquanto escreve**.
- O prefixo `#` da UI **não** conta para os 32 (o limite é só o nome).
- Validação no cliente é suficiente para UX imediata; o servidor SHOULD também rejeitar violações se já validar nomes (evitar bypass) — detalhe de implementação no plan.
- Não é obrigatório migrar em lote nomes legados >32 ou com espaços; novos saves cumprem as regras.
- O cadeado como limite visual aplica-se à **lista da sidebar**; o título no painel do canal (`# nome`) pode mostrar o nome completo (≤32) sem o mesmo clip do cadeado.
- «Reduzir a área do texto» = **reserva clara** sob o ícone (padding/largura útil menor), não necessariamente encurtar o limite de 32 do valor persistido; fade opcional só na reserva — não corte duro obrigatório antes do ícone.
- «Sem scroll» = o **contentor** (linha/sidebar/form) não desloca horizontalmente; o input **pode** deslocar o caret internamente.
