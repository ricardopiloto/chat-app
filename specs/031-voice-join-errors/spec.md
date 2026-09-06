# Feature Specification: Tratativa de falha ao entrar na sala de voz

**Feature Branch**: `031-voice-join-errors`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Vamos adicionar uma tratativa de erro para quando o usuário tentar conectar em uma sala e não conseguir por qualquer motivo. Hoje nós colocamos o usuário na sala antes de garantir que ele está conectado, se houver algum erro para habilitar a camera ou conectar o audio na sala, ele não deve mostrar como conectado."

**Depends on**: entrar/sair de canais de voz/vídeo; ocupação / roster ([028](../028-voice-call-roster/)); sessão de média (câmera/microfone).

## Clarifications

### Session 2026-09-06

- Q: Se o microfone liga mas a câmera falha no join, o utilizador fica conectado? → A: Sim — entra na chamada só com áudio; câmera fica off e há feedback do erro da câmera (não aborta o join por falha só da câmera).
- Q: Que tipo de feedback de erro no join falhado (áudio/sala)? → A: Mensagens por categoria (permissão / dispositivo / ligação / genérico), em português.
- Q: Outros podem ver um flash breve na ocupação antes da limpeza após falha? → A: Sim — flash breve aceite; estado final ≤5 s deve ser «fora» (SC-002).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Não aparecer ligado se a ligação falhar (Priority: P1)

Como utilizador que tenta entrar numa sala de voz/vídeo, quero que **só seja considerado «na chamada» / conectado** depois de a ligação à sala e o **áudio** terem **sucedido**. Se falhar a ligação ou o áudio (permissão, dispositivo, rede, etc.), **não** quero aparecer como conectado para mim nem para os outros. Se falhar **só** a câmera, quero mesmo assim ficar na chamada com áudio (câmera off) e ver um aviso.

**Why this priority**: Corrige o comportamento actual em que a ocupação é registada antes de a ligação estar garantida — causa «fantasmas» na sala e estado mentiroso.

**Independent Test**: Simular falha ao ligar áudio ou à sala no caminho de join; o utilizador **não** fica na ocupação, **não** vê UI de «conectado», e outros **não** o vêem na mesa. Simular falha só da câmera com áudio ok → fica conectado com câmera off + feedback.

**Acceptance Scenarios**:

1. **Given** tento juntar-me a um canal de voz/vídeo e a ligação de **áudio** ou à **sala** falha, **When** o erro ocorre, **Then** **não** fico marcado como conectado / na chamada (ocupação e UI de sessão reflectem «fora»).
2. **Given** a falha de áudio/sala ocorreu a meio do join, **When** outros membros olham a ocupação / lista da sala, **Then** **não** me vêem como participante dessa chamada por causa dessa tentativa falhada.
3. **Given** a falha ocorreu depois de algum passo parcial de «entrar», **When** o sistema trata o erro, **Then** qualquer registo temporário de presença é **revertido** (leave / limpeza) de forma que o estado final seja consistente com «não conectado».
4. **Given** a ligação **sucede** (sala + áudio), **When** entro na sala, **Then** passo a aparecer como conectado / na chamada como hoje (caminho feliz inalterado; câmera pode estar off).
5. **Given** o áudio e a sala sucedem mas a **câmera** falha, **When** o join termina, **Then** fico conectado com câmera off e vejo feedback do erro da câmera.

---

### User Story 2 - Feedback claro da falha (Priority: P1)

Como utilizador cuja tentativa de entrar falhou, quero ver uma **mensagem de erro compreensível** (e poder voltar a tentar), em vez de ficar num estado ambíguo «parece que estou dentro mas não estou».

**Why this priority**: Sem feedback, o utilizador não sabe se deve repetir, conceder permissões ou desistir.

**Independent Test**: Forçar falha de join → mensagem visível no ecrã da mesa/canal; controlos permitem nova tentativa; sem indicador persistente de «em chamada».

**Acceptance Scenarios**:

1. **Given** o join falha, **When** olho a interface, **Then** vejo feedback de erro **por categoria** (permissão, dispositivo, ligação ou genérico — não só silêncio nem UI de «conectado» quebrada).
2. **Given** vi o erro, **When** corrijo a causa (ex. autorizo média) e tento de novo, **Then** posso iniciar um novo join sem precisar de refresh completo da aplicação.
3. **Given** o join falha, **When** observo o chrome de chamada (timer, «Sair», roster), **Then** **não** mostro estado de chamada activa só por causa dessa tentativa falhada.

---

### User Story 3 - Falha após «já estava a tentar» / limpeza local (Priority: P2)

Como utilizador, se a UI já mostrou um estado intermédio de «a ligar…», quero que esse estado **termine** em erro ou sucesso explícito — sem ficar preso em «a ligar» nem em «conectado» falso.

**Why this priority**: Evita estados fantasma locais mesmo quando a ocupação remota já foi limpa.

**Independent Test**: Interromper ou falhar durante «a ligar»; a UI deixa o estado de loading e volta a permitir Entrar / juntar-se.

**Acceptance Scenarios**:

1. **Given** estou no estado «a ligar» / a juntar-me, **When** ocorre um erro, **Then** saio desse estado de loading e fico claramente **fora** da chamada.
2. **Given** falhei o join, **When** a sessão de média local tiver sido parcialmente criada, **Then** é libertada (sem microfone/câmera activos «órfãos» associados a essa tentativa).

---

### Edge Cases

- Permissão de **microfone**/áudio negada pelo browser: erro por categoria; sem ocupação «conectado». Permissão só de **câmera** negada com áudio ok: conectado com câmera off + aviso (clarificação).
- Falha **só da câmera** com áudio ok: o join MUST **continuar com sucesso** (utilizador **conectado**); câmera permanece off e a UI MUST mostrar feedback do erro da câmera. Não inventar modos «só ouvinte» (sem áudio nem câmera) nesta feature.
- Falha do **microfone** / áudio (ou da ligação à sala) com ou sem câmera: MUST tratar como **falha de join** → **não conectado** (rever ocupação). Câmera sozinha sem áudio utilizável **não** basta para considerar o join bem-sucedido.
- Rede / servidor de média indisponível: mesmo tratamento — erro + não conectado.
- Utilizador já estava noutra mesa e tenta mudar de canal: se o join ao novo falhar, não deve ficar «conectado» ao novo; a política de ficar ou não no canal anterior segue o comportamento actual de *move* ([028](../028-voice-call-roster/)) — se o leave do anterior já ocorreu e o join novo falha, o utilizador fica **fora** de ambas (não fantasma no novo).
- Duplo clique em «Entrar»: não deve criar duas ocupações; falhas idempotentes / limpeza segura.
- Fora de âmbito: redesenhar controlos de chamada; novos tipos de erro de rede para chat de texto; alterar regras de roster (quem aparece com mic/cam) excepto o efeito colateral de não listar quem nunca ligou de facto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST considerar o utilizador **conectado / na chamada** apenas após o fluxo de join à sala de voz/vídeo ter **concluído com sucesso** (ligação à sala e áudio utilizável; câmera pode ficar off).
- **FR-002**: Se falhar a ligação à sala, o áudio/microfone, ou permissões necessárias ao áudio, o sistema MUST **não** deixar o utilizador marcado como conectado na ocupação da sala. Falha **isolada** da câmera MUST NOT abortar o join: o utilizador fica conectado com câmera off e feedback do erro da câmera (**clarificação 2026-09-06**).
- **FR-003**: Em caso de falha após um registo parcial de presença, o sistema MUST **reverter** essa presença (sair / limpar ocupação). Um **flash breve** na ocupação vista por outros é aceite; o estado observável final MUST ser «fora» em ≤5 s (SC-002). Não é obrigatório impedir qualquer milissegundo de presença (**clarificação 2026-09-06**).
- **FR-004**: Em caso de falha de join (áudio/sala), a UI MUST mostrar **feedback de erro por categoria** compreensível em português: pelo menos permissão de média, dispositivo indisponível/ocupado, falha de ligação (rede/sala), e um genérico para o resto. Falha isolada de câmera com join ok MUST usar o mesmo estilo de categorias para o aviso da câmera.
- **FR-005**: Em caso de falha de join, a UI MUST NOT apresentar o utilizador como estando em chamada activa (indicadores de sessão, «Sair» como se estivesse dentro, roster próprio como na mesa).
- **FR-006**: Após uma falha, o utilizador MUST poder **tentar de novo** o join sem reinício completo da aplicação.
- **FR-007**: O caminho feliz (join bem-sucedido) MUST continuar a marcar o utilizador como na chamada e a activar a UI de sessão como hoje.
- **FR-008**: O sistema MUST libertar recursos locais de média criados na tentativa falhada (tracks/sessão parcial), para não ficar a transmitir sem estar «na sala».

### Key Entities

- **Voice join attempt**: Tentativa de um utilizador entrar numa sala de voz/vídeo; termina em sucesso ou falha.
- **Call occupancy / «conectado»**: Estado de presença na mesa (visível a outros / a si); só válido após join bem-sucedido.
- **Join failure**: Erro no fluxo de join que impede ligação à sala ou áudio utilizável (microfone/permissões de áudio/ligação). Falha isolada de câmera **não** é join failure — é join com câmera off + aviso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos testes de falha forçada de **join** (áudio, permissão de áudio, ligação à sala), o utilizador **não** permanece na ocupação da sala após o tratamento do erro. Falha **só** de câmera com áudio ok: permanece na ocupação com câmera off.
- **SC-002**: Noutro cliente no mesmo servidor, em ≤5 s após a falha tratada, o utilizador que falhou **não** aparece como na chamada (roster/ocupação).
- **SC-003**: Em cada falha de join testada, o utilizador vê feedback de erro em ≤3 s após a falha.
- **SC-004**: Após uma falha, uma nova tentativa bem-sucedida coloca o utilizador na chamada normalmente (sem refresh completo da app).
- **SC-005**: No caminho feliz, o tempo até «conectado» e a ocupação observável não regridem face ao comportamento actual aceite (sem regressão funcional de join OK).

## Assumptions

- «Por qualquer motivo» / «qualquer monitor» no pedido = qualquer **motivo** de falha no fluxo de join (média, permissões, ligação à sala), não um produto de «monitorização» separado.
- O problema central é **ordenar** garantia de ligação antes de (ou **reverter** se falhar) o registo de «está na sala»; reverter com flash breve é aceite.
- Reutiliza APIs/eventos de ocupação e leave já existentes; não exige novo protocolo WS só para erros de join.
- Mensagens de erro em português, alinhadas ao resto da UI; **por categoria** (permissão / dispositivo / ligação / genérico), não uma única frase genérica nem dump técnico cru (**clarificação 2026-09-06**).
- Não muda a regra 028 de quem aparece na lista aninhada (mic/cam); apenas garante que quem **nunca ligou** (falha de áudio/sala) não conta como na mesa.
