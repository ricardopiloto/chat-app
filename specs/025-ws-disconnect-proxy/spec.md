# Feature Specification: Ruído de proxy WS ao sair da sala

**Feature Branch**: `025-ws-disconnect-proxy`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos investigar essa mensagem que aparece sempre que eu desconecto da sala: [vite] ws proxy error: Error: This socket has been ended by the other party (ao sair da chamada / sala de voz)."

**Depends on**: chamada de voz/vídeo existente; proxy de desenvolvimento Vite (`/ws`, `/rtc`); [020-call-control-icons](../020-call-control-icons/) / leave da barra (contexto de saída).

## Clarifications

### Session 2026-09-04

- Q: Critério de sucesso do leave? → A: Sucesso = **0** erros desse tipo no leave; documentar só se for inevitável e inofensivo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sair da sala sem alarme falso no ambiente de desenvolvimento (Priority: P1)

Como programador (ou operador a correr a SPA em modo desenvolvimento), quero que **sair da sala de voz** não deixe sistematicamente um erro de proxy WebSocket no terminal do servidor de desenvolvimento, para eu distinguir falhas reais de um encerramento normal da ligação.

**Why this priority**: O reporte é recorrente («sempre que desconecto»); polui o diagnóstico e sugere que a saída está «partida» mesmo quando a UI sai bem.

**Independent Test**: Entrar numa sala/chamada ao vivo → Sair → o terminal de desenvolvimento **não** mostra o erro `ws proxy error: This socket has been ended by the other party` como consequência desse leave. Documentar sem eliminar o spam só é aceitável se a investigação provar inevitabilidade + leave/media já limpos.

**Acceptance Scenarios**:

1. **Given** estou numa chamada de voz/vídeo ao vivo com o frontend em desenvolvimento a correr, **When** saio da sala pela acção normal (ex. Sair), **Then** a UI deixa a chamada correctamente **e** o terminal de desenvolvimento não regista o erro de proxy WS acima nesse leave.
2. **Given** o leave completa, **When** volto a entrar na mesma sala, **Then** consigo juntar-me de novo sem passos manuais extra por causa do leave anterior.

---

### User Story 2 - Entender se o erro afecta a experiência na chamada (Priority: P1)

Como participante, quero que **sair da sala** continue a libertar microfone/câmara e a terminar a sessão de média de forma limpa, independentemente de o ruído ser só no proxy de desenvolvimento.

**Why this priority**: A investigação não deve «silenciar logs» e deixar um disconnect real a falhar.

**Independent Test**: Sair da sala → deixa de publicar A/V; não fica «preso» em chamada; rejoin OK.

**Acceptance Scenarios**:

1. **Given** estou em chamada com microfone e/ou câmara activos, **When** saio, **Then** deixo de estar na chamada na UI e os dispositivos deixam de estar publicados na sala.
2. **Given** acabei de sair, **When** outro participante (ou eu noutra sessão) observa a sala, **Then** já não apareço como participante activo após um intervalo curto razoável.

---

### User Story 3 - Falhas reais de rede continuam visíveis (Priority: P2)

Como programador, quero que **quedas inesperadas** de ligação (backend ou media caídos a meio) ainda produzam sinais claros, para o silêncio do leave normal não esconder regressões.

**Why this priority**: Evitar mascarar erros úteis ao tratar o leave intencional.

**Independent Test**: Com backend/media indisponível a meio da chamada (cenário controlado), o problema continua detectável; o leave intencional permanece limpo.

**Acceptance Scenarios**:

1. **Given** um leave **intencional** bem-sucedido, **When** observo os logs de desenvolvimento, **Then** não há o spam recorrente do erro de socket ended citado no reporte.
2. **Given** uma falha **não** intencional da ligação durante a chamada, **When** ocorre, **Then** continua a haver indicação útil (UI e/ou log) de que algo falhou — não se exige o mesmo silêncio que no leave.

---

### Edge Cases

- Sair sem nunca ter ligado media com sucesso: leave não deve gerar o mesmo spam (ou o mesmo critério de limpeza).
- Mudar de canal / navegar para fora durante a chamada: tratado como saída equivalente para este critério de log.
- Produção (sem Vite proxy): o sintoma do terminal Vite pode não existir; a limpeza do disconnect de media/app WS continua desejável.
- Dois proxies (`/ws` app e `/rtc` media): a investigação deve identificar **qual** ligação dispara o erro ao sair da sala; o sucesso mede-se pelo desaparecimento do spam no leave, não por silenciar todos os WS para sempre.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O fluxo normal de **sair da sala de voz/vídeo** MUST completar-se na UI sem deixar o utilizador em estado de chamada.
- **FR-002**: Após investigação, a equipa MUST eliminar o registo **recorrente** do erro de proxy WebSocket `This socket has been ended by the other party` no servidor de desenvolvimento como efeito colateral do leave intencional (meta: **0** ocorrências atribuíveis a esse leave). Documentar o spam sem o eliminar só é permitido se a investigação provar que é **inevitável** no proxy **e** que leave/média já estão limpos; nesse caso MUST haver nota operacional com critério de verificação.
- **FR-002a**: Filtrar/silenciar o log do proxy **sem** melhorar o encerramento da ligação MUST NOT ser a solução preferida quando um close ordenado for viável.
- **FR-003**: O leave intencional MUST libertar a sessão de média (participante deixa a sala) de forma observável.
- **FR-004**: A correcção MUST NOT ocultar falhas de ligação não intencionais (queda de servidor/media a meio da chamada).
- **FR-005**: Reentrar na sala após um leave limpo MUST funcionar sem passos de recuperação manuais extra.
- **FR-006**: O âmbito inclui identificar se a origem é a ligação de eventos da app, a ligação de média (RTC), ou ambas, no ambiente de desenvolvimento com proxy.

### Key Entities

- **Voice room / call session**: Sessão de média da sala da qual o utilizador sai.
- **Dev WebSocket proxy**: Ponte do servidor de desenvolvimento entre o browser e os serviços locais; onde o erro do reporte aparece.
- **Intentional leave**: Acção deliberada de sair (botão Sair ou navegação equivalente), distinta de uma queda de rede.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 5 leaves consecutivos em desenvolvimento, **0** ocorrências do erro exacto de proxy WS do reporte atribuíveis a esse leave (critério principal de sucesso).
- **SC-002**: Em cada um desses leaves, a UI sai da chamada em ≤2 s no caminho feliz.
- **SC-003**: Após leave, rejoin na mesma sala funciona à primeira tentativa em teste manual.
- **SC-004**: Uma falha forçada não intencional (ex. parar o serviço de media a meio) continua a ser perceptível para quem debugga (não fica «tudo silencioso»).

## Assumptions

- O sintoma observado é no **terminal do Vite** (`[vite] ws proxy error`), tipicamente ao fechar um socket que o proxy ainda tentava escrever — comum quando o servidor (ou o cliente) encerra a ligação primeiro.
- «Sala» = canal de voz/vídeo / chamada LiveKit (ou equivalente), não necessariamente fechar o browser.
- O objectivo de sucesso é **leave limpo com 0 spam** desse erro. Documentar sem eliminar só como último recurso (inevitável + inofensivo + leave/média limpos), nunca como atalho preferido.
- Produção sem este proxy pode não mostrar a mensagem; ainda assim, um disconnect ordenado é desejável.
- Não se exige novo UI para o utilizador final além de leave/rejoin correctos.
