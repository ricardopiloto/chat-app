# Feature Specification: Menu de blur da câmara não abre

**Feature Branch**: `023-fix-blur-menu`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos corrigir o comportamento dentro de [call-ctrl-split / camera-blur-anchor]: quando clico no botão chevron (Fundo: blur ligado), ele não está a mostrar as opções de efeito."

**Depends on**: [015-camera-background-blur](../015-camera-background-blur/) (menu Sem / Leve / Forte na seta da câmara); [020-call-control-icons](../020-call-control-icons/) (chrome Discord do split — possível regressão visual).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o menu de fundo pela seta (Priority: P1)

Como participante numa chamada ao vivo, quero clicar na seta junto ao ícone de câmara e ver de imediato as opções de efeito de fundo (Sem blur, Blur leve, Blur forte), para poder escolher ou confirmar o modo sem adivinhar se o clique funcionou.

**Why this priority**: Regressão funcional do controlo principal de blur; sem o menu, o utilizador não consegue alterar o fundo pela UI.

**Independent Test**: Em chamada (incl. modo palco se activo), clicar na seta do split da câmara → menu com as três opções visível e utilizável; `aria-expanded` reflecte aberto.

**Acceptance Scenarios**:

1. **Given** estou numa chamada ao vivo com a barra de controlos visível, **When** clico na seta (chevron) do controlo partido da câmara, **Then** aparece o menu de fundo com as opções **Sem blur**, **Blur leve** e **Blur forte**, legível e não cortado pela barra ou pelo palco.
2. **Given** o menu está aberto, **When** olho para a seta, **Then** o estado acessível indica que o menu está expandido (ex. controlo marcado como aberto).
3. **Given** o blur já está ligado (`Fundo: blur ligado`), **When** abro o menu, **Then** as opções aparecem na mesma (o estado «blur on» na seta não impede o menu).

---

### User Story 2 - Fechar e escolher uma opção (Priority: P1)

Como participante, quero poder fechar o menu (Escape, clique fora, ou após escolher) e aplicar uma opção, para o fluxo de 015 voltar a funcionar de ponta a ponta.

**Why this priority**: Abrir sem conseguir escolher/fechar ainda deixa o controlo partido.

**Independent Test**: Abrir menu → escolher «Blur leve» (ou outra) → menu fecha e a preferência/indicação na seta actualiza como em 015; Escape / clique fora fecha sem mudar o modo.

**Acceptance Scenarios**:

1. **Given** o menu está aberto, **When** escolho uma das três opções, **Then** o menu fecha e o modo de fundo passa a ser o escolhido (comportamento de 015).
2. **Given** o menu está aberto, **When** pressiono Escape ou clico fora do menu e da seta, **Then** o menu fecha sem exigir escolher uma opção.
3. **Given** o menu está fechado, **When** clico de novo na seta, **Then** o menu volta a abrir (toggle).

---

### User Story 3 - Menu visível em modo palco (Priority: P2)

Como participante em **modo palco** (barra de chamada na vista de voz expandida), quero o mesmo comportamento fiável da seta, porque é aí que o problema foi observado.

**Why this priority**: O reporte aponta explicitamente o DOM em stage-mode; o fix deve cobrir essa disposição, não só o layout «normal».

**Independent Test**: Activar modo palco / canais expandidos como no reporte → clicar na seta → menu visível acima (ou de forma igualmente utilizável) sem ficar escondido atrás do palco ou cortado.

**Acceptance Scenarios**:

1. **Given** a chamada está em modo palco com a barra de controlos visível, **When** abro o menu pela seta, **Then** as opções são visíveis e clicáveis (não clipadas nem cobertas de forma a impedir o uso).
2. **Given** modo palco e menu aberto, **When** escolho uma opção, **Then** o resultado é o mesmo que fora do modo palco (fecha + aplica).

---

### Edge Cases

- Câmara desligada: a seta continua a abrir o menu (015); o fix não deve exigir câmara ligada.
- Clique no ícone de câmara (área principal): continua a ligar/desligar câmara **sem** abrir o menu.
- Menu aberto junto ao fundo do ecrã: deve permanecer utilizável (abrir para cima ou equivalente já previsto); não ficar invisível.
- Tema claro e escuro: painel do menu legível em ambos.
- Gravar / Sair / microfone: fora de âmbito excepto regressão acidental de layout da barra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicar na seta do split da câmara MUST abrir o menu de opções de fundo da câmara quando este estiver fechado.
- **FR-002**: O menu aberto MUST mostrar as três opções: Sem blur, Blur leve, Blur forte, de forma **visível** e **interactiva** na vista actual (incluindo modo palco).
- **FR-003**: Clicar na seta com o menu aberto MUST fechar o menu (toggle), salvo se outro gesto de fecho já o tiver fechado.
- **FR-004**: Escolher uma opção MUST aplicar o modo e fechar o menu, como em 015.
- **FR-005**: Escape e clique fora MUST fechar o menu sem aplicar uma nova escolha involuntária.
- **FR-006**: O clique na área principal do ícone de câmara MUST NOT ser necessário para abrir o menu e MUST NOT deixar de alternar a câmara.
- **FR-007**: O indicador de «blur ligado» na seta MUST NOT impedir a abertura do menu.
- **FR-008**: Esta correção MUST NOT remover as opções de blur nem alterar a semântica das três opções; o âmbito é restaurar a **descoberta/visibilidade** do menu ao clicar na seta.

### Key Entities

- **Camera blur menu**: Painel de escolha de fundo (três modos) ancorado à seta do split da câmara.
- **Chevron / seta**: Controlo que deve abrir/fechar esse menu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste manual em chamada, 100% das tentativas de clique na seta (n ≥ 5) abrem um menu com as três opções visíveis em ≤1 s.
- **SC-002**: Em modo palco (disposição do reporte), o mesmo critério SC-001 aplica-se.
- **SC-003**: Escolher cada uma das três opções fecha o menu e reflecte o modo na seta/comportamento esperado de 015.
- **SC-004**: Escape e clique fora fecham o menu sem erro e sem deixar a UI «presa» aberta.
- **SC-005**: Alternar câmara pelo ícone principal continua a funcionar após o fix.

## Assumptions

- O menu e as opções de 015 ainda existem no produto; o defeito é que **não aparecem / não são utilizáveis** ao clicar na seta (cortados, cobertos, ou estado aberto sem feedback visual).
- A regressão pode estar ligada ao chrome unificado do split (020) ou ao layout do modo palco; a especificação exige o resultado (menu visível), não um diagnóstico único.
- Não se pedem novas opções de efeito nem mudança de nomes das opções.
- Não se altera o pipeline de blur/media além do necessário para o menu voltar a ser usável.
