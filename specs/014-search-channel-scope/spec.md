# Feature Specification: Pesquisa por canal e atalho Ctrl+F

**Feature Branch**: `014-search-channel-scope`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos melhorar a pesquisa, se o usuário entrar com ctrl+f para pesquisa ou digitar #nome-do-canal <pesquisa>, nós vamos pesquisar no canal informado (de texto somente), se ele pesquisar sem informar o canal, nós vamos pesquisar em todos os canais de texto."

**Depends on**: [013-topbar-scene-ux](../013-topbar-scene-ux/) (pesquisa inline na topbar já existente).

## Clarifications

### Session 2026-09-04

- Q: Ctrl+F deve pré-preencher o canal actual? → A: Em canal de texto: pré-preenche `#nome ` (nome do canal actual + espaço).
- Q: Se o campo já tem texto, o atalho substitui? → A: Sempre substituir pelo `#nome ` do canal de texto actual (e focar no fim).
- Q: Como distinguir canal inexistente vs. zero resultados? → A: Mensagens distintas («Canal não encontrado» vs «Sem resultados»).
- Q: Se `#nome` só existe como canal de voz? → A: Mensagem própria («Só canais de texto» / não pesquisável), distinta de «Canal não encontrado».
- Q: O placeholder do campo deve explicar a sintaxe `#`? → A: Placeholder/hint obrigatório com `#canal termo` (e pesquisa global).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir pesquisa com Ctrl+F (Priority: P1)

Como membro autenticado no shell, quero pressionar **Ctrl+F** (ou o equivalente no meu sistema, ex. Cmd+F no macOS) para **abrir/focar o campo de pesquisa** da aplicação, em vez de (ou em prioridade sobre) a pesquisa nativa do browser na página.

**Why this priority**: Atalho universal esperado; torna a pesquisa descoberta e rápida sem clicar no ícone.

**Independent Test**: Com o shell autenticado focado, pressionar Ctrl+F → o campo de pesquisa da Mesa expande/recebe foco; digitar texto dispara a pesquisa da aplicação.

**Acceptance Scenarios**:

1. **Given** estou no shell autenticado a ver um **canal de texto**, **When** pressiono Ctrl+F (Windows/Linux) ou Cmd+F (macOS), **Then** o campo de pesquisa da topbar fica activo e **pré-preenchido** com `#<nome-do-canal-actual> ` (nome + espaço), pronto para o termo.
2. **Given** estou no shell autenticado **sem** estar num canal de texto (ex. voz, ou nenhum canal), **When** pressiono o atalho, **Then** o campo abre/foca **sem** pré-preenchimento de `#`.
3. **Given** o campo de pesquisa já tem texto (aberto ou não), **When** pressiono o atalho estando num canal de texto, **Then** o conteúdo é **substituído** por `#<nome-do-canal-actual> ` e o foco fica no fim, pronto para o termo.
4. **Given** estou a escrever noutro campo (ex. composer) num canal de texto, **When** uso o atalho, **Then** o foco passa para a pesquisa da Mesa com o pré-preenchimento `#nome ` (substituindo qualquer valor anterior no campo).

---

### User Story 2 - Pesquisar só num canal com `#nome` (Priority: P1)

Como membro, quero digitar **`#nome-do-canal` seguido do texto a procurar** no campo de pesquisa para restringir a busca a **esse canal de texto** (entre os que tenho acesso), em vez de varrer todos os canais.

**Why this priority**: Pedido explícito; reduz ruído e tempo quando se sabe o canal.

**Independent Test**: Digitar `#geral palavra` → resultados só desse canal de texto; canais de voz ignorados; canal inexistente → estado vazio claro.

**Acceptance Scenarios**:

1. **Given** tenho acesso a um canal de texto chamado `geral`, **When** digito `#geral hello` (após o mínimo de caracteres de pesquisa no termo), **Then** vejo apenas resultados desse canal cujo conteúdo corresponde a `hello`.
2. **Given** digito `#nome-inexistente termo`, **When** a pesquisa corre, **Then** não obtenho resultados de outros canais e vejo a mensagem **«Canal não encontrado»** (ou equivalente claro), não a mensagem genérica de «Sem resultados».
3. **Given** digito `#geral termo` e o canal `geral` existe mas não há matches, **When** a pesquisa termina, **Then** vejo **«Sem resultados»** (ou equivalente) distinto de «Canal não encontrado».
4. **Given** o prefixo `#nome` corresponde **apenas** a canal(is) de voz/vídeo (nenhum de texto com esse nome), **When** a pesquisa corre com termo válido, **Then** vejo mensagem própria do tipo **«Só canais de texto»** / não pesquisável (não misturar com «Canal não encontrado» nem devolver hits).
5. **Given** vários servidores com o mesmo nome de canal, **When** uso `#nome termo`, **Then** a pesquisa limita-se aos canais de texto com esse nome a que tenho acesso (pode haver matches em mais do que um servidor, todos com esse nome).

---

### User Story 3 - Pesquisa global em todos os canais de texto (Priority: P1)

Como membro, quero pesquisar **sem** indicar `#canal` e obter resultados em **todos os canais de texto** a que tenho acesso (comportamento alargado/clarificado da pesquisa actual).

**Why this priority**: Pedido explícito; é o modo por omissão e deve permanecer fiável.

**Independent Test**: Digitar só `palavra` (≥ mínimo) → resultados em múltiplos canais de texto acessíveis; zero resultados de canais de voz ou de servidores sem acesso.

**Acceptance Scenarios**:

1. **Given** digito um termo sem `#`, **When** a pesquisa corre, **Then** o âmbito é todos os canais de **texto** dos servidores de que sou membro.
2. **Given** um termo só existe num canal a que não tenho acesso, **When** pesquiso sem `#`, **Then** esse conteúdo não aparece.
3. **Given** menos caracteres do que o mínimo no termo de busca (ignorando o prefixo `#canal` se presente), **When** digito, **Then** não dispara pesquisa completa (evita ruído).

---

### Edge Cases

- Atalho: em campos onde o utilizador espera Ctrl+F do browser (raro no shell) — no shell autenticado a Mesa captura o atalho; fora do shell (ex. ecrã de login) o browser pode manter o comportamento nativo.
- Sintaxe: `#canal` sem termo de busca — não pesquisa ainda (ou mostra hint); precisa de termo ≥ mínimo após o nome.
- Estados vazios com `#`: «Canal não encontrado» ≠ «Sem resultados» ≠ «Só canais de texto» (nome só em voz/vídeo).
- Nome com espaços: o token do canal é a primeira palavra após `#` até ao próximo espaço; o resto é o termo (`#meu-canal frase completa`).
- Correspondência de nome: case-insensitive; preferência por nome exacto do canal; se nenhum exacto, sem fuzzy agressivo nesta entrega (mensagem clara).
- Caracteres especiais no nome: tratados como literais no segmento após `#`.
- Pesquisa em curso: mudar de modo global ↔ `#canal` cancela/reinicia a geração anterior (sem misturar resultados).
- Escape continua a recolher o campo expandido (comportamento 013).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No shell autenticado, Ctrl+F (Windows/Linux) e Cmd+F (macOS) MUST abrir ou focar o campo de pesquisa da aplicação.
- **FR-002**: O atalho MUST NÃO depender de clicar primeiro no ícone de pesquisa; o campo fica pronto a receber texto.
- **FR-003**: Uma consulta no formato `#<nome-do-canal> <termo>` MUST restringir a pesquisa ao(s) canal(is) de **texto** acessíveis cujo nome corresponde a `<nome-do-canal>` (case-insensitive).
- **FR-004**: Uma consulta **sem** prefixo `#<canal>` MUST pesquisar em **todos** os canais de texto acessíveis ao utilizador.
- **FR-005**: Canais de voz/vídeo MUST NOT ser incluídos no âmbito de pesquisa de mensagens; um `#nome` que só resolve para voz MUST NÃO pesquisar mensagens noutros canais de texto.
- **FR-006**: A pesquisa MUST manter o controlo de acesso existente: nunca devolver conteúdo de servidores/canais aos quais o utilizador não pertence.
- **FR-007**: Se o `#nome` não corresponder a nenhum canal acessível (nem texto nem voz), a UI MUST mostrar **«Canal não encontrado»** (ou equivalente) e MUST NOT devolver hits de outros canais. Se existir canal de texto mas o termo não tiver matches, MUST mostrar **«Sem resultados»** (ou equivalente), distinto. Se o nome corresponder **apenas** a canal(is) de voz/vídeo, MUST mostrar mensagem própria (**«Só canais de texto»** / não pesquisável, ou equivalente), distinta das duas anteriores.
- **FR-008**: O mínimo de caracteres e o debounce da pesquisa existente MUST aplicar-se ao **termo** de busca (não ao prefixo `#canal` sozinho).
- **FR-009**: Esta feature MUST NOT exigir novos endpoints de backend; reutiliza a pesquisa client-side e endpoints de listagem/mensagens já existentes.
- **FR-010**: Se o utilizador estiver a ver um **canal de texto**, o atalho MUST **substituir** o conteúdo do campo por `#<nome-do-canal> ` (nome exacto do canal actual + espaço) e focar no fim. Se **não** estiver num canal de texto, o atalho MUST apenas abrir/focar o campo **sem** injectar `#` (não aplica a regra de substituição por prefixo).
- **FR-011**: O campo de pesquisa MUST expor um **placeholder ou hint visível** que mencione pesquisa em todos os canais de texto e a sintaxe `#canal termo` para restringir o âmbito.

### Out of Scope

- Pesquisa em canais de voz/vídeo ou metadados de cena.
- Autocomplete rico de canais ao digitar `#` (selector visual elaborado fica fora); **placeholder/hint textual** com a sintaxe é obrigatório (FR-011).
- Sintaxe avançada adicional (`from:`, `before:`, regex).
- Substituir a pesquisa nativa do browser fora do shell autenticado.
- Índice full-text no servidor.

### Key Entities

- **Consulta de pesquisa**: texto do campo; pode incluir prefixo opcional `#canal` + termo.
- **Âmbito**: `global-texto` | `canal(is)-nomeados` (texto, acessíveis).
- **Resultado**: referência a mensagem + canal + servidor (como hoje), apenas dentro do âmbito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em **100%** das tentativas de amostra no shell autenticado, Ctrl+F/Cmd+F activa o campo de pesquisa da Mesa em ≤1 s.
- **SC-002**: Em teste com consultas `#canal-existente termo`, **100%** dos resultados visíveis pertencem a canais de texto com esse nome (e acesso do utilizador).
- **SC-003**: Em teste com consultas sem `#`, resultados podem abranger múltiplos canais de texto; **0** resultados de canais de voz ou de servidores sem membership.
- **SC-004**: Em teste com 5 utilizadores, **≥4** conseguem restringir a pesquisa a um canal usando a sintaxe `#nome` sem instruções longas (hint curto no placeholder basta).
- **SC-005**: Canal `#inexistente` mostra «Canal não encontrado» e **0** hits de outros canais; canal de texto sem matches mostra «Sem resultados»; `#nome` só em voz mostra «Só canais de texto» (ou equivalente), nunca hits globais.

## Assumptions

- A pesquisa inline da 013 permanece a superfície de digitação; esta feature acrescenta atalho e sintaxe de âmbito.
- Ctrl+F/Cmd+F com canal de texto activo **substitui** o campo por `#nome `; noutros contextos só abre/foca sem injectar `#`.
- O separador entre nome do canal e termo é espaço em branco; o nome do canal não contém espaços nesta convenção (nomes com espaços ficam fora / usam hífen como hoje na app).
- Múltiplos canais com o mesmo nome em servidores diferentes: todos os matches de nome entram no âmbito (não se força um único servidor nesta entrega).
- Cmd+F no macOS é o equivalente esperado a Ctrl+F.
- Comportamento de decifra client-side e mínimo de caracteres (~2 no termo) mantém-se em espírito.
- Placeholder exemplo (copy livre desde que cubra ambos): «Pesquisar… ou #canal termo».
