# Feature Specification: Controlos de chamada só no painel

**Feature Branch**: `049-panel-only-call-controls`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Remova os controles … call-controls do palco, mantenha eles apenas no controle do usuário … user-panel."

**Depends on**: painel de utilizador ([039-floating-user-bar](../039-floating-user-bar/)); regras de visibilidade em chamada ([042-panel-call-stage-ui](../042-panel-call-stage-ui/), [043-panel-calls-in-call-only](../043-panel-calls-in-call-only/)); cartão do painel a atravessar a rail ([048-user-panel-span-rail](../048-user-panel-span-rail/)).

**Supersedes (visibilidade)**: a regra «na mesa → controlos no palco, ocultos no painel» de [042](../042-panel-call-stage-ui/) / [043](../043-panel-calls-in-call-only/) US3 / FR-003. Passa a haver **um único sítio** para microfone, ensurdecer, câmera/blur e sair: o painel de utilizador — **também** quando o participante está na mesa.

## Clarifications

### Session 2026-09-06

- Q: O que fazer com «Gravar cena…» / parar gravação ao remover a barra do palco? → A: Remover a funcionalidade de gravação da UI **por agora**; repor mais tarde via backlog futuro ([docs/backlog-prototype-v2-gaps.md](../../docs/backlog-prototype-v2-gaps.md) G1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sem barra de chamada no palco (Priority: P1)

Como participante na mesa de voz/vídeo, quero que a faixa inferior de controlos de chamada do palco **não exista**, para o palco ganhar espaço e não duplicar acções que já tenho no painel.

**Why this priority**: Pedido explícito; remove o chrome de controlos do palco.

**Independent Test**: Entrar numa chamada e permanecer na vista da mesa → a área principal do palco **não** mostra a barra de controlos de chamada (mic, ensurdecer, câmera, sair) **nem** acções de gravação de cena; o palco/slots ocupam o espaço até ao fundo útil da área principal.

**Acceptance Scenarios**:

1. **Given** estou em chamada na vista da mesa, **When** olho a área principal do palco, **Then** **não** vejo a barra de controlos de chamada do palco (grupo equivalente a mic / ensurdecer / câmera / sair nessa faixa).
2. **Given** a mesma situação, **When** inspecciono a interface da mesa, **Then** **não** há um segundo conjunto activo desses controlos pessoais de mídia além do painel de utilizador.
3. **Given** estou na mesa (admin ou não), **When** procuro «Gravar cena…» / «Parar gravação», **Then** essas acções **não** estão disponíveis na UI (suspensas até reposição futura).

---

### User Story 2 - Controlos no painel também na mesa (Priority: P1)

Como participante **na** mesa da chamada activa, quero ver e usar no painel de utilizador os controlos de chamada (microfone, ensurdecer, câmera/blur, sair), porque o palco já não os oferece.

**Why this priority**: Sem isto, remover o palco deixaria o utilizador na mesa sem forma de mutar, ligar câmera ou sair.

**Independent Test**: Em chamada na mesa → painel com grupo de controlos utilizável; mutar / sair pelo painel funciona; ao sair da chamada o grupo desaparece (regra 043 fora de chamada mantém-se).

**Acceptance Scenarios**:

1. **Given** estou em chamada e na vista da mesa dessa chamada, **When** olho o painel de utilizador, **Then** o grupo de controlos de chamada está **visível e utilizável** (incluindo sair).
2. **Given** estou em chamada e **fora** da mesa (ex. canal de texto), **When** olho o painel, **Then** o mesmo grupo continua **visível e utilizável** (comportamento off-stage inalterado).
3. **Given** não estou em chamada, **When** olho o painel, **Then** o grupo **não** aparece (nem desabilitado), como em [043](../043-panel-calls-in-call-only/).

---

### User Story 3 - Mais área útil no palco (Priority: P2)

Como participante na mesa, quero que o espaço antes ocupado pela barra de controlos do palco reverta para a cena/slots, sem perder acções essenciais de chamada (agora no painel).

**Why this priority**: Benefício visual derivado da remoção; secundário ao acesso aos controlos.

**Independent Test**: Comparar altura útil do palco com/sem a barra removida — o bloco da cena usa mais altura vertical na área principal.

**Acceptance Scenarios**:

1. **Given** estou na mesa em chamada, **When** comparo com o layout anterior que tinha a barra de controlos no fundo do palco, **Then** a região da cena/slots ocupa **mais** altura útil (pelo menos o espaço que a barra libertou).

---

### Edge Cases

- **Gravação de cena**: fora de âmbito desta entrega — UI de gravar/parar **removida**; reposição futura no backlog (G1). Não migrar para o painel.
- Viewport estreita / drawer: controlos no painel continuam alcançáveis (painel no chrome esquerdo / drawer).
- Listen-only / sem permissão de falar ou publicar vídeo: os mesmos limites de produto aplicam-se aos controlos do painel (desabilitados ou equivalentes já existentes).
- Transição mesa ↔ texto com chamada activa: o grupo no painel permanece; nunca duplicar com barra no palco.
- Tema claro/escuro: remoção da barra e presença no painel em ambos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Na vista da mesa com chamada activa, o produto MUST NOT apresentar a barra de controlos de chamada do palco para microfone, ensurdecer, câmera/blur e sair da chamada.
- **FR-002**: Em chamada activa — **incluindo** quando o utilizador está na vista da mesa dessa chamada — o painel de utilizador MUST mostrar o grupo de controlos de chamada (microfone, ensurdecer, câmera/blur, sair) activo e utilizável.
- **FR-003**: Fora de chamada, o painel MUST NOT mostrar o grupo de controlos de chamada (incl. estados desabilitados), alinhado a [043](../043-panel-calls-in-call-only/).
- **FR-004**: Esta feature **substitui** a regra de [042](../042-panel-call-stage-ui/) / [043](../043-panel-calls-in-call-only/) que ocultava o grupo do painel na mesa (sítio activo = palco). O sítio activo dos controlos pessoais de chamada passa a ser **sempre o painel** enquanto houver chamada.
- **FR-005**: Identidade / conta no painel MUST permanecer visível com ou sem chamada.
- **FR-006**: A funcionalidade de **gravação de cena** («Gravar cena…» / «Parar gravação» e fluxo associado na UI da mesa) MUST ser **removida da experiência do utilizador** nesta entrega; MUST NOT aparecer no painel de utilizador; a reposição fica no backlog futuro (G1).
- **FR-007**: Remover a barra do palco MUST NOT impedir mutar, ensurdecer, alternar câmera/blur ou sair da chamada enquanto o utilizador está na mesa (essas acções ficam no painel).

### Key Entities

- **Barra de controlos do palco**: faixa inferior da mesa com controlos pessoais de mídia/sair (e, antes, gravação); a remover nesta feature.
- **Grupo de controlos de chamada (painel)**: fila no painel de utilizador; único sítio para controlos pessoais em chamada (mesa ou fora).
- **Gravação de cena**: capacidade de produto **suspensa** nesta entrega; reposição futura (backlog G1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 verificações na mesa em chamada, 10/10 vezes a barra de controlos pessoais do palco (mic / ensurdecer / câmera / sair) **não** está presente.
- **SC-002**: Em 10 verificações na mesa em chamada, 10/10 vezes o painel de utilizador mostra o grupo de controlos de chamada utilizável.
- **SC-003**: Em 10 verificações fora de chamada, 10/10 vezes o painel **não** mostra o grupo de controlos de chamada.
- **SC-004**: Um participante na mesa consegue mutar e sair da chamada usando **apenas** o painel, sem recorrer a controlos no palco, em ≤ 10 segundos após localizar o painel.
- **SC-005**: Com a barra removida, a área da cena/slots na mesa ganha altura útil adicional perceptível (pelo menos o espaço libertado pela barra anterior) em vista desktop típica.
- **SC-006**: Em 10 verificações na mesa (admin incluído), 10/10 vezes **não** há controlo visível «Gravar cena…» / «Parar gravação».

## Assumptions

- Controlos pessoais de chamada (mic, ensurdecer, câmera/blur, sair) vivem **só** no painel enquanto houver chamada.
- Gravação de cena fica **fora** desta entrega (UI removida); backends/APIs podem permanecer intactos até uma feature futura — detalhe de implementação no plan.
- PiP e restantes regras de sessão de voz fora do âmbito (salvo que não reintroduzam uma segunda barra de mic/sair no palco).
- Permissões listen-only / fala / vídeo já existentes no painel aplicam-se quando os controlos passam a aparecer também na mesa.
- Não se pede redesign dos ícones do painel além do necessário à nova regra de visibilidade.
- Chrome do painel a atravessar a rail ([048](../048-user-panel-span-rail/)) mantém-se; esta feature não altera o layout do cartão-base.

## Out of Scope

- Repor ou redesenhar gravação de cena / Egress (backlog G1).
- Alterar PiP, topbar, ou regras de permissão de voz além da visibilidade dos controlos.
- Migrar gravação para o painel de utilizador.
