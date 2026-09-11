# Feature Specification: Compartilhamento de tela no canal de voz

**Feature Branch**: `082-screen-share`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: PRD em `docs/screen-share.md` (actualizado por clarificações) — partilha de ecrã no canal de voz/vídeo existente; múltiplos shares simultâneos; iniciar/parar e ver tiles só em Grade; Composição sem tiles de ecrã (áudio da partilha continua); sem troca automática de modo nem restauro de cena; indicadores de partilha no controlo Grade e no item do canal; destaque local e prioridade visual das telas em grade.

**Problem**: Mestres e jogadores precisam mostrar conteúdo de ecrã (ficha, mapa, regras, iniciativa) durante a sessão. Sem isso, dependem de ferramentas externas, o que contraria o objectivo do Mesa de unificar chat + vídeo + composição numa única aplicação.

## Clarifications

### Session 2026-09-09

- Q: Se alguém muda o layout (modo/cena) manualmente enquanto há partilha(s) activa(s), o que acontece ao restauro automático no fim das partilhas? → A: *(superseded)* Restauro automático removido do produto; ver clarificações posteriores.
- Q: Em modo grade, quem pode ser alvo de «destacar transmissão»? → A: Só participantes com partilha de ecrã activa.
- Q: O partilhador vê a própria tela na grade? → A: Sim — aparece na grade como para os outros participantes.
- Q: O que acontece à câmara ao iniciar/parar partilha de ecrã? → A: Independentes — partilhar ecrã não altera o estado da câmara.
- Q: O que «continuar a ver a composição» mostra localmente? → A: *(superseded)* Opt-out local «ver composição» / cena pré-partilha removidos do produto.
- Q: Onde são visíveis as telas partilhadas? → A: Só em modo Grade; em Composição o painel mostra apenas câmaras (não tiles de ecrã).
- Q: Restauro / fallback de cena ao parar partilhas? → A: Removido — start/stop de partilha NÃO muda o modo nem restaura cena.
- Q: Como indicar que há partilha activa? → A: Indicador no controlo «Grade» do header do painel de voz e no item do canal de voz na sidebar.
- Q: Ao iniciar partilha, o modo do canal muda automaticamente? → A: Não — o modo não muda sozinho; ver telas exige estar em Grade; indicadores avisam.
- Q: O controlo de iniciar/parar partilha está disponível em que modo? → A: Só em Grade — em Composição o controlo de partilha não está disponível.
- Q: Em Composição, ouve-se o áudio da partilha de ecrã? → A: Sim — o áudio continua; só os tiles de ecrã ficam ocultos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Partilhar o ecrã na chamada (Priority: P1)

Como participante num canal de voz, quero **iniciar e parar o compartilhamento do meu ecrã** (e, quando o sistema o permitir, o áudio do sistema/aba), para que os outros vejam o que estou a mostrar sem sair do Mesa.

**Why this priority**: É o valor central da feature; sem captura e publicação não há produto.

**Independent Test**: Entrar numa chamada; iniciar partilha; em Grade, confirmar que os outros vêem a tela; parar a partilha e confirmar que deixa de ser visível.

**Acceptance Scenarios**:

1. **Given** estou ligado a um canal de voz **em modo Grade**, **When** inicio o compartilhamento de ecrã e o sistema concede a permissão de captura, **Then** a minha tela passa a ser publicada na chamada e fica disponível para quem está em modo Grade.
2. **Given** estou a partilhar o ecrã, **When** paro o compartilhamento (pelo controlo do produto ou pelo indicador nativo do sistema), **Then** a minha tela deixa de ser publicada e os outros deixam de a ver na Grade.
3. **Given** o browser/sistema permite captura de áudio do sistema ou da aba, **When** inicio a partilha com essa opção, **Then** o áudio do conteúdo partilhado também é ouvido pelos outros (quando suportado); se não for suportado, a partilha de vídeo da tela continua a funcionar.
4. **Given** já estou a partilhar, **When** peço iniciar partilha outra vez, **Then** o pedido não gera erro (é idempotente do ponto de vista do estado do canal).
5. **Given** não estou a partilhar, **When** peço parar partilha, **Then** o pedido não gera erro.
6. **Given** inicio a partilha com sucesso e estou em Grade, **When** vejo a grade, **Then** a minha própria tela partilhada também aparece na grade (como para os outros em Grade).
7. **Given** a minha câmara está ligada (ou desligada), **When** inicio ou paro a partilha de ecrã, **Then** o estado da câmara **não** muda por causa da partilha.
8. **Given** inicio ou paro uma partilha, **When** o estado do canal actualiza, **Then** o modo Grade/Composição do canal **não** muda automaticamente.
9. **Given** estou em modo Composição, **When** procuro o controlo de iniciar/parar partilha de ecrã, **Then** esse controlo **não** está disponível (só em Grade).

---

### User Story 2 - Vários participantes a partilhar ao mesmo tempo (Priority: P1)

Como participante, quero que **mais do que uma pessoa possa partilhar ecrã em simultâneo**, sem fila nem bloqueio, para que vários conteúdos (mapa + ficha, etc.) possam coexistir na mesma chamada.

**Why this priority**: Regra de produto explícita no PRD; define o modelo de layout e de estado do canal.

**Independent Test**: Dois participantes iniciam partilha; ambos aparecem activos; um para e o outro continua.

**Acceptance Scenarios**:

1. **Given** o participante A já está a partilhar, **When** o participante B inicia partilha, **Then** o canal passa a ter A e B como partilhadores activos e ambos os ecrãs são visíveis em Grade (conforme regras de layout).
2. **Given** A e B estão a partilhar, **When** A para, **Then** B continua a partilhar e o canal não trata o encerramento parcial como «fim de todos os shares».
3. **Given** vários partilhadores activos, **When** consulto o estado do canal, **Then** vejo o conjunto completo de quem está a partilhar (não só o «último»).

---

### User Story 3 - Telas só na Grade; Composição só câmaras; sem troca automática (Priority: P1)

Como participante, quero que as **telas partilhadas só apareçam no modo Grade**, e que no modo **Composição** continue a ver apenas a composição/câmaras (sem tiles de ecrã), **sem** o produto forçar troca de modo nem restaurar cena quando as partilhas começam ou acabam.

**Why this priority**: Mantém a composição intacta; quem quer ver a partilha muda para Grade (avisado pelos indicadores).

**Independent Test**: Em Composição com A a partilhar → sem tiles de ecrã; mudar para Grade → ver tela de A; parar partilha → modo permanece o escolhido.

**Acceptance Scenarios**:

1. **Given** estou em modo Grade e há ≥1 partilha activa, **When** vejo o painel de voz, **Then** vejo as telas partilhadas (com prioridade visual sobre câmaras).
2. **Given** estou em modo Composição e há ≥1 partilha activa, **When** vejo o painel de voz, **Then** **não** vejo tiles de ecrã partilhado — apenas a composição/câmaras conforme o modo Composição — **e** continuo a ouvir o áudio da partilha quando existir e for suportado.
3. **Given** o canal está em Composição (ou Grade), **When** o primeiro ou o último partilhador inicia/para, **Then** o modo do canal **não** muda automaticamente e **não** há restauro de cena pré-partilha.
4. **Given** estou em Composição com partilha activa, **When** mudo manualmente para Grade, **Then** passo a ver as telas partilhadas.
5. **Given** estou em Grade com partilha activa, **When** mudo manualmente para Composição, **Then** deixo de ver tiles de ecrã e volto à vista de composição/câmaras; se eu era o partilhador, a partilha **continua** publicada até eu parar (pelo SO ou ao voltar a Grade e usar o controlo).

---

### User Story 4 - Indicadores de partilha activa (Priority: P1)

Como participante (na chamada ou a olhar a lista de canais), quero **ver um indicador** no controlo **Grade** do header do painel de voz e no **item do canal** na sidebar quando alguém está a partilhar ecrã, para saber que há conteúdo a ver na Grade sem o produto me forçar a mudar de modo.

**Why this priority**: Substitui a troca automática de layout como sinal de que há partilha.

**Independent Test**: A inicia partilha → indicadores no Grade e no canal; último share para → indicadores desaparecem.

**Acceptance Scenarios**:

1. **Given** ninguém partilha, **When** vejo o controlo Grade e o item do canal, **Then** não há indicador de partilha activa.
2. **Given** pelo menos um participante inicia partilha, **When** o estado actualiza, **Then** o controlo Grade no header do painel de voz e o item desse canal na sidebar mostram um indicador de partilha activa.
3. **Given** há indicadores activos, **When** o último partilhador para, **Then** ambos os indicadores deixam de mostrar partilha activa.
4. **Given** há partilha activa e estou noutro canal ou em Composição, **When** vejo o item do canal na sidebar, **Then** o indicador nesse item continua visível (descoberta sem abrir a Grade).

---

### User Story 5 - Destacar uma transmissão localmente em grade (Priority: P2)

Como participante em **modo grade** com uma ou mais telas partilhadas, quero **destacar localmente** a tela partilhada de um participante que está a partilhar (ampliar essa tela e reduzir câmaras e outras telas), sem afectar os outros; se essa pessoa deixar de partilhar, o destaque limpa-se sozinho (volta ao grid equilibrado). Participantes só com câmara **não** são alvos de destaque nesta feature.

**Why this priority**: Melhora legibilidade quando há várias telas; é preferência puramente local.

**Independent Test**: Com A e B a partilhar, destacar A; só o meu layout muda; A para → volto ao grid equilibrado; tentar destacar quem só tem câmara não está disponível.

**Acceptance Scenarios**:

1. **Given** estou em modo grade com partilhas activas, **When** destaco a transmissão do participante A (que está a partilhar ecrã), **Then** vejo a tela de A em destaque e as outras telas/câmaras com menos ênfase — só no meu cliente.
2. **Given** tenho A em destaque, **When** A deixa de partilhar, **Then** o destaque local limpa-se (`null`) e volto ao arranjo equilibrado; o produto **não** escolhe automaticamente outra pessoa para destacar.
3. **Given** não estou em modo grade, **When** procuro o controlo de destacar transmissão, **Then** não está disponível (só em grade).
4. **Given** estou em modo grade e o participante C só publica câmara (sem partilha de ecrã), **When** procuro destacar C, **Then** C **não** é um alvo válido de destaque.

---

### User Story 6 - Prioridade visual das telas na grade (Priority: P2)

Como participante a ver a grade com partilhas activas, quero que as **telas partilhadas tenham prioridade visual** sobre as câmaras (mais área; câmaras numa fileira secundária), e que várias telas sem destaque local partilhem o espaço de forma equilibrada.

**Why this priority**: Torna o conteúdo partilhado legível (texto, mapas) sem esconder quem está na chamada.

**Independent Test**: Uma partilha + várias câmaras → tela dominante; duas partilhas sem destaque → espaço semelhante entre telas; câmaras secundárias.

**Acceptance Scenarios**:

1. **Given** há pelo menos uma tela partilhada e câmaras activas, **When** vejo a grade (sem destaque local), **Then** as telas ocupam área maior que as câmaras.
2. **Given** há várias telas activas e nenhum destaque local, **When** vejo a grade, **Then** o espaço entre as telas é dividido de forma equilibrada.
3. **Given** há câmaras com partilhas activas, **When** vejo a grade, **Then** as câmaras permanecem visíveis numa posição secundária (não competem em igualdade com as telas).

---

### Edge Cases

- Utilizador cancela o diálogo nativo de escolha de ecrã/janela/aba: a partilha **não** inicia e o estado do canal **não** inclui esse participante como partilhador.
- Partilha termina inesperadamente (fecho da janela partilhada, revogação pelo SO, desconexão): o participante é removido do conjunto activo; o modo do canal **não** muda; indicadores actualizam-se.
- Participante sai da chamada enquanto partilha: deixa de constar no conjunto de partilhas activas; modo inalterado; se for o último, indicadores limpam-se.
- Idempotência: start já activo / stop já inactivo não são erros.
- Muitos partilhadores simultâneos (ex. 4+): o MVP mantém divisão equilibrada em Grade; refinamentos visuais posteriores são aceitáveis sem bloquear o lançamento.
- Start/stop de partilha **nunca** altera o modo Grade/Composição nem restaura cena.
- Em Composição com partilhas activas: sem tiles de ecrã e sem controlo de iniciar partilha; indicadores permanecem; partilha já activa não pára só por mudar de modo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Qualquer participante ligado a um canal de voz MUST poder iniciar e parar o compartilhamento do seu ecrã **quando está em modo Grade** (MVP sem restrição «só mestre»). Em modo Composição, o controlo de partilha MUST NÃO estar disponível.
- **FR-002**: A partilha MUST publicar a tela como conteúdo de vídeo adicional do participante na mesma chamada de voz existente (não cria um tipo de canal novo). Em modo Grade, o partilhador MUST também ver a própria tela na grade (mesma prioridade visual que as outras telas). O estado da câmara MUST ser independente da partilha de ecrã (iniciar/parar partilha NÃO MUST ligar nem desligar a câmara). Mudar de Grade para Composição MUST NÃO parar automaticamente uma partilha já activa.
- **FR-003**: Quando o ambiente o permitir, a partilha MUST poder incluir áudio do sistema/aba; se não permitir, a partilha de vídeo da tela MUST continuar disponível. Em modo Composição, o áudio da partilha MUST continuar a ser reproduzido (quando existir); apenas os tiles de vídeo de ecrã ficam ocultos.
- **FR-004**: A qualidade da captura da tela MUST privilegiar nitidez/legibilidade de detalhe (texto, mapas) em detrimento de fluidez de movimento, quando o produto puder influenciar essa prioridade.
- **FR-005**: Múltiplos participantes MUST poder partilhar ecrã em simultâneo; NÃO MUST existir exclusividade, fila ou bloqueio mútuo.
- **FR-006**: O canal MUST manter um estado canónico (servidor) com o conjunto completo dos participantes que estão a partilhar ecrã no momento (0..N).
- **FR-007**: Operações de «iniciar partilha» e «parar partilha» no estado canónico MUST ser idempotentes.
- **FR-008**: O modo de visualização Grade | Composição continua a ser controlado pelos mecanismos já existentes do produto; start/stop de partilha MUST NÃO alterar esse modo automaticamente.
- **FR-009**: O produto MUST NÃO guardar nem restaurar «cena pré-partilha»; NÃO MUST existir fallback de layout ao fim das partilhas.
- **FR-010**: Telas partilhadas MUST ser renderizadas **apenas** em modo Grade. Em modo Composição, o painel MUST mostrar a composição/câmaras e MUST NÃO mostrar tiles de ecrã partilhado (sem cortar o áudio da partilha — ver FR-003).
- **FR-011**: Controlos existentes de troca manual Grade/Composição (e cena) MUST permanecer utilizáveis durante partilhas (não bloqueados).
- **FR-012**: Enquanto houver ≥1 partilha activa, o produto MUST mostrar um indicador de partilha no controlo **Grade** do header do painel de voz e no **item do canal** correspondente na sidebar; com 0 partilhas, esses indicadores MUST estar ausentes/inactivos.
- **FR-013**: *(removido)* Preferência local «seguir layout / ver composição» e override associado — fora de escopo.
- **FR-014**: *(removido)* Reset de override local por mudança de layout — fora de escopo.
- **FR-015**: Em modo grade, cada cliente MUST poder destacar localmente a tela partilhada de um participante que está no conjunto de partilhas activas; participantes sem partilha de ecrã NÃO MUST ser alvos de destaque; o destaque NÃO MUST ser propagado.
- **FR-016**: Se o participante destacado deixar de partilhar, o destaque local MUST limpar-se automaticamente; NÃO MUST saltar para outra pessoa.
- **FR-017**: Em grade com partilhas, telas MUST ter prioridade visual sobre câmaras; várias telas sem destaque MUST partilhar espaço de forma equilibrada; câmaras MUST ficar em posição secundária mas visíveis.
- **FR-018**: Todos os clientes MUST ser notificados quando o conjunto de partilhadores activos muda, com um **snapshot completo** do conjunto (não apenas um delta opaco), para actualizar tiles (em Grade) e indicadores.
- **FR-019**: A feature MUST NÃO incluir gravação/composição de egress, anotações sobre a tela, curadoria de UI além do seletor nativo de ecrã/janela/aba, nem permissões granulares de «quem pode partilhar».
- **FR-020**: A feature MUST NÃO incluir troca automática de modo por screen share, restauro de cena pós-partilha, nem opt-out local «continuar a ver a composição».

### Key Entities

- **Conjunto de partilhas activas**: lista canónica de participantes a partilhar ecrã num canal de voz (0..N); fonte de verdade no servidor; alimenta tiles em Grade e indicadores.
- **Modo de vista do canal**: Grade ou Composição — escolhido pelos controlos existentes; independente do conjunto de partilhas.
- **Indicador de partilha**: sinal visual no controlo Grade (header do painel de voz) e no item do canal na sidebar enquanto o conjunto de partilhas não está vazio.
- **Preferência de vista local**: por cliente — apenas destaque local de um partilhador de ecrã em Grade; não é sincronizada.
- **Participante em chamada**: utilizador ligado ao canal de voz que pode publicar tela adicional além de microfone/câmara; câmara e partilha de ecrã são controlos independentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 2+ participantes em Grade, um utilizador completa «iniciar partilha → outros vêem a tela → parar partilha» em menos de 1 minuto após estar na chamada (excluindo tempo de permissões do SO).
- **SC-002**: Em 100% dos cenários de aceite desta spec (multi-share, Grade vs Composição, indicadores, destaque local, sem auto-modo/restauro), o comportamento observado coincide com o especificado.
- **SC-003**: Com 2 partilhadores simultâneos, ambos os ecrãs permanecem visíveis na Grade para quem está em Grade, sem um bloquear o outro.
- **SC-004**: Com partilha activa, ≥95% dos clientes em Composição **não** mostram tiles de ecrã; ao mudarem para Grade, passam a vê-los sem intervenção do partilhador.
- **SC-005**: Com ≥1 partilha activa, o indicador aparece no controlo Grade e no item do canal; com 0 partilhas, ambos estão limpos (verificado com 2+ clientes).
- **SC-006**: Destacar uma transmissão localmente não altera a vista de nenhum outro participante (verificado com 2+ clientes).
- **SC-007**: Utilizadores de sessão de RPG conseguem partilhar ficha/mapa/regras **sem** recorrer a uma ferramenta externa de vídeo para esse fim, na chamada Mesa.

## Assumptions

- A feature reutiliza o canal de voz/vídeo e a infra-estrutura de media já existentes; não introduz um tipo de canal «screen share».
- No MVP, qualquer participante da chamada pode partilhar; permissões por papel ficam para depois.
- O diálogo nativo do sistema/browser para escolher ecrã, janela ou aba é suficiente; não há curadoria adicional de UI.
- Gravação (egress), anotações e limite artificial de N partilhas simultâneas estão fora de escopo nesta fase.
- Antes ou durante a implementação, deve validar-se (spike) que a cifragem ponta-a-ponta já aplicada a pistas de media da chamada também cobre a pista de ecrã; se não cobrir, a implementação deve estender a cifragem à partilha de ecrã antes de considerar a feature completa em canais cifrados.
- Controlo de iniciar/parar partilha vive nos controlos de media da chamada **em modo Grade**; em Composição o controlo não aparece; câmara e partilha são independentes.
- Forma visual exacta do indicador (ícone, ponto, contagem) pode ser definida no plano/UI; o requisito é presença/ausência correcta nos dois sítios.
- Comportamento com 4+ partilhas simultâneas pode ser visualmente apertado no MVP; aceitável se as regras de prioridade e equilíbrio forem respeitadas.
- Fonte de requisitos: `docs/screen-share.md` (PRD) + clarificações nesta spec; em conflito, prevalece esta spec.
