# Feature Specification: Painel de Notificações visível sobre o topbar

**Feature Branch**: `066-topbar-notif-panel`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Ao clicar no botão Notificações do topbar, a lista não expande correctamente — fica escondida atrás do header topbar."

**Depends on**: Chrome de notificações no topbar (menções/respostas) entregue em [062-message-mentions-replies](../062-message-mentions-replies/).

**Problem**: O botão **Notificações** no topo da app abre (ou tenta abrir) a lista de notificações, mas o painel fica **oculto / cortado atrás** da barra superior (topbar). O utilizador não consegue ler nem escolher itens de menção/resposta, o que anula o valor do centro de notificações.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a lista ao abrir Notificações (Priority: P1)

Como utilizador autenticado, quero clicar no botão **Notificações** do topbar e ver o painel/lista **completamente visível** por cima do resto da interface (incluindo a própria barra do topbar), para poder ler menções e respostas.

**Why this priority**: Sem o painel visível, o fluxo de notificações 062 está inutilizável na UI.

**Independent Test**: Com sessão iniciada, clicar no botão com aria-label «Notificações» → o painel aparece por baixo (ou junto) do botão e **nenhuma parte relevante da lista fica tapada** pela barra do topbar; o conteúdo do painel é legível.

**Acceptance Scenarios**:

1. **Given** estou autenticado na app e o topbar está visível, **When** clico no botão **Notificações**, **Then** o painel de notificações fica **visível** na área de trabalho (não escondido atrás da barra do topbar).
2. **Given** o painel está aberto e há pelo menos um item (ou o estado vazio), **When** olho para o ecrã, **Then** consigo ler o título/secção e o texto dos itens (ou a mensagem de vazio) sem que a barra superior os cubra.
3. **Given** o painel está aberto, **When** clico de novo no botão (ou fora, se essa for a regra actual de fecho), **Then** o painel fecha e o topbar continua utilizável.

---

### User Story 2 - Interagir com itens sem obstáculo (Priority: P1)

Como utilizador com notificações, quero seleccionar um item da lista aberta sem que o painel esteja sob o topbar, para navegar até à mensagem/canal como já definido em 062.

**Why this priority**: Visibilidade sem clique útil ainda falha o objectivo.

**Independent Test**: Com ≥1 notificação, abrir painel → clicar num item → a acção de navegação 062 ocorre (canal/mensagem ou aviso de indisponível).

**Acceptance Scenarios**:

1. **Given** o painel está aberto com pelo menos um item clicável, **When** clico nesse item, **Then** o clique chega ao item (não é interceptado/oculto pelo topbar) e o comportamento de seguir a notificação mantém-se o de 062.
2. **Given** só há estado vazio («sem novidades» ou equivalente), **When** o painel está aberto, **Then** essa mensagem também está totalmente visível.

---

### User Story 3 - Sem regressão no resto do topbar (Priority: P2)

Como utilizador, quero que corrigir o painel de notificações **não** parta outros controlos do topbar (tema, identidade da instância, etc.) nem deixe o painel a tapar permanentemente a UI depois de fechado.

**Why this priority**: Evita trocar um bug por outro no chrome.

**Independent Test**: Abrir/fechar Notificações várias vezes; usar outro controlo do topbar; o painel não fica «fantasma» por cima do conteúdo.

**Acceptance Scenarios**:

1. **Given** fechei o painel de notificações, **When** continuo a usar a app, **Then** nenhum overlay de notificações permanece a bloquear cliques na área principal.
2. **Given** o painel está aberto, **When** a janela é estreita (viewport móvel ou estreito), **Then** o painel continua utilizável (visível e com scroll interno se a lista for longa), sem ficar preso atrás do topbar.

---

### Edge Cases

- Lista longa: o painel pode ter scroll interno; o cabeçalho do painel e os primeiros itens MUST permanecer acessíveis visualmente (não só o fundo do painel por baixo do topbar).
- Tema claro e escuro: contraste do painel mantém-se legível sobre o fundo da app.
- Indicador de novidade (ponto/badge) no botão: continua a funcionar; abrir/fechar não depende desse indicador.
- Vários cliques rápidos no botão: estado aberto/fechado permanece coerente; sem painel duplicado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao activar o botão **Notificações** do topbar, o produto MUST apresentar o painel de notificações de forma **visível ao utilizador**, sem que a barra do topbar o oculte.
- **FR-002**: O conteúdo do painel (itens, secções, estado vazio) MUST ser legível e clicável enquanto o painel estiver aberto.
- **FR-003**: Fechar o painel MUST remover a superfície de notificações da vista interactiva (sem overlay residual).
- **FR-004**: O comportamento semântico das notificações (tipos, navegação ao canal/mensagem, marcar como visto) MUST permanecer o definido em 062 — esta feature corrige **apresentação/empilhamento visual**, não o modelo de notificações.
- **FR-005**: Em viewports estreitos, o painel MUST permanecer utilizável (visível e, se necessário, com scroll interno), sem ficar escondido atrás do topbar.
- **FR-006**: Outros controlos do topbar MUST continuar operacionais após abrir/fechar Notificações.

### Key Entities

- **Botão Notificações**: controlo do topbar que abre/fecha o painel (rótulo acessível «Notificações»).
- **Painel de notificações**: superfície flutuante com lista de menções/respostas (e estado vazio).
- **Topbar**: barra superior da app que hoje cobre incorrectamente o painel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual ≤1 minuto após clicar em Notificações, um revisor confirma que o painel está **por completo** (ou a área útil de lista) **à frente** do topbar — zero casos em que só se vê o botão e a lista «desaparece» atrás da barra.
- **SC-002**: Em 100% dos testes com ≥1 item, o clique no item regista-se no item (navegação ou feedback 062), não é engolido pelo topbar.
- **SC-003**: Após fechar o painel, 100% dos testes confirmam que a área principal da app recebe cliques normalmente (sem painel fantasma).
- **SC-004**: Em tema claro e escuro, o painel aberto continua legível (SC-001 mantém-se).

## Assumptions

- O botão e o painel já existem (062); o defeito é de **empilhamento / recorte / posicionamento** da superfície aberta relativamente ao topbar, não a ausência da funcionalidade de notificações.
- Não se pede redesenho completo do topbar nem novos tipos de notificação.
- O padrão de abrir/fechar (toggle no botão, fechar ao clicar fora) mantém-se salvo se for necessário um ajuste mínimo para o painel ficar visível.
- «Expandir correctamente» = o utilizador vê e usa a lista; não exige animação específica.
