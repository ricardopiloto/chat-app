# Feature Specification: Tela de login Mesa (estilo protótipo)

**Feature Branch**: `027-auth-login-screen`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Vamos criar a tela do login do sistema, faça ela no mesmo estilo visual da imagem que está em docs/screenshots/."

**Visual reference**: [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg) (layout e linguagem visual alvo).

**Depends on**: autenticação existente (entrar / criar conta / desbloquear chaves na sessão).

## Clarifications

### Session 2026-09-05

- Q: Como alternar Entrar ↔ Criar conta? → A: Abas **e** «ou» + botão secundário «Criar conta» (como na imagem).
- Q: Ícones nos campos e mostrar/ocultar senha no MVP? → A: Sim — afixos (@ / cadeado) + toggle mostrar/ocultar senha no MVP.
- Q: Página de convite nesta feature? → A: Incluir o mesmo chrome visual no fluxo de convite (registo/aceitação).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com o visual do protótipo (Priority: P1)

Como visitante ou utilizador com conta, quero uma tela de **Entrar** com o mesmo estilo visual da referência (painel central, marca Mesa à esquerda, formulário à direita, tema escuro, acento roxo), para a primeira impressão da instância coincidir com o protótipo Mesa.

**Why this priority**: É o pedido principal — redesenhar a experiência de login para paridade visual com o screenshot.

**Independent Test**: Abrir a rota de autenticação sem sessão → ver composição alinhada a `03-auth.jpg` (duas colunas, marca + tagline, abas, campos, botão primário Entrar); submeter credenciais válidas → entrar na app como hoje.

**Acceptance Scenarios**:

1. **Given** não estou autenticado, **When** abro a tela de autenticação, **Then** vejo um painel central em fundo escuro com **duas zonas**: marca/mensagem à esquerda e formulário à direita, no espírito de [03-auth.jpg](../../docs/screenshots/03-auth.jpg).
2. **Given** a aba **Entrar** está activa, **When** observo o formulário, **Then** vejo identificador e senha com rótulos claros, afixos (@ / cadeado), controlo de mostrar/ocultar senha, botão primário **Entrar** em destaque (acento roxo), e a marca **Mesa** com tagline coerente com a referência.
3. **Given** credenciais válidas, **When** submeto **Entrar**, **Then** a autenticação completa e avanço para a experiência autenticada (comportamento actual preservado).

---

### User Story 2 - Criar conta no mesmo layout (Priority: P1)

Como novo utilizador (primeira conta da instância ou com convite, conforme regras actuais), quero alternar para **Criar conta** no mesmo ecrã visual, sem perder a linguagem do protótipo.

**Why this priority**: A referência mostra abas Entrar / Criar conta; o produto já tem registo — deve viver no mesmo chrome.

**Independent Test**: Mudar para Criar conta → mesmo layout de duas colunas; registo válido funciona como hoje.

**Acceptance Scenarios**:

1. **Given** estou na tela de autenticação, **When** activo **Criar conta** pela **aba** ou pelo botão secundário sob «ou», **Then** o formulário passa ao modo de registo sem sair do layout de duas colunas / painel central.
2. **Given** a aba **Entrar** está activa, **When** observo as acções, **Then** vejo o botão primário **Entrar**, o separador «ou», e o botão secundário contornado **Criar conta** (como na referência).
3. **Given** o modo Criar conta, **When** completo um registo válido permitido pelas regras da instância, **Then** a conta é criada e entro na app como hoje.
4. **Given** o modo Criar conta, **When** observo a zona da marca, **Then** a marca Mesa e a mensagem de apoio permanecem visíveis (não colapsam para um cartão minimalista diferente do protótipo).

---

### User Story 3 - Clareza, erros e estados existentes (Priority: P2)

Como utilizador, quero erros e estados especiais (senha incorrecta, desbloquear chaves com sessão já aberta, recuperar identidade quando aplicável) legíveis **dentro** do novo visual, sem regressão de segurança ou fluxos.

**Why this priority**: O redesign não pode partir desbloquear E2EE / sessão / mensagens de erro.

**Independent Test**: Credenciais erradas → mensagem clara; com sessão e chaves bloqueadas → fluxo de desbloquear continua utilizável no novo chrome.

**Acceptance Scenarios**:

1. **Given** identificador ou senha incorrectos, **When** submeto, **Then** vejo uma mensagem de erro compreensível sem sair da tela.
2. **Given** já tenho sessão no servidor mas preciso da senha para as chaves locais, **When** a app pede desbloqueio, **Then** o pedido de senha aparece no mesmo sistema visual (marca + painel), sem voltar ao cartão antigo desconectado do protótipo.
3. **Given** acções secundárias existentes (entrar com outra conta, gerar novas chaves quando oferecido), **When** estão disponíveis, **Then** permanecem alcançáveis e compreensíveis no novo layout.

---

### User Story 4 - Convite com o mesmo chrome (Priority: P2)

Como convidado, quero que a página de convite use o **mesmo** visual de autenticação (marca + formulário), para a instância parecer consistente desde o primeiro clique no link.

**Why this priority**: Evita um segundo redesign; clarificado como incluído nesta feature.

**Independent Test**: Abrir `/invite/{código}` → layout de duas zonas alinhado a `/auth`; aceitar/registar conforme regras actuais.

**Acceptance Scenarios**:

1. **Given** um convite válido, **When** abro o link, **Then** vejo o chrome Mesa de duas zonas (não o cartão auth antigo isolado).
2. **Given** estou no fluxo de convite, **When** completo o registo/aceitação permitido, **Then** entro na app como hoje.

---

### Edge Cases

- Primeira conta da instância vs necessidade de convite: regras de negócio **inalteradas**; só muda a apresentação.
- Convite (`/invite/…`): MUST usar o **mesmo** sistema visual de autenticação (duas zonas / painel) no registo ou aceitação; regras de convite inalteradas.
- Tema claro da app: a referência é escura; a tela de auth MUST seguir a linguagem visual da imagem (escura / Nocturne do protótipo) neste âmbito, mesmo que outras áreas da app usem tema claro.
- «Esqueceu sua senha?» na imagem: **fora de âmbito funcional** nesta feature (não há recuperação de senha no produto); MUST NOT inventar fluxo de reset. O link pode ser omitido.
- Ecrãs estreitos: o layout de duas colunas MUST adaptar-se (empilhar ou priorizar formulário) sem tornar Entrar inutilizável.
- Campos: mostrar/ocultar senha e afixos visuais (@ / cadeado) **fazem parte do MVP** (alinhados à referência).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de autenticação (Entrar) MUST adoptar o estilo visual de [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg): fundo escuro, painel central, marca Mesa, tipografia limpa, cantos arredondados, acento roxo nos controlos activos / botão primário.
- **FR-002**: O layout MUST apresentar **duas zonas** no desktop/largura confortável: identidade (logo + tagline + nota de instância self-hosted) e formulário (abas ou equivalente Entrar / Criar conta + campos + acção primária).
- **FR-003**: O modo **Entrar** MUST permitir identificador + senha e submissão que autentica como o fluxo actual.
- **FR-004**: O modo **Criar conta** MUST permanecer disponível no mesmo ecrã e completar o registo segundo as regras actuais da instância.
- **FR-004a**: No modo **Entrar**, a UI MUST incluir abas Entrar / Criar conta **e** o padrão da referência: botão primário Entrar, separador «ou», e botão secundário contornado «Criar conta» (ambos os caminhos mudam para o modo registo).
- **FR-005**: Mensagens de erro de autenticação MUST permanecer visíveis e compreensíveis no novo layout.
- **FR-006**: Fluxos de **desbloquear chaves** / sessão existente MUST continuar a funcionar e usar o mesmo sistema visual (não regressar ao cartão pré-protótipo como experiência principal).
- **FR-007**: Esta feature MUST NOT introduzir recuperação de senha («Esqueceu sua senha?»); omitir o link da referência até existir produto para isso.
- **FR-008**: Em viewports estreitos, a autenticação MUST permanecer utilizável (layout responsivo derivado da referência).
- **FR-009**: Textos e notas de apoio (ex. identificador como @handle nesta instância; nota self-hosted sem federação) MUST reflectir o sentido da referência, adaptados à copy PT do produto se necessário.
- **FR-010**: Os campos de identificador e senha MUST incluir afixos visuais alinhados à referência (@ no identificador; cadeado na senha) e um controlo para **mostrar/ocultar** a senha.
- **FR-011**: O fluxo de convite (`/invite/…`) MUST apresentar registo/aceitação no **mesmo chrome** visual da tela de autenticação (duas zonas / painel Mesa); a lógica de convite permanece a actual.

### Key Entities

- **Auth screen**: Ecrã público de Entrar / Criar conta / desbloquear.
- **Brand pane**: Zona esquerda com marca Mesa, tagline e aviso de instância.
- **Auth form pane**: Zona direita com modos Entrar / Criar conta e campos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão lado a lado com [03-auth.jpg](../../docs/screenshots/03-auth.jpg), observadores reconhecem a mesma composição (duas colunas, marca, abas, formulário, botão roxo) em ≥80% dos critérios visuais listados no contrato de design da feature.
- **SC-002**: Um utilizador com conta existente completa **Entrar** com sucesso à primeira tentativa no caminho feliz (credenciais correctas).
- **SC-003**: Alternar Entrar ↔ Criar conta e concluir um registo permitido funciona sem passos manuais extra face ao comportamento actual.
- **SC-004**: Em viewport estreito (ex. largura típica de telemóvel), o formulário de Entrar permanece utilizável sem scroll horizontal da página.
- **SC-006**: Em Entrar, o utilizador consegue revelar e voltar a ocultar a senha via o controlo do campo; os afixos @ e cadeado estão visíveis nos campos correspondentes.
- **SC-007**: Abrir um link de convite válido mostra o chrome de auth de duas zonas (marca + formulário), reconhecível face a `/auth`.

## Assumptions

- A imagem alvo é **`docs/screenshots/03-auth.jpg`** (não os screenshots de canal de texto/voz).
- Autenticação, convites, cofre de identidade e regras «primeira conta / convite» **já existem**; esta feature é sobretudo **apresentação / UX** alinhada ao protótipo.
- «Mesmo estilo visual» = layout, hierarquia, cores e componentes da referência — não exige pixel-perfect de cada ícone.
- Tema da tela de auth segue a referência escura neste âmbito.
- Botão secundário «Criar conta» / separador «ou» da referência **fazem parte** do MVP no modo Entrar, em conjunto com as abas (não são opcionais).
- «Esqueceu sua senha?» não entra no MVP funcional.
