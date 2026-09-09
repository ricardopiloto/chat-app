# Feature Specification: Versão do produto (público no rodapé da marca; autenticado sob o nome)

**Feature Branch**: `076-app-version-label`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos adicionar também, nas páginas foras de área autenticada e na área autenticada a versão que estamos. Isso deve ficar pequeno, logo abaixo do nome da aplicação."

**Problem**: Utilizadores e operadores não veem facilmente **qual versão** do produto está a correr. A marca «Mesa» aparece na área pública (login/convite) e na área autenticada (barra superior), mas sem indicação de versão.

## Clarifications

### Session 2026-09-08

- Q: Onde colocar a versão na área pública? → A: No **rodapé** do painel de marca (`auth-pane-brand` / bloco de rodapé da marca), **não** imediatamente abaixo do nome «Mesa» no hero da marca
- Q: Onde colocar a versão na área autenticada? → A: Logo **abaixo do nome** na marca do TopBar

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Versão na área não autenticada (Priority: P1)

Como visitante nas páginas públicas (ex. entrada / convite), quero ver a **versão do produto** em texto **pequeno** no **rodapé do painel de marca**, para saber que build/instância estou a usar sem competir com o nome/hero.

**Why this priority**: Pedido explícito para páginas fora da área autenticada; clarificação: rodapé do painel de marca.

**Independent Test**: Abrir login (e convite) sem sessão → no rodapé do painel de marca (junto à nota de instância self-hosted) aparece a versão, pequena e legível; o nome «Mesa» no topo do painel **não** leva a versão colada por baixo.

**Acceptance Scenarios**:

1. **Given** estou na página de **entrada/autenticação** sem sessão, **When** olho para o painel de marca, **Then** vejo a versão do produto no **rodapé** desse painel, em tipografia **pequena**.
2. **Given** estou numa página pública de **convite** (mesmo chrome de marca), **When** olho o rodapé do painel de marca, **Then** a mesma regra aplica-se.
3. **Given** a versão está no rodapé, **When** comparo com o nome/logo no topo do painel, **Then** o nome continua o elemento principal da marca; a versão não aparece imediatamente abaixo do nome no bloco hero.

---

### User Story 2 - Versão na área autenticada (Priority: P1)

Como utilizador autenticado, quero ver a **mesma versão do produto** em texto **pequeno**, **logo abaixo do nome** da aplicação no chrome autenticado (junto à marca da barra superior), para confirmar a versão sem sair da app.

**Why this priority**: Pedido explícito para a área autenticada.

**Independent Test**: Com sessão iniciada, na vista principal → abaixo do nome «Mesa» na marca do topo aparece a versão, pequena.

**Acceptance Scenarios**:

1. **Given** estou autenticado na aplicação, **When** olho para a marca com o nome da aplicação no chrome superior, **Then** a versão aparece **logo abaixo** do nome, em tipografia **menor**.
2. **Given** navego entre canais/definições dentro da área autenticada (onde a marca do topo permanece), **When** a marca está visível, **Then** a versão continua visível e consistente.
3. **Given** comparo a versão na área autenticada com a da área pública, **When** ambas estão visíveis no mesmo deployment, **Then** o texto da versão é o **mesmo**.

---

### User Story 3 - Discrição e acessibilidade (Priority: P2)

Como utilizador, quero que a versão seja **discreta** mas ainda assim legível (e anunciável a tecnologias de assistência de forma sensata), para não poluir a marca.

**Why this priority**: Qualidade de UX; não bloqueia o MVP visual.

**Independent Test**: Revisão visual + verificação de que o nome da app e a versão formam um bloco compreensível.

**Acceptance Scenarios**:

1. **Given** a versão está presente, **When** olho o primeiro ecrã autenticado ou de login, **Then** a versão é claramente **secundária** (menor, não «hero»).
2. **Given** uso leitores de ecrã / o rótulo da marca, **When** o bloco da marca é anunciado, **Then** a versão não torna o nome da aplicação confuso (ex. marca continua reconhecível como Mesa).

---

### Edge Cases

- Tema claro/escuro/sistema: a versão permanece legível (contraste adequado) em ambos os temas.
- Viewport estreito / móvel: a versão no rodapé do painel de marca (público) e na marca autenticada não parte o layout nem empurrar controlos críticos de forma inaceitável.
- Páginas públicas sem o painel de marca: fora de âmbito; o requisito público cobre o chrome `AuthShell` / painel de marca.
- Definições / modos especiais: se a marca do topo permanecer, a versão autenticada permanece; se a marca for ocultada, a versão não precisa de aparecer noutro sítio neste MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Nas páginas **fora da área autenticada** que usam o painel de marca (entrada/login e convite), o produto MUST mostrar a **versão do produto** no **rodapé** desse painel de marca (bloco de rodapé / nota de instância), em tipografia **pequena**. MUST NOT colocar a versão imediatamente abaixo do nome no bloco hero da marca nessas páginas.
- **FR-002**: Na **área autenticada**, onde o chrome superior mostra o nome da aplicação como marca, o produto MUST mostrar a **versão do produto** imediatamente **abaixo** do nome, em tipografia **pequena**.
- **FR-003**: A versão MUST ser tipograficamente **pequena** / hierarquia visual secundária (face ao nome na área autenticada; face ao conteúdo do painel na área pública).
- **FR-004**: A string de versão mostrada na área pública e na autenticada MUST ser a **mesma** para o mesmo deployment (uma única «versão do produto» face ao utilizador).
- **FR-005**: A versão MUST reflectir a **versão do produto** que a instância está a servir (alinhada à versão de produto/release da app), não um identificador interno opaco (ex. hash completo de commit) como texto principal.
- **FR-006**: A presença da versão MUST NOT remover nem substituir o nome da aplicação; o nome permanece o rótulo principal da marca.

### Key Entities

- **Nome da aplicação**: marca visível «Mesa» (ou equivalente) no hero público e no chrome autenticado.
- **Versão do produto**: identificador de release legível para humanos (ex. formato semântico `X.Y.Z`); no público no rodapé do painel de marca; no autenticado **abaixo do nome** na marca do TopBar.
- **Painel de marca (público)**: coluna de marca das páginas Auth/Invite, com hero (logo/nome/tagline) e **rodapé** (nota de instância + versão).
- **Área não autenticada**: páginas públicas (entrada, convite, …) sem sessão.
- **Área autenticada**: shell da app com sessão (marca no chrome superior).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das páginas públicas de marca testadas (login + convite), um revisor vê a versão no **rodapé** do painel de marca, pequena, e **não** imediatamente abaixo do nome no hero.
- **SC-002**: Em 100% das vistas autenticadas testadas onde a marca do topo está visível, a versão aparece imediatamente abaixo do nome, menor que o nome.
- **SC-003**: No mesmo deployment, o texto de versão nas áreas pública e autenticada coincide em 100% das comparações.
- **SC-004**: Em revisão de hierarquia visual, o nome da aplicação continua dominante; a versão é secundária (confirmado por revisor).

## Assumptions

- «Versão que estamos» = **versão do produto/release** da aplicação (a mesma noção referida no changelog / alinhamento de versão do produto), não o número de build interno de cada pacote isolado quando divergem.
- Formato de apresentação: número de versão legível (ex. `0.5.0`); prefixo `v` opcional desde que consistente nas duas áreas.
- Superfície pública: rodapé do painel de marca (Auth/Invite), tipicamente junto à nota «instância self-hosted».
- Superfície autenticada: marca **TopBar**, versão logo **abaixo do nome**.
- Não é obrigatório neste MVP um clique na versão (changelog, modal «Sobre»).
