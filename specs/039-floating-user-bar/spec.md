# Feature Specification: Barra de Usuário Flutuante

**Feature Branch**: `039-floating-user-bar`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Criar uma nova caixa flutuante, ancorada no canto inferior da barra de navegação (mesmo modelo do Discord), mostrando ícone/nome do usuário, com opções de microfone (mutar/desmutar), deafen (on/off) e configurações. Os controles de chamada (câmera on/off, microfone on/off, sair da chamada) passam a viver aqui quando o usuário está conectado a um canal de voz; enquanto não estiver em chamada, esses campos ficam desabilitados. É também o ponto de entrada para trocar o ícone de perfil e, no futuro, todas as configurações do usuário."

**Depends on**: navegação lateral (Sidebar); sessão de chamada partilhada ([028](../028-voice-call-roster/)); controlos do palco ([036](../036-mic-ctrl-speaking-aura/)); coexistência com barra ligada e PiP ([038](../038-floating-voice-pip/)).

## Clarifications

### Session 2026-09-06

- Q: Onde ficam os controlos de chamada (palco vs barra de utilizador)? → A: Se o jogador está a ver o palco, os comandos ficam no palco; se sai para um canal de texto (ou outra vista fora do palco), os comandos movem-se para a barra de utilizador (um sítio de cada vez, não duplicados).
- Q: Barra de utilizador enquanto se vê o palco? → A: Em chamada no palco, ocultar o grupo de controlos de chamada na barra (só avatar/nome/definições); mostrar controlos na barra só fora do palco (ou desabilitados se não houver chamada).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identidade e conta sempre visíveis e no mesmo lugar (Priority: P1)

Como usuária da Mesa, quero ver meu avatar, meu nome de usuário e um acesso rápido às minhas opções de conta sempre no mesmo lugar (canto inferior da navegação lateral), em qualquer tela da aplicação, para não precisar procurar esse controle em lugares diferentes.

**Why this priority**: É a base estrutural de toda a feature — sem esse painel persistente não há onde os demais controles (microfone, deafen, chamada) possam viver. Também elimina a duplicidade atual de ter um ponto de conta no topo da tela.

**Independent Test**: Navegar por pelo menos três telas diferentes da aplicação (um canal de texto, um canal de voz, a tela de convite/servidor) e confirmar que o mesmo painel com avatar e nome de usuário aparece sempre na mesma posição, e que clicar nele abre as opções de conta (incluindo trocar a foto de perfil).

**Acceptance Scenarios**:

1. **Given** a usuária está autenticada, **When** ela visualiza qualquer tela da aplicação, **Then** um painel fixo no canto inferior da navegação lateral mostra seu avatar (com indicação de que está online) e seu nome de usuário.
2. **Given** a usuária clica no avatar ou nome de usuário nesse painel, **When** o clique acontece, **Then** abre-se um menu/painel de conta onde ela pode trocar sua foto de perfil e encerrar sessão.
3. **Given** a usuária muda de servidor ou de canal, **When** a navegação ocorre, **Then** o painel de usuário permanece visível e não é recriado/piscado — ele é parte fixa do layout, não do conteúdo da página.
4. **Given** o ponto de acesso à conta que hoje existe no topo da tela, **When** esta feature está implementada, **Then** esse ponto de acesso duplicado deixa de existir — só há um lugar para acessar a conta.

---

### User Story 2 - Mutar microfone e ensurdecer (deafen) fora do palco (Priority: P2)

Como usuária em uma chamada de voz que **não** está a ver o palco (ex.: canal de texto), quero poder mutar meu microfone ou ensurdecer (parar de ouvir os outros) a partir da barra de utilizador, sem precisar voltar para a tela do canal de voz.

**Why this priority**: É a ação mais frequente durante uma chamada (mutar rapidamente) e hoje só é possível a partir da própria tela do canal de voz — trazer isso para a barra quando se sai do palco resolve fricção real.

**Independent Test**: Entrar em uma chamada de voz, navegar para um canal de texto diferente e, sem voltar ao canal de voz, mutar o microfone e activar o deafen a partir da barra; confirmar o efeito na chamada. Voltar ao palco e confirmar que os controlos estão no palco (não duplicados na barra).

**Acceptance Scenarios**:

1. **Given** a usuária está conectada a um canal de voz e **não** está a ver o palco dessa chamada, **When** ela clica no controle de microfone da barra de utilizador, **Then** seu microfone muta/desmuta, com o mesmo efeito do controle de microfone do palco.
2. **Given** a usuária está conectada e fora do palco, **When** ela clica no controle de deafen da barra, **Then** ela para de ouvir os demais participantes, e o controle indica visualmente esse estado.
3. **Given** a usuária activa o deafen, **When** o deafen é activado, **Then** o microfone também é mutado automaticamente (não é possível ouvir ninguém e continuar a transmitir sem perceber).
4. **Given** a usuária está com deafen activo e o microfone mutado por causa disso, **When** ela clica para desmutar o microfone, **Then** o deafen é desactivado automaticamente junto com o desmutar.
5. **Given** a usuária não está conectada a nenhum canal de voz, **When** ela olha para os controlos de microfone e deafen na barra, **Then** eles aparecem visivelmente desabilitados e não produzem efeito.
6. **Given** a usuária está na chamada e a ver o palco, **When** olha a barra de utilizador, **Then** o grupo de controlos de chamada está **oculto** na barra; microfone/deafen activos estão no palco.

---

### User Story 3 - Câmara e sair: no palco ou na barra conforme a vista (Priority: P3)

Como usuária em uma chamada de voz/vídeo, quero ligar/desligar a câmara e sair da chamada no **mesmo sítio onde estão os outros controlos da chamada**: no palco enquanto o vejo; na barra de utilizador quando estou noutro sítio (ex.: texto).

**Why this priority**: Completa o modelo «mover controlos» com câmara, desfoque e sair.

**Independent Test**: Em chamada com câmara no palco → controlos no palco; abrir texto → controlos (incl. câmara e sair) na barra; sair pela barra; voltar a entrar e confirmar no palco outra vez.

**Acceptance Scenarios**:

1. **Given** a usuária está na chamada **e** a ver o palco, **When** usa câmara / desfoque / sair, **Then** esses controlos estão no **palco** (comportamento actual do palco, incluindo desfoque).
2. **Given** a usuária está na chamada e abriu um **canal de texto** (ou outra vista ≠ palco da chamada), **When** usa câmara / sair na **barra de utilizador**, **Then** o efeito é o mesmo que no palco; o desfoque permanece acessível junto do controlo de câmara **nesse** sítio activo.
3. **Given** a usuária está na chamada e a ver o palco, **When** olha a barra de utilizador, **Then** o grupo de controlos de chamada está **oculto** na barra (só identidade/definições); os controlos activos estão no palco.
4. **Given** a usuária não está em chamada, **When** olha a barra, **Then** controlos de câmara e sair aparecem desabilitados.
5. **Given** a chamada termina por qualquer meio, **When** isso acontece, **Then** a barra volta ao estado fora de chamada (controlos desabilitados, visíveis) sem recarregar a página.

---

### Edge Cases

- Controlo desabilitado (fora de chamada) na barra: clique não faz nada — sem erro, sem rede.
- Em chamada noutro servidor/canal visualizado: a barra (quando é o sítio activo dos controlos) reflecte a chamada activa, não o canal só visualizado.
- Telas estreitas: barra de utilizador acessível de forma consistente com o resto da navegação.
- Desfoque de câmara: viaja com o controlo de câmara — no palco quando se vê o palco; na barra quando os controlos se movem para a barra.
- Queda de ligação: barra e palco voltam a estado fora de chamada assim que a desconexão for detectada.
- Botão de configurações sem ecrã dedicado: destino funcional temporário (menu de conta) — ver Assumptions.
- Transição palco ↔ texto: os controlos de chamada MUST aparecer num único sítio activo de cada vez (palco **ou** barra), sem duplicar acções activas nos dois.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um painel fixo, ancorado ao canto inferior da coluna de navegação lateral, visível em toda tela autenticada da aplicação (não apenas na tela do canal de voz).
- **FR-002**: O painel DEVE mostrar o avatar da usuária autenticada com um indicador visual de status online, e seu nome de usuário.
- **FR-003**: Clicar na área de avatar/nome do painel DEVE abrir o menu de conta já existente (trocar foto de perfil, encerrar sessão).
- **FR-004**: O ponto de acesso à conta atualmente existente fora deste painel DEVE ser removido, de modo que só exista um lugar para acessar as opções de conta.
- **FR-005**: A barra de utilizador DEVE incluir controlos de microfone e deafen; quando a usuária está em chamada e **fora** do palco da chamada activa, esses controlos DEVEM estar activos na barra.
- **FR-006**: O controlo de deafen DEVE activar/desactivar a escuta dos demais participantes; o estado DEVE ser visível.
- **FR-007**: Activar o deafen DEVE mutar o microfone junto; desmutar o microfone enquanto o deafen está activo DEVE desactivar o deafen junto.
- **FR-008**: A barra DEVE incluir controlo de câmara (ligar/desligar, com acesso ao desfoque) e controlo para sair da chamada, activos quando a usuária está em chamada e **fora** do palco.
- **FR-009**: Quando a usuária **não** está em chamada, os controlos de microfone, deafen, câmara e sair na barra DEVEM aparecer visivelmente desabilitados e não produzir efeito.
- **FR-010**: Quando a usuária está em chamada **e a ver o palco** da chamada activa, os controlos de chamada (microfone, deafen, câmara/desfoque, sair) DEVEM estar no **palco**; a barra de utilizador DEVE **ocultar** o grupo de controlos de chamada (permanecem avatar, nome e definições/conta) — sem botões de chamada activos nem desabilitados visíveis nesse modo.
- **FR-011**: Quando a usuária está em chamada e navega para texto (ou outra vista ≠ palco da chamada activa), os controlos de chamada DEVEM **aparecer** na barra de utilizador (habilitados, reflectindo o estado real); o palco deixa de ser o sítio desses controlos enquanto não se voltar ao palco.
- **FR-012**: Seja no palco ou na barra, os controlos DEVEM partilhar o mesmo estado de chamada (sem divergência).
- **FR-013**: O desfoque de câmara DEVE permanecer acessível junto do controlo de câmara no sítio activo (palco ou barra).
- **FR-014**: NÃO se remove permanentemente a faixa de controlos do palco: ela permanece quando se está a ver o palco; a consolidação na barra aplica-se só fora do palco.
- **FR-015**: O painel DEVE incluir um ponto de acesso a configurações da usuária, preparado para receber futuras opções de configuração além das já cobertas por este painel.
- **FR-016**: O painel DEVE permanecer acessível em larguras de tela estreitas (celular), de forma consistente com o restante da navegação nessa condição.
- **FR-017**: Assim que a chamada termina (painel, palco, ou queda), a barra DEVE voltar ao estado fora de chamada (controlos desabilitados) sem recarregar a página.

### Key Entities

- **Painel de usuário**: elemento fixo de navegação com identidade (avatar, nome, status online), configurações/conta, e — quando activos — controlos de chamada.
- **Sítio activo dos controlos de chamada**: ou o **palco** (vista do canal de voz da chamada activa) ou a **barra de utilizador** (em chamada mas fora desse palco); nunca os dois com acções activas em simultâneo.
- **Estado de chamada da usuária**: conectada ou não; microfone, câmara, deafen — partilhado entre palco e barra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Fora do palco, a usuária muta/desmuta o microfone pela barra em um único clique, sem voltar ao canal de voz.
- **SC-002**: Fora do palco, a usuária sai da chamada pela barra em um único clique.
- **SC-003**: 100% das telas autenticadas mostram o painel de utilizador na mesma posição.
- **SC-004**: Zero pontos de acesso duplicados às opções de conta após a mudança.
- **SC-005**: Em teste informal, ≥90% identificam controlos inactivos na barra quando não há chamada.
- **SC-006**: Zero regressão percebida na chamada no palco (entrar, mutar, câmara, desfoque, sair) quando se está a ver o palco.
- **SC-007**: Em 5 de 5 transições palco → texto → palco, os controlos aparecem só no sítio activo esperado (sem duplicados activos).

## Assumptions

- **Botão de configurações**: abre o mesmo menu de conta (foto, encerrar sessão) até existir ecrã de configurações dedicado.
- **Comportamento de deafen**: modelo Discord (deafen muta mic; desmutar mic tira deafen).
- **Deafen no palco**: quando o sítio activo é o palco, o deafen DEVE estar disponível no palco junto dos outros controlos de chamada (mesmo conjunto que se move para a barra).
- **Barra «voltar à mesa»**: permanece; coexistência com a barra de utilizador pode ser afinada depois; não bloqueante.
- **Barra fora de chamada**: botões de chamada visíveis e desabilitados (estabilidade de layout).
- **Barra em chamada no palco**: grupo de chamada **oculto**; só identidade + definições.
- **PiP (038)**: coexiste; esta feature não altera o PiP.
- **Indicador online**: só «online» nesta entrega.
