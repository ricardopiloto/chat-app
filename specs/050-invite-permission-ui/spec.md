# Feature Specification: Botão de convite respeita permissão do papel

**Feature Branch**: `050-invite-permission-ui`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Adicionei a permissão de «criar convites» a um perfil, adicionei um usuário ao perfil, porém o usuário não consegue criar convite (Não aparece o botão)."

**Depends on**: papéis e capacidades de servidor ([047-server-channel-permissions](../047-server-channel-permissions/)); fluxo de convites ([046-invite-5min-window](../046-invite-5min-window/), [019-members-invite-icons](../019-members-invite-icons/)).

**Problem**: A capacidade de papel «Criar convites» já existe na gestão de papéis e o servidor já autoriza criar/listar/revogar convites com essa capacidade, mas o botão de convite na barra lateral **só aparece para o dono do servidor**. Membros com a permissão correcta não vêem o controlo e parecem não poder convidar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Membro com «Criar convites» vê o botão (Priority: P1)

Como membro de um servidor a quem foi atribuído um papel com **Criar convites**, quero ver o botão/controlo de convite no chrome do servidor (junto ao cabeçalho da lista de canais), para poder gerar um código como o dono faria.

**Why this priority**: Bug reportado; a permissão configurável não tem efeito na UI.

**Independent Test**: Dono cria papel com «Criar convites», atribui membro B; B inicia sessão nesse servidor → botão de convite visível; B gera convite com sucesso.

**Acceptance Scenarios**:

1. **Given** sou membro (não dono) com um papel que tem «Criar convites» activo, **When** seleccionei esse servidor, **Then** vejo o controlo de convite no cabeçalho da barra lateral (ou equivalente actual do dono).
2. **Given** a mesma situação, **When** activo o controlo de convite, **Then** o fluxo de criar convite completa e obtenho um URL/código utilizável (mesmo comportamento de produto que o dono, sujeitos às regras de TTL/usos já existentes).

---

### User Story 2 - Sem permissão: sem botão (Priority: P1)

Como membro **sem** a capacidade «Criar convites» (e sem ser dono), quero **não** ver o botão de convite, para não parecer que posso convidar.

**Why this priority**: Evita regressão e UI morta para quem não pode convidar.

**Independent Test**: Membro sem o papel/permissão → botão ausente; tentativa directa de criar convite (se aplicável) continua recusada pelo servidor.

**Acceptance Scenarios**:

1. **Given** sou membro sem «Criar convites» e não sou dono, **When** olho o cabeçalho da barra lateral do servidor, **Then** o controlo de convite **não** aparece.
2. **Given** o dono do servidor, **When** olho o mesmo cabeçalho, **Then** o controlo de convite **continua** visível (dono sempre pode convidar).

---

### User Story 3 - Perda da permissão actualiza a UI (Priority: P2)

Como administrador que remove «Criar convites» de um papel (ou remove o membro do papel), quero que o membro afectado deixe de ver o botão sem precisar de truques obscuros.

**Why this priority**: Consistência após mudanças de papéis; secundário ao bug principal.

**Independent Test**: Com botão visível → dono desliga a capacidade ou remove a atribuição → após refresco dos papéis / navegação no servidor, o botão desaparece para o membro.

**Acceptance Scenarios**:

1. **Given** eu tinha «Criar convites» e via o botão, **When** o dono remove essa capacidade do meu papel (ou a minha atribuição) e a UI actualiza a lista de papéis, **Then** o botão deixa de aparecer para mim.

---

### Edge Cases

- Membro com vários papéis: se **qualquer** papel atribuído tiver «Criar convites», o botão aparece (união de capacidades).
- Dono com ou sem papéis: botão sempre disponível.
- Controlo de **gerir papéis** (engrenagem) permanece independente: esta feature **não** exige mostrar a gestão de papéis a quem só tem «Criar convites».
- Erro de API ao criar convite (rede / 403): mensagem de erro clara; não deixar o botão «fantasma» se a permissão efectiva desapareceu.
- Viewport estreita / drawer: mesma regra de visibilidade no chrome do servidor no drawer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O controlo de criar convite no chrome do servidor MUST ser visível a utilizadores autenticados que sejam **dono do servidor** **ou** tenham a capacidade efectiva «Criar convites» via pelo menos um papel atribuído nesse servidor.
- **FR-002**: O mesmo controlo MUST NOT ser visível a membros que não sejam dono e não tenham «Criar convites» efectivo.
- **FR-003**: Activar o controlo (quando visível) MUST permitir completar o fluxo de criação de convite já existente (URL/código, TTL/usos), desde que o servidor autorize a operação.
- **FR-004**: A visibilidade do botão MUST alinhar-se com a autorização efectiva de criar convites no servidor (sem «botão morto» permanente: se o utilizador vê o botão, a criação MUST ser permitida nas condições normais de sessão e servidor).
- **FR-005**: A gestão de papéis / outras acções só-dono MUST NOT passar automaticamente a ser mostrada só porque o utilizador tem «Criar convites».
- **FR-006**: Alterações de atribuição/capacidade de papéis MUST reflectir-se na visibilidade do botão quando a UI refresca os papéis do servidor (mesmo mecanismo ou equivalente ao usado para outras capacidades, ex. criar canais).

### Key Entities

- **Capacidade «Criar convites»**: permissão de papel que autoriza gerar/gerir convites no servidor.
- **Controlo de convite (chrome)**: botão/ícone no cabeçalho da barra lateral do servidor.
- **Capacidade efectiva**: união das capacidades dos papéis atribuídos ao membro (+ bypass do dono).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 verificações com membro não-dono com «Criar convites», 10/10 vezes o botão de convite está visível.
- **SC-002**: Em 10 verificações com membro sem essa capacidade (não dono), 10/10 vezes o botão **não** está visível.
- **SC-003**: Em 10 tentativas, o membro com permissão completa o fluxo de criar convite e obtém um código/URL válido em ≤ 30 segundos após clicar no botão.
- **SC-004**: Em 10 verificações, o dono continua a ver e a usar o botão de convite independentemente dos papéis.

## Assumptions

- O backend já trata «Criar convites» na criação/listagem/revogação; o gap principal é a **visibilidade do botão** (e eventual predicado FE desalinhado do dono-only).
- A união de papéis (OR) é o modelo correcto, alinhado a outras capacidades do servidor.
- Não se altera TTL, usos máximos, nem o diálogo de convite para além do necessário à autorização.
- «Gerir papéis» e «Remover membros» ficam fora do âmbito desta correcção excepto para garantir que não são acoplados ao botão de convite.

## Out of Scope

- Novas capacidades de convite (ex. convites permanentes, limites por papel).
- Redesign do diálogo de convite ou da página `/invite/:code`.
- Expor a UI completa de gestão de papéis a não-donos.
