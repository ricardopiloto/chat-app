# Feature Specification: Mensagens após inatividade (stall)

**Feature Branch**: `069-idle-chat-stall`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Em alguns casos, depois de algum tempo de inatividade (sem enviar mensagens), as mensagens param de aparecer no chat para mim, quando eu atualizei a página, ele me pediu para desbloquear."

**Problem**: Num canal de texto já aberto e com sessão desbloqueada, após um período **sem o utilizador enviar mensagens** (inatividade), **deixam de aparecer** mensagens novas de outras pessoas. O histórico parece «congelado». Só ao **atualizar a página** o utilizador volta a ver o estado actual — e, nesse momento, a app pede de novo para **desbloquear** a identidade. Isto quebra a confiança no chat em tempo quase real e força um reload disruptivo.

## Clarifications

### Session 2026-09-08

- Q: Como recuperar após a entrega em tempo real falhar? → A: Automático — reconecta e faz catch-up sozinha; aviso só enquanto degradado (sem botão obrigatório de recuperação)
- Q: Até onde vai o catch-up após repor a entrega? → A: Incremental — só mensagens depois da última já mostrada no ecrã (cursor do histórico)
- Q: Em quanto tempo a recuperação automática deve completar (após a rede/ligação voltar)? → A: Até 10 segundos após a ligação estar de novo utilizável
- Q: Como mostrar o aviso de «actualizações interrompidas» (US2)? → A: Faixa/banner discreto na área do chat (não modal; composer continua utilizável)
- Q: Com o separador em segundo plano, quando deve a app recuperar? → A: Tentar recuperação também em background (dentro do possível); ao focar o separador, completar catch-up se necessário

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continuar a ver mensagens novas após idle (Priority: P1)

Como membro num canal de texto com a sessão já desbloqueada, quero que, depois de ficar algum tempo sem enviar mensagens (só a ler ou com o separador em segundo plano), as mensagens que outras pessoas enviarem **continuem a aparecer** no meu chat sem eu ter de atualizar a página.

**Why this priority**: Sem entrega contínua após idle, o produto deixa de cumprir o uso básico de chat em grupo.

**Independent Test**: Abrir um canal, desbloquear se necessário, ficar ≥ alguns minutos sem enviar; outro utilizador envia mensagens → aparecem no ecrã do observador idle (ou após recuperação automática breve), sem F5.

**Acceptance Scenarios**:

1. **Given** estou autenticado, identidade desbloqueada, e num canal de texto com histórico visível, **When** passo um período de inatividade sem enviar mensagens e outra pessoa envia mensagens nesse canal, **Then** essas mensagens aparecem no meu chat **sem** eu atualizar a página.
2. **Given** a ligação em tempo real falhou em silêncio durante o idle, **When** a app recupera a ligação, **Then** as mensagens **posteriores à última já visível** passam a estar no histórico do canal (catch-up incremental), ainda sem F5.
3. **Given** recuperei após idle sem F5, **When** continuo a usar o canal, **Then** **não** me é pedido desbloquear de novo só por causa dessa recuperação (a sessão já estava desbloqueada).

---

### User Story 2 - Saber quando o chat não está a receber actualizações (Priority: P2)

Como utilizador no chat, quero um indício claro se o chat **não** está a receber actualizações em tempo real, para não assumir que «não há mensagens novas» quando na verdade a ligação falhou.

**Why this priority**: Evita falso silêncio; complementa US1 quando a recuperação ainda não ocorreu.

**Independent Test**: Simular perda de actualizações em tempo real (ou estado degradado) → UI mostra aviso informativo; a app reconecta e faz catch-up **sozinha**; após restabelecer, o aviso desaparece e as mensagens em falta aparecem.

**Acceptance Scenarios**:

1. **Given** o canal está aberto e a entrega em tempo real falhou, **When** olho para a área do chat, **Then** vejo uma **faixa/banner discreto** a indicar que as actualizações podem estar interrompidas (não um ecrã «normal» e silencioso indefinidamente), sem modal a bloquear o composer.
2. **Given** essa faixa está visível, **When** a entrega é restabelecida e o catch-up incremental conclui, **Then** a faixa desaparece e o chat volta ao comportamento normal.

---

### User Story 3 - Reload completo vs. idle (Priority: P3)

Como utilizador, quero que o pedido de **desbloquear** após **atualizar a página** continue a seguir as regras de segurança já existentes do produto (identidade/chaves), e que o problema de mensagens paradas **não** dependa de eu fazer F5 para «destravar» o chat.

**Why this priority**: Separa o bug de stall do fluxo legítimo de desbloqueio pós-reload; evita regressões de segurança.

**Independent Test**: (a) Idle sem F5 → mensagens voltam / catch-up sem desbloquear de novo. (b) F5 deliberado → comportamento de desbloqueio actual do produto (pode pedir desbloquear).

**Acceptance Scenarios**:

1. **Given** atualizei a página de propósito, **When** a app exige desbloquear a identidade conforme as regras actuais, **Then** esse pedido permanece aceitável (fora do âmbito «corrigir stall sem F5»).
2. **Given** estou idle com a sessão ainda desbloqueada e o chat recuperou sozinho, **When** recebo mensagens novas, **Then** não preciso de F5 nem de um segundo desbloqueio só para voltar a ver o chat.

---

### Edge Cases

- Separador em segundo plano / ecrã bloqueado: a app MUST **tentar** recuperar a entrega também em background (nos limites do ambiente); ao voltar a focar o separador, MUST completar catch-up incremental se ainda faltarem mensagens — sem F5.
- Rede intermitente: após restabelecer, catch-up **incremental** cobre mensagens após a última já visível; sem duplicar mensagens já no ecrã de forma confusa.
- Utilizador envia a primeira mensagem após longo idle: o envio não deve «desbloquear» sozinho o recebimento — o recebimento deve funcionar independentemente de enviar.
- Canal de voz/vídeo: fora do âmbito desta feature (só texto / histórico do canal de texto).
- Vários canais: o canal actualmente aberto (em vista) é o foco do P1; outros canais podem seguir as regras já existentes de indicadores de novidade.
- Sessão de login expirada de verdade: o produto pode exigir voltar a autenticar; isso é distinto do stall silencioso com sessão ainda válida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Com identidade desbloqueada e canal de texto aberto, o produto MUST continuar a apresentar mensagens novas de outros membros após períodos de inatividade do utilizador (sem enviar), **sem** exigir atualização da página.
- **FR-002**: Se a entrega em tempo real se interromper, o produto MUST **recuperar automaticamente** (reconectar + catch-up das mensagens em falta) **sem** exigir um botão ou acção explícita do utilizador; o aviso de degradado (FR-004) é informativo, não o único caminho de recuperação.
- **FR-002a**: O catch-up MUST ser **incremental**: obter e apresentar apenas mensagens **posteriores** à última mensagem já visível no canal em vista (ponto de continuidade do histórico), sem substituir o histórico já carregado por um «refresh» completo da vista.
- **FR-002b**: Após a ligação em tempo real voltar a estar utilizável, a recuperação automática (reconectar + catch-up incremental) MUST completar de forma perceptível para o utilizador em **no máximo 10 segundos** nas condições de teste do produto (SC-001).
- **FR-003**: A recuperação após idle / falha de entrega MUST **não** exigir um novo desbloqueio de identidade quando a sessão já estava desbloqueada nesse separador.
- **FR-004**: Enquanto a entrega em tempo real estiver indisponível, o produto MUST mostrar uma **faixa/banner discreto na área do chat** (não modal) a indicar que as actualizações podem estar interrompidas; o composer MUST permanecer utilizável. O aviso MUST desaparecer quando a entrega e o catch-up estiverem restabelecidos.
- **FR-005**: O pedido de desbloquear após um **reload completo** da página MUST permanecer alinhado com as regras de segurança já definidas do produto (não é objectivo desta feature eliminar o desbloqueio pós-F5 se for necessário para chaves/identidade).
- **FR-006**: O acto de **enviar** uma mensagem MUST **não** ser pré-requisito para voltar a receber mensagens após idle.
- **FR-007**: Após catch-up, o histórico MUST permanecer coerente (ordem cronológica legível; sem exigir que o utilizador limpe o ecrã manualmente).
- **FR-008**: Com o separador em segundo plano, o produto MUST **tentar** manter ou recuperar a entrega em tempo real (dentro do que o ambiente permitir); ao voltar a focar o separador, MUST garantir catch-up incremental se ainda houver mensagens em falta.

### Key Entities

- **Sessão desbloqueada**: estado no separador em que o utilizador já autenticou e desbloqueou a identidade para ler/escrever conteúdo protegido.
- **Canal de texto em vista**: canal cujo histórico o utilizador está a ver no momento.
- **Mensagem em falta**: mensagem criada no canal **depois** da última mensagem já visível no cliente, durante um intervalo sem actualizações em tempo real.
- **Estado de entrega interrompida**: condição em que o cliente não está a receber actualizações ao vivo no canal em vista.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num teste com dois utilizadores no mesmo canal, após ≥ 5 minutos de idle do observador (sem enviar), mensagens enviadas pelo outro aparecem no ecrã do observador **sem F5** em ≥ 95% das tentativas, **no máximo 10 segundos** após a ligação em tempo real estar de novo utilizável (incluindo catch-up incremental).
- **SC-002**: Em cenários em que a entrega em tempo real falha durante idle, o observador vê indício de problema **antes** de concluir erroneamente que «não há mensagens», e após recuperação (≤ 10 s quando a ligação voltar) obtém as mensagens em falta sem atualizar a página.
- **SC-003**: Recuperação sem F5 **não** introduz um segundo pedido de desbloqueio na mesma sessão de separador já desbloqueada (0 ocorrências no teste de idle + catch-up).
- **SC-004**: Utilizadores deixam de precisar de «atualizar a página» como workaround habitual para voltar a ver o chat após idle (validação qualitativa / redução do workaround nos testes manuais do quickstart).

## Assumptions

- O sintoma principal a corrigir é o **stall silencioso** de mensagens com o separador ainda aberto; o pedido de desbloquear **após F5** é tratado como comportamento de segurança existente (chaves em memória), não como o bug a eliminar.
- «Inatividade» significa o utilizador não enviar mensagens (e tipicamente não interagir), não necessariamente logout.
- Âmbito MVP: **canais de texto** com sessão válida e identidade já desbloqueada.
- A duração exacta do idle até falhar pode variar (rede, separador em background, poupança de energia); a feature cobre recuperação e catch-up independentemente do tempo exacto; após a ligação voltar, o alvo de conclusão é **≤ 10 s**.
- Em segundo plano, a recuperação pode ser limitada pelo ambiente (poupança de energia, throttling); o foco do separador é o momento em que o catch-up residual MUST ficar garantido.
- Autenticação de conta expirada de verdade continua a poder forçar novo login; isso não se confunde com stall + F5 + desbloquear identidade.
- Indicadores de «canal com mensagens novas» noutras vistas (notificações de sessão, etc.) podem coexistir; o P1 foca o canal **em vista**.
