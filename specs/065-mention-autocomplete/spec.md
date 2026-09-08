# Feature Specification: Autocomplete de menções @ no composer

**Feature Branch**: `065-mention-autocomplete`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Baseado no que foi feito na spec 062-message-mentions-replies, no teste para tentar marcar outro usuário, não funcionou. No campo de mensagem, ao digitar o @ o campo deve dar a opção do usuário selecionar quem de uma lista de membros do servidor, ou, conforme o usuário digita ele vai dando sugestões fazendo uma pesquisa com o que está sendo digitado (filtro dinâmico)."

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/) — envio de menções via `@handle`, resolução para notificações e destaque; canais de texto com composer.

**Problem**: Em 062, mencionar alguém exige digitar o `@handle` exacto de memória — e em teste **digitar `@usuário` no chat não produz efeito** (sem menção efectiva: sem notificação / sem destaque esperados). Falta um **selector / sugestões** no composer ao digitar `@`, com lista de membros com acesso ao canal (sem o próprio) e filtro dinâmico; **e** o fluxo de menção MUST voltar a funcionar de ponta a ponta quando o `@handle` é válido (digitado à mão ou escolhido na lista).

## Clarifications

### Session 2026-09-08

- Q: Âmbito do «@ não faz nada» → A: Picker + corrigir/garantir o fluxo de menção (digitar ou seleccionar `@handle` válido deve notificar/destacar)
- Q: Quem aparece na lista (canal privado) → A: Só membros com acesso de visualização ao canal actual
- Q: Incluir-me a mim na lista? → A: Excluir-me da lista

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir lista ao digitar @ (Priority: P1)

Como membro a escrever num canal de texto, quero que ao digitar `@` no campo de mensagem apareça uma lista de membros que **podem ver este canal**, para eu escolher quem mencionar, sem precisar de lembrar o handle de cabeça.

**Why this priority**: Corrige a falha observada no teste de 062; é o caminho mínimo para menções usáveis.

**Independent Test**: Abrir canal de texto → focar o composer → digitar `@` → aparece lista com outros membros com acesso ao canal (sem eu); escolher um → o texto no composer passa a incluir `@handle` correcto.

**Acceptance Scenarios**:

1. **Given** estou no composer de um canal de texto com sessão autenticada e o canal tem outros membros com acesso de visualização, **When** digito `@` (início de menção), **Then** vejo uma lista/sugestões desses membros (**sem** me incluir a mim) e não de pessoas sem acesso ao canal.
2. **Given** a lista está aberta, **When** escolho um membro, **Then** o composer fica com `@` + handle desse membro inserido (ou substituindo o fragmento incompleto) e a lista fecha.
3. **Given** a lista está aberta, **When** cancelo (Escape ou clique fora, conforme padrão da app), **Then** a lista fecha e o texto que já escrevi no composer permanece (incluindo o `@` se ainda lá estiver), sem enviar a mensagem.
4. **Given** envio a mensagem após escolher um membro via lista, **When** a menção é processada, **Then** o destinatário elegível recebe notificação de menção e o destaque pessoal 062 aplica-se como esperado.

---

### User Story 1b - Menção @handle volta a funcionar (Priority: P1)

Como membro, quero que ao enviar uma mensagem com `@handle` válido de outro membro (escrito à mão **ou** inserido pelo picker), a menção **faça efeito** — notificação e destaque — em vez de «não fazer nada».

**Why this priority**: Clarificação explícita: o pipeline 062 está silencioso no teste actual; só o picker não basta.

**Independent Test**: Com handles conhecidos e ≥2 membros, enviar `@outro` (sem depender do picker) → o outro vê notificação de menção; repetir via picker → mesmo resultado.

**Acceptance Scenarios**:

1. **Given** B é membro do servidor com handle conhecido e elegível para menção, **When** envio uma mensagem cujo texto inclui `@` + handle exacto de B (digitado sem picker), **Then** B recebe notificação de menção e a mensagem é destacável para B como em 062.
2. **Given** o mesmo cenário, **When** uso o picker para inserir `@` + handle de B e envio, **Then** o resultado para B é o mesmo (notificação + destaque).
3. **Given** digito `@` + texto que não corresponde a nenhum membro, **When** envio, **Then** a mensagem envia-se sem crash e **não** cria notificação fantasma (062).

---

### User Story 2 - Filtrar sugestões enquanto digito (Priority: P1)

Como membro, quero que depois de `@` as sugestões se restrinjam ao que estou a escrever (filtro dinâmico), para encontrar rapidamente a pessoa certa em servidores com muitos membros.

**Why this priority**: Pedido explícito; lista completa sozinha não escala.

**Independent Test**: Digitar `@` → ver lista ampla → continuar a digitar letras do handle → a lista reduz-se aos que correspondem; apagar caracteres → a lista alarga de novo.

**Acceptance Scenarios**:

1. **Given** digitei `@` e a lista está visível, **When** digito caracteres a seguir ao `@`, **Then** as sugestões mostram só membros cujo handle (e nome visível, se existir) corresponde ao filtro (correspondência parcial, sem distinção de maiúsculas/minúsculas).
2. **Given** o filtro não corresponde a nenhum membro, **When** continuo a ver o picker, **Then** vejo estado vazio claro (sem sugestões falsas) e posso continuar a editar ou cancelar.
3. **Given** estou a filtrar, **When** escolho um item da lista filtrada, **Then** o `@handle` completo do seleccionado substitui o fragmento `@…` incompleto no composer.

---

### User Story 3 - Teclado e vários @ na mesma mensagem (Priority: P2)

Como membro que prefere teclado, quero navegar nas sugestões sem rato e poder mencionar mais do que uma pessoa na mesma mensagem.

**Why this priority**: Completa o fluxo de composer; não bloqueia o MVP de lista+filtro com rato/toque.

**Independent Test**: Com picker aberto, setas sobem/descem destaque; Enter confirma; noutro sítio do texto, novo `@` abre de novo o picker.

**Acceptance Scenarios**:

1. **Given** o picker está aberto com ≥2 sugestões, **When** uso setas para cima/baixo e confirmo com Enter (ou equivalente), **Then** o membro destacado é inserido como em US1.
2. **Given** já inseri uma menção e continuo a escrever, **When** digito um novo `@` noutro ponto do texto, **Then** o picker pode abrir de novo para uma segunda menção.
3. **Given** o cursor não está num contexto de menção (sem `@` activo), **When** escrevo texto normal, **Then** o picker **não** aparece.

---

### Edge Cases

- Servidor / canal só com o próprio utilizador: ao digitar `@`, lista vazia (eu estou excluído); envio sem notificação fantasma (062).
- Handle com underscore / números: filtro e inserção respeitam o formato de handle já usado no produto.
- Mensagem longa / cursor no meio: o picker aplica-se ao `@` **activo** junto ao cursor, não a menções já fechadas noutro sítio do texto.
- Canal privado: a lista mostra **apenas** membros com acesso de visualização a esse canal (não todos os do servidor sem acesso); **exclui** o autor da mensagem.
- Toque em telemóvel: lista utilizável (tocar para seleccionar); teclado virtual não deve impedir ver/seleccionar sugestões.
- Fechar o canal / mudar de canal: o picker fecha; sem estado órfão.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No composer de canal de texto, ao iniciar uma menção com `@`, o produto MUST apresentar sugestões de membros com **acesso de visualização ao canal actual** (não membros do servidor sem acesso a esse canal), **excluindo** o próprio utilizador.
- **FR-002**: Enquanto o utilizador digita após o `@`, as sugestões MUST actualizar-se com **filtro dinâmico** sobre o texto parcial (pelo menos pelo handle; também por nome de apresentação se o produto o tiver).
- **FR-003**: Ao seleccionar uma sugestão, o produto MUST inserir/substituir no composer o `@handle` completo desse membro e fechar as sugestões.
- **FR-004**: O utilizador MUST poder fechar as sugestões sem enviar a mensagem (cancelar o picker).
- **FR-005**: O produto MUST garantir que uma menção `@handle` **válida** (outro membro elegível com acesso ao canal), quer digitada à mão quer inserida pelo picker, **produz efeito** de menção conforme [062](../062-message-mentions-replies/) (metadados, notificação ao destinatário, sem auto-menção, sem notificação fantasma). Isto inclui corrigir o estado actual em que digitar `@usuário` «não faz nada».
- **FR-005a**: O fluxo de envio MUST usar a mesma resolução de membros elegíveis que alimenta o picker (roster com acesso ao canal, disponível no momento do envio), para `@handle` válido não falhar em silêncio por falta de dados de membros.
- **FR-005b**: Digitar `@` + o próprio handle (sem estar na lista) MUST continuar a **não** gerar notificação de auto-menção (062).
- **FR-006**: O picker MUST abrir apenas no contexto de uma menção activa junto ao cursor (não a cada tecla arbitrária).
- **FR-007**: O produto MUST permitir mais do que uma menção na mesma mensagem (novo `@` após uma menção concluída).
- **FR-008**: Com o picker aberto, o produto SHOULD permitir navegar e confirmar sugestões por teclado (além de rato/toque).
- **FR-009**: Com zero resultados de filtro, o produto MUST mostrar um estado vazio compreensível (não uma lista enganosa).

### Key Entities

- **Menção activa**: fragmento no composer desde um `@` até ao cursor (ou até espaço/fim), que dispara o picker.
- **Sugestão de membro**: entrada seleccionável (handle e, se existir, nome/avatar) de um membro com acesso de visualização ao canal actual.
- **Filtro de menção**: texto parcial após `@` usado para restringir sugestões.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com ≥3 membros no servidor, um revisor que **não** sabe o handle de memória consegue mencionar outro membro em ≤30 segundos só com `@` + lista/filtro + envio.
- **SC-002**: Em 100% dos casos de teste com filtro correspondente a um único membro, seleccionar essa sugestão produz o `@handle` correcto no texto antes de enviar.
- **SC-003**: Após `@handle` válido (digitado **ou** via picker) e envio, o destinatário elegível recebe notificação de menção em 100% dos casos de teste positivos; zero regressão nos critérios 062 de menção válida.
- **SC-003a**: Reproduzir o caso «digitar `@usuário` válido e enviar» deixa de ser silencioso: em 100% dos testes com handle correcto de outro membro, há notificação (e destaque pessoal 062 quando aplicável).
- **SC-004**: Com filtro sem matches, 100% dos testes mostram estado vazio (não crash, não envio automático).
- **SC-005**: Digitar texto sem `@` (ou fora de menção activa) não abre o picker em 100% dos casos de teste.

## Assumptions

- O problema reportado inclui **dois** falhanços: (1) falta de UI de descoberta no composer; (2) menção por `@handle` actualmente **sem efeito** no teste — esta feature MUST corrigir ambos.
- A lista de candidatos é a dos membros com **acesso de visualização ao canal actual**, **sem** o próprio utilizador, filtrada localmente no cliente à medida que se digita.
- Inserir `@handle` via picker usa o mesmo formato que o utilizador digitaria à mão; a resolução no envio MUST funcionar nos dois caminhos.
- Não se exige nesta feature um novo tipo de notificação nem alterar replies.
- Teclado (setas/Enter/Escape) é desejável (FR-008) mas a selecção por rato/toque cobre o MVP de US1–US2.
