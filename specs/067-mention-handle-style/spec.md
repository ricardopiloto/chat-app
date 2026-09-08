# Feature Specification: Destaque visual de @handle nas menções

**Feature Branch**: `067-mention-handle-style`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos fazer mais uma melhoria no mentions, vamos adicionar um background color para o @handle e deixar o handle em negrito, dessa maneira é mais visivel que há um mention ali."

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/) — menções `@handle` no texto das mensagens; opcionalmente [065-mention-autocomplete](../065-mention-autocomplete/) para inserção no composer (esta feature foca a **apresentação** do token).

**Problem**: Depois de enviada (ou ao ler o histórico), um `@handle` no corpo da mensagem mistura-se com o texto normal. Falta um tratamento tipográfico claro (fundo + negrito) para o leitor perceber de imediato que aquilo é uma **menção**, não uma palavra qualquer.

## Clarifications

### Session 2026-09-08

- Q: Quais tokens recebem fundo + negrito? → A: Qualquer token que siga o padrão de menção `@` + handle (mesmo se a pessoa já saiu); excluir emails / `@` que não seja handle de menção
- Q: Estilo quando o `@handle` sou eu? → A: Só estilizar `@handle` de **outras** pessoas; o meu próprio handle no texto fica **sem** fundo/negrito de menção (o destaque de linha 062 continua a cobrir «mensagem para mim»)
- Q: Menções estilizadas são clicáveis? → A: Sim — clique abre o perfil / painel de membros dessa pessoa quando disponível
- Q: Clique quando o membro está indisponível (ex. saiu)? → A: Continua estilizado; clique é no-op (sem navegação; sem erro obrigatório)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver @handle destacado na mensagem (Priority: P1)

Como membro a ler um canal de texto, quero que cada menção `@handle` de **outra pessoa** no corpo da mensagem apareça com **fundo colorido** e o **handle em negrito**, para identificar à primeira vista que alguém foi mencionado.

**Why this priority**: Pedido central; melhora legibilidade sem mudar o fluxo de envio/notificação.

**Independent Test**: Abrir um canal com uma mensagem que contenha `@alguem` (outra pessoa) → o token mostra fundo + negrito; se a mensagem também tiver `@eu`, esse fica plain.

**Acceptance Scenarios**:

1. **Given** uma mensagem de texto desencriptada contém um token no padrão `@handle` de **outra** pessoa, **When** vejo essa mensagem no canal, **Then** esse token aparece com **fundo** (cor de destaque) e o **handle em negrito**, claramente distinto do texto adjacente.
2. **Given** a mesma mensagem tem texto antes e depois da menção, **When** leio a linha, **Then** só o(s) token(s) de menção recebem fundo + negrito; o resto da frase não fica todo a negrito nem com o mesmo fundo.
3. **Given** tema claro ou escuro, **When** vejo uma menção destacada, **Then** o fundo e o texto do `@handle` permanecem **legíveis** (contraste adequado) sem parecer erro ou botão quebrado.

---

### User Story 2 - Várias menções na mesma mensagem (Priority: P2)

Como membro, quero que **cada** `@handle` de outra pessoa na mesma mensagem receba o mesmo tipo de destaque, para conversas com várias menções continuarem claras.

**Why this priority**: Caso comum; evita só estilizar a primeira ocorrência.

**Independent Test**: Mensagem com dois `@handle` de outras pessoas → ambos com fundo + negrito; `@eu` se presente fica plain.

**Acceptance Scenarios**:

1. **Given** uma mensagem contém dois ou mais `@handle` de outras pessoas separados por texto, **When** a vejo, **Then** **cada** um elegível tem fundo + negrito de forma independente.
2. **Given** um `@token` que **não** corresponde ao padrão de handle de menção (ex.: email `a@b.com`, ou lixo sem handle), **When** a mensagem é mostrada, **Then** esse texto **não** recebe fundo/negrito de menção.
3. **Given** o texto contém `@handle` de alguém que **já não** é membro do servidor, **When** vejo a mensagem, **Then** o token **ainda** recebe fundo + negrito (padrão de menção no texto), independentemente da membership actual.

---

### User Story 3 - O meu `@handle` vs destaque «mensagem para mim» (Priority: P2)

Como membro, quero que **`@outrasPessoas`** no texto tenham fundo + negrito, mas que **`@meuHandle`** no corpo da mensagem fique com aparência de texto normal — o sinal de que a mensagem é «para mim» continua a ser o **destaque de linha/bloco** de 062 (quando aplicável), não um estilo especial no meu próprio token.

**Why this priority**: Clarificação explícita; evita competir com o highlight pessoal 062 no mesmo token.

**Independent Test**: Mensagem que me menciona e menciona outra pessoa → só o `@outro` tem fundo + negrito; `@eu` fica plain; a linha pode ainda ter highlight 062.

**Acceptance Scenarios**:

1. **Given** uma mensagem contém `@meuHandle` (o meu handle) e o destaque pessoal 062 está activo, **When** a vejo, **Then** o token `@meuHandle` no corpo **não** recebe fundo/negrito de menção; o destaque de linha/bloco 062 pode continuar activo.
2. **Given** a mesma mensagem (ou outra) contém `@outraPessoa` no padrão de menção, **When** a vejo, **Then** `@outraPessoa` tem fundo + negrito.
3. **Given** uma mensagem só me menciona a mim (sem outros `@handle`), **When** a vejo, **Then** não há token com estilo de menção no texto; o highlight de mensagem 062 (se activo) é o indicador principal.

---

### User Story 4 - Abrir membro a partir do @handle (Priority: P2)

Como membro a ler uma mensagem, quero **clicar** num `@handle` estilizado (outra pessoa) para abrir o **perfil ou painel de membros** dessa pessoa quando estiver disponível, para identificar rapidamente quem foi mencionado.

**Why this priority**: Clarificação explícita; acrescenta acção ao destaque visual.

**Independent Test**: Clicar num `@handle` estilizado de membro conhecido → abre a UI de membro/perfil dessa pessoa; o meu `@handle` plain não é alvo desta acção.

**Acceptance Scenarios**:

1. **Given** uma mensagem mostra `@outraPessoa` estilizado e essa pessoa está disponível na UI de membros/perfil do produto, **When** clico nesse token, **Then** abro o perfil ou painel de membros centrado nessa pessoa (conforme superfície existente da app).
2. **Given** o token é o meu próprio `@handle` (texto plain), **When** interajo com o texto, **Then** **não** há acção de «abrir o meu perfil» exigida por esta feature nesse token.
3. **Given** posso usar teclado/acessibilidade básica, **When** o token é focável/activável conforme padrões da app, **Then** a mesma acção de abrir membro está disponível sem depender só de cor (quando o membro está disponível).
4. **Given** um `@handle` estilizado cuja pessoa **não** está disponível no painel/perfil, **When** clico/activo o token, **Then** nada de navegação acontece (no-op) e a app não falha; o token continua com fundo + negrito.

---

### Edge Cases

- Mensagem só com `@handle` e sem outro texto: o token continua destacado; não «estoura» o layout da bolha/linha.
- Handles longos: o fundo acompanha o token sem cortar a meio de forma ilegível; pode quebrar linha com o texto se a linha for estreita, mas o estilo mantém-se no fragmento visível.
- Texto indeterminável / falha de desencriptação: sem plaintext, não inventar destaques de menção.
- Composer enquanto se escreve: **fora do âmbito mínimo** desta feature (o pedido foca visibilidade da menção «ali» na leitura); o autocomplete 065 pode manter o seu próprio estilo de lista.
- Clique em `@handle` de pessoa **indisponível** (saiu / sem entrada no painel): token continua estilizado; activação = no-op seguro (sem navegação; sem erro obrigatório).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No corpo das mensagens de canal de texto já apresentadas ao utilizador, cada token que corresponda ao **padrão de menção** `@` + handle de **outra** pessoa (não o leitor actual) MUST ser visualmente distinto do texto normal mediante **fundo colorido** e **handle em negrito** — incluindo handles de pessoas que já não sejam membros, desde que o texto ainda mostre esse padrão.
- **FR-002**: O destaque MUST aplicar-se ao token de menção de forma localizada (não a toda a mensagem só por causa deste estilo).
- **FR-003**: Múltiplos `@handle` elegíveis na mesma mensagem MUST receber cada um o destaque (fundo + negrito).
- **FR-004**: O estilo MUST permanecer legível em tema claro e escuro.
- **FR-005**: Esta feature MUST **não** remover nem substituir o destaque pessoal de mensagem (menção/resposta «para mim») definido em 062; os comportamentos coexistem. O token `@` + **meu** handle MUST NOT receber o fundo/negrito de menção desta feature.
- **FR-006**: Esta feature MUST **não** alterar regras de *quando* uma menção notifica ou quem é elegível (062/065); é só apresentação no texto visível.
- **FR-007**: Texto que **não** corresponda ao padrão de menção `@handle` (ex.: endereços de email com `@`, fragmentos inválidos) MUST NOT receber este fundo/negrito de menção. A estilização de outros handles MUST **não** depender de membership actual nem de metadados de menção no servidor.
- **FR-009**: Um `@handle` estilizado (outra pessoa) MUST ser **activável** (clique / activação equivalente) para abrir o **perfil ou painel de membros** dessa pessoa quando essa superfície existir e a pessoa estiver **disponível**.
- **FR-010**: O token do handle do leitor actual MUST NOT ser obrigado a ser um controlo clicável de menção nesta feature.
- **FR-011**: Se o `@handle` estiver estilizado mas a pessoa **não** estiver disponível na UI de membros/perfil, o clique/activação MUST ser um **no-op** seguro (sem navegação; sem mensagem de erro obrigatória); o estilo visual MUST permanecer.

### Key Entities

- **Token de menção (`@handle`)**: sequência no texto legível da mensagem que segue o padrão `@` + handle de conta; estilizada (e clicável) para outras pessoas mesmo sem membership actual no servidor — o clique só navega quando a UI de membro estiver disponível.
- **Destaque tipográfico de menção**: fundo + negrito aplicados a `@handle` de **outras** pessoas no texto (âmbito desta feature); o handle do leitor actual fica plain.
- **Destaque pessoal de mensagem (062)**: destaque da linha/bloco quando a mensagem é relevante para mim; distinto do estilo do token.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual com ≥3 mensagens contendo `@handle` de **outras** pessoas, 100% desses tokens elegíveis mostram fundo + negrito distintos do texto adjacente em ≤1 minuto de inspecção.
- **SC-002**: Em mensagem com ≥2 menções a outras pessoas, um revisor confirma que **todas** estão estilizadas (nenhuma «esquecida»).
- **SC-003**: Em tema claro e escuro, o revisor confirma legibilidade do token (sem texto ilegível sobre o fundo) sem necessidade de ferramentas de medição de contraste formais — critério de «leitura confortável» acordado na revisão.
- **SC-004**: Mensagem que me menciona: `@meuHandle` no texto fica **sem** estilo de menção; highlight de linha 062 (se activo) continua a funcionar; zero regressão reportada no show/hide desse highlight.
- **SC-006**: Em teste com um `@handle` estilizado de membro disponível, um clique (ou activação equivalente) abre o perfil/painel de membros dessa pessoa em ≤3 s de feedback perceptível.
- **SC-007**: Em teste com `@handle` estilizado de pessoa indisponível, activação não navega nem provoca erro bloqueante; o estilo visual permanece.

## Assumptions

- Âmbito = **apresentação** do `@handle` no histórico/lista de mensagens do canal de texto; não novos tipos de notificação nem mudanças de API de produto.
- O «handle em negrito» aplica-se ao nome do handle; o `@` faz parte do token visual destacado (fundo envolve `@` + handle) para ler-se como uma unidade.
- Cor de fundo: usa a linguagem visual da app (acento / menção), com contraste adequado — sem impor uma paleta externa.
- Composer em tempo real e painéis de notificação do topbar **não** são obrigatórios para o Done desta feature; se o mesmo token aparecer noutros sítios de texto de mensagem no canal, deve seguir o mesmo estilo.
- Estilização baseada no **padrão** `@handle` no plaintext legível para **outros** handles; o handle da sessão do leitor fica plain; estilo visual não exige membership actual; clique para abrir membro exige disponibilidade na UI.
- O destaque «mensagem para mim» (062) continua a ser o sinal de relevância pessoal; esta feature não estiliza o meu próprio `@handle` no texto.
- Tokens estilizados são clicáveis para abrir perfil/painel de membros quando a pessoa está disponível; se indisponível, clique = no-op. A superfície exacta é a já usada no produto para ver um membro.
- Depende de o texto da mensagem estar legível (desencriptado); sem texto, não há estilo de menção a aplicar.
