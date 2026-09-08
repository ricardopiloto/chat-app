# Feature Specification: Cabeçalho do papel — só o nome

**Feature Branch**: `073-role-card-name-only`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Retire o texto de posição do … permission-card-heading … mantenha apenas o nome do perfil"

**Problem**: Na página de gestão de papéis (Perfis), o título de cada cartão mostra o nome do papel **junto** com metadados («posição N» e, nos de sistema, «(sistema)»), o que polui a leitura e faz o cabeçalho parecer um bloco único ilegível (ex. «Dono» + posição + sistema colados). O utilizador quer ver **apenas o nome do perfil** nesse cabeçalho.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver só o nome no cartão de papel (Priority: P1)

Como administrador na página de Perfis / papéis do servidor, quero que o cabeçalho de cada cartão mostre **somente o nome do papel**, sem texto de posição nem etiqueta «(sistema)» ao lado do nome, para identificar o perfil de imediato.

**Why this priority**: Pedido directo de limpeza visual do cabeçalho.

**Independent Test**: Abrir `/servers/:id/settings/roles` (ou rota equivalente de gestão de papéis) → cada `.permission-card-heading` contém só o nome (ex. «Dono»), sem «posição …» nem «(sistema)».

**Acceptance Scenarios**:

1. **Given** estou na lista de papéis com pelo menos um papel (ex. Dono), **When** olho para o cabeçalho do cartão, **Then** vejo **apenas** o nome do papel (ex. «Dono»).
2. **Given** um papel de sistema (ex. Dono), **When** olho para o mesmo cabeçalho, **Then** **não** aparece «posição …» nem «(sistema)» nesse heading.
3. **Given** um papel personalizado com posição numérica, **When** olho para o cabeçalho, **Then** também vejo só o nome — sem «posição N».

---

### User Story 2 - Acções do cartão intactas (Priority: P2)

Como administrador, quero continuar a reordenar (↑/↓), abrir Permissões e apagar papéis elegíveis, mesmo depois de remover o texto de posição do cabeçalho.

**Why this priority**: Evita regressão nas acções; a posição continua a existir no modelo, só deixa de ser texto no heading.

**Independent Test**: Nos cartões, botões de subir/descer (quando aplicável), Permissões e apagar continuam a funcionar; a ordem visual da lista permanece coerente com a hierarquia.

**Acceptance Scenarios**:

1. **Given** um papel reordenável, **When** uso ↑ ou ↓, **Then** a ordem na lista actualiza como antes (sem precisar de ver «posição N» no título).
2. **Given** qualquer papel, **When** clico em Permissões, **Then** abro a página/fluxo de permissões como antes.

---

### Edge Cases

- Papel com nome longo: o heading mostra só o nome; truncamento visual existente da UI, se houver, aplica-se ao nome.
- Lista vazia: mensagem de vazio inalterada.
- Outras páginas (membros, permissões do papel): fora do âmbito desta feature — só o cabeçalho `.permission-card-heading` na gestão de papéis / Perfis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No cabeçalho do cartão de papel (`.permission-card-heading` na página de gestão de papéis), o produto MUST apresentar **apenas o nome** do papel.
- **FR-002**: O texto «posição …» (ou equivalente com o número de posição) MUST **não** aparecer nesse cabeçalho.
- **FR-003**: A etiqueta «(sistema)» (ou equivalente) MUST **não** aparecer nesse cabeçalho.
- **FR-004**: Remover esses textos do cabeçalho MUST **não** remover a capacidade de reordenar papéis, abrir permissões ou apagar papéis não-sistema, quando essas acções já existem.
- **FR-005**: A hierarquia/posição dos papéis MUST continuar a existir no produto (modelo e reordenação); apenas a **exibição** no heading é removida.

### Key Entities

- **Papel / perfil**: entidade com nome, posição (hierarquia) e flag de sistema; o cartão lista um papel.
- **Cabeçalho do cartão**: zona de título do item na lista de papéis — passa a ser só o nome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual da página de Perfis, 100% dos cartões de papel mostram no heading **somente** o nome (0 ocorrências de «posição» ou «(sistema)» dentro de `.permission-card-heading`).
- **SC-002**: Um administrador consegue reordenar um papel elegível e abrir Permissões sem passos extra após a mudança.
- **SC-003**: Papéis de sistema e personalizados cumprem SC-001 da mesma forma.

## Assumptions

- Âmbito = página de **gestão de papéis / Perfis** (lista com `permission-card`), não a página detalhada de toggles de permissões nem a lista de membros.
- «Apenas o nome» inclui remover **posição** e **(sistema)** do heading (ambos poluem o título no DOM actual).
- Controlo de papéis de sistema (não apagar / não editar caps) mantém-se via botões e fluxos existentes, não via texto no heading.
- Não é necessário mostrar a posição noutro sítio nesta feature (pode ficar só implícita na ordem da lista + setas).
