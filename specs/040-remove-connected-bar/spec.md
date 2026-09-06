# Feature Specification: Remover barra «ainda na chamada»; controlos só no PiP

**Feature Branch**: `040-remove-connected-bar`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "remova a barra de … voice-connected-bar … mantenha apenas o «voltar a mesa» do PiP, e adicione ao PiP a opção de «Sair», mas faça apenas o ícone vermelho de telefone."

**Depends on**: miniatura flutuante da chamada ([038-floating-voice-pip](../038-floating-voice-pip/)); sessão de voz persistente ([028-voice-call-roster](../028-voice-call-roster/)).

## Clarifications

### Session 2026-09-06

- Q: Fora da mesa, o PiP deve incluir mic/câmera além de Voltar + hangup? → A: Não — só «Voltar à mesa» + ícone vermelho de sair; mic/câmera ficam na mesa (Option A).
- Q: Após Sair no PiP, para onde vai a navegação? → A: Permanecer na vista actual (Option A); o PiP desaparece e a chamada termina.
- Q: Onde fica o ícone vermelho de sair no PiP? → A: Rodapé do PiP na mesma fila que «Voltar à mesa» (texto à esquerda, ícone à direita) (Option A).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sem barra inferior ao navegar para texto (Priority: P1)

Como participante numa chamada que abriu um canal de texto, quero **não** ver a barra larga «ainda na chamada» (nome, cronómetro, Voltar, Sair) a ocupar a área principal, para o chat ter espaço e o contexto da chamada ficar só na miniatura flutuante.

**Why this priority**: Pedido explícito de remoção do cromado duplicado; a barra compete com o PiP e consome altura útil.

**Independent Test**: Em chamada → abrir canal de texto → a barra `voice-connected-bar` **não** aparece; o PiP continua visível (conforme 038).

**Acceptance Scenarios**:

1. **Given** estou na chamada e abro um canal de texto (sem Sair), **When** a vista de texto carrega, **Then** **não** existe a barra inferior/área «ainda na chamada» com nome + cronómetro + botões.
2. **Given** a mesma situação, **When** olho para a interface, **Then** a miniatura flutuante (PiP) **continua** a representar a chamada activa (comportamento 038).
3. **Given** estou **na** vista da mesa de voz da chamada activa, **When** uso a chamada normalmente, **Then** os controlos da mesa (mic, câmera, Sair no palco, etc.) **não** são removidos por esta feature — só a barra de «ligado noutro sítio».

---

### User Story 2 - Voltar à mesa só no PiP (Priority: P1)

Como participante fora da mesa, quero **Voltar à mesa** apenas na miniatura flutuante, para regressar ao canal de voz sem depender da barra removida.

**Why this priority**: Substitui a acção principal que a barra fazia; sem isto a remoção da barra deixa um buraco de navegação.

**Independent Test**: Em chamada + texto → no PiP, «Voltar à mesa» → regressa à vista da mesa; PiP desaparece.

**Acceptance Scenarios**:

1. **Given** o PiP está visível fora da mesa, **When** activo «Voltar à mesa» no PiP, **Then** abro/regresse à vista do canal de voz da chamada activa e o PiP deixa de estar visível.
2. **Given** o PiP está visível, **When** procuro «Voltar à mesa» noutro sítio da shell (barra antiga), **Then** essa acção **já não** existe fora do PiP.

---

### User Story 3 - Sair da chamada no PiP (ícone vermelho) (Priority: P1)

Como participante fora da mesa, quero **sair da chamada** a partir do PiP com um **ícone vermelho de telefone** (sem rótulo «Sair» obrigatório), para encerrar a sessão sem voltar à mesa primeiro.

**Why this priority**: A barra removida levava «Sair»; o PiP passa a ser o único sítio fora da mesa para pendurar.

**Independent Test**: Em chamada + texto → no PiP, ícone vermelho de telefone → chamada termina; PiP desaparece; mídia libertada como no fluxo de Sair actual.

**Acceptance Scenarios**:

1. **Given** o PiP está visível, **When** activo o controlo de sair (ícone vermelho de telefone), **Then** a chamada termina (deixo de estar ligado), o PiP desaparece, e **permaneço na vista onde já estava** (ex.: canal de texto) — sem navegação forçada para a mesa ou home.
2. **Given** o PiP está visível, **When** vejo o controlo de sair, **Then** é **apenas** o ícone de telefone em tratamento de perigo/vermelho — **sem** texto «Sair» ao lado do ícone — na **mesma fila de acções do rodapé** que «Voltar à mesa» (Voltar à esquerda, ícone à direita).
3. **Given** o controlo de sair no PiP, **When** uso leitor de ecrã ou tooltip, **Then** o significado «sair da chamada» / «encerrar» permanece acessível (nome acessível ou título), mesmo sem rótulo visível.

---

### Edge Cases

- PiP sem pré-visualização de vídeo (só estado): «Voltar à mesa» e o ícone de sair **continuam** disponíveis.
- Duplo clique rápido em Sair no PiP: não deve deixar a sessão a meio (mesmo rigor do Sair actual — libertar mídia / leave).
- Utilizador na mesa de voz: esta feature **não** remove o botão Sair dos call-controls do palco.
- Arrastar o PiP: os controlos Voltar / ícone Sair devem permanecer utilizáveis no canto onde o PiP grudou (na fila de rodapé partilhada).
- Tema claro/escuro: o ícone de sair mantém aparência de perigo (vermelho) legível em ambos.
- Clique no ícone de sair não deve iniciar arrasto do PiP (alvos distintos).
- Fora da mesa: ausência de mic/câmera no PiP é intencional; para mutar, o utilizador volta à mesa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Fora da vista da mesa da chamada activa, a aplicação MUST NOT mostrar a barra «ainda na chamada» (`voice-connected-bar` ou equivalente visual) com nome do canal, cronómetro e botões Voltar/Sair.
- **FR-002**: Fora da mesa, a miniatura flutuante (PiP) MUST permanecer o cromado principal da chamada activa (conforme 038), incluindo a acção **Voltar à mesa**.
- **FR-003**: O PiP MUST oferecer uma acção para **encerrar a chamada** (mesmo efeito de produto que o Sair actual da barra/palco: sair da ocupação e libertar captura local). Após encerrar pelo PiP, a aplicação MUST permanecer na vista actual (sem redireccionar automaticamente para a mesa ou home).
- **FR-004**: A acção de encerrar no PiP MUST ser apresentada como **ícone vermelho de telefone** sem rótulo de texto «Sair» visível junto ao ícone, na **mesma fila de rodapé** que «Voltar à mesa» (Voltar à esquerda; ícone de sair à direita).
- **FR-005**: A acção de encerrar no PiP MUST ter identificação acessível (ex.: nome acessível / título) equivalente a «Sair» / «Encerrar chamada».
- **FR-006**: «Voltar à mesa» MUST existir no PiP e MUST NOT depender da barra removida.
- **FR-007**: Esta feature MUST NOT remover ou alterar o fluxo de Sair / controlos na **vista da mesa** da chamada (call-controls do palco).
- **FR-008**: Comportamento de arrastar/snap do PiP (038) MUST permanecer funcional após a adição do ícone de sair.
- **FR-009**: Fora da mesa, o PiP MUST NOT acrescentar controlos de microfone ou câmera; mute/vídeo continuam disponíveis apenas na vista da mesa (call-controls do palco).
- **FR-010**: Esta feature supersede a coexistência barra+PiP registada em [038](../038-floating-voice-pip/) — a barra «ainda na chamada» deixa de existir; o PiP é o cromado único fora da mesa.

### Key Entities

- **Barra «ainda na chamada»**: cromado shell mostrado hoje quando a sessão de voz está activa mas a vista não é a mesa — **removido** nesta feature.
- **PiP da chamada**: miniatura flutuante; passa a ser o único sítio fora da mesa para Voltar e Encerrar.
- **Acção Encerrar no PiP**: controlo só-ícone (telefone vermelho) que termina a chamada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste manual (chamada + canal de texto), 0 ocorrências da barra «ainda na chamada» na área principal; o PiP está presente.
- **SC-002**: 100% das sessões de teste conseguem regressar à mesa só via «Voltar à mesa» no PiP (sem a barra).
- **SC-003**: 100% das sessões de teste conseguem encerrar a chamada só via ícone vermelho no PiP; após isso, mic/câmera deixam de estar capturados e o utilizador permanece na mesma vista (ex. texto) sem salto automático de navegação.
- **SC-004**: Utilizadores em teste informal reconhecem o ícone vermelho como «sair da chamada» em ≥80% dos casos sem ler texto no botão.

## Assumptions

- O PiP de 038 já existe e continua a aparecer nas mesmas condições (fora da mesa, em chamada).
- «Voltar à mesa» no PiP já existe; esta feature **mantém** essa acção e **não** a duplica noutro cromado shell.
- O ícone de telefone reutiliza a linguagem visual de hangup já usada nos call-controls (filled/vermelho), adaptada ao tamanho do PiP.
- Fora da mesa **não** se adicionam mic/câmera ao PiP (clarificação 2026-09-06).
- Cronómetro / nome do canal na barra removida: se o PiP já mostra identidade/timer suficientes (038), não é obrigatório reintroduzir na barra; fora de âmbito criar uma nova barra compacta.
- Não se pede confirmação modal extra ao sair pelo PiP (igual ao Sair directo actual), salvo se o produto já tiver confirmação global — neste caso manter consistência.
- Após Sair no PiP, a vista actual mantém-se (clarificação 2026-09-06).
- Layout do rodapé do PiP: «Voltar à mesa» + ícone vermelho na mesma fila (clarificação 2026-09-06).
