# voice-session Specification

## Purpose

Permite entrar e permanecer numa chamada de voz/vídeo de um canal, controlar a própria transmissão (microfone, câmara, surdo, partilha de ecrã), ver quem mais está na chamada e o seu estado de fala, e gerir o estado de E2EE do canal de voz.

## Requirements

### Requirement: Pré-entrada com escolha de participação
O sistema SHALL entrar automaticamente numa chamada ao abrir um canal de voz acessível através de uma navegação ocorrida durante a sessão já aberta da aplicação (ex.: clicar num canal de voz), sem pré-entrada nem confirmação nesse caso. Quando o canal de voz já é a rota activa no primeiro carregamento da página — recarregar a página, reabrir uma aba restaurada pelo browser, ou abrir um link directo apontando para o canal — o sistema SHALL NOT entrar automaticamente; em vez disso SHALL mostrar um modal que exige uma acção explícita da pessoa (entrar ou recusar) antes de ligar ao canal. Quem pode falar, ao entrar (automaticamente ou após confirmação explícita), SHALL entrar em modo de fala com microfone conforme a preferência guardada (ligado por omissão) e câmara desligada independentemente da preferência de câmara guardada. Quem apenas pode ouvir SHALL entrar em escuta sem publicar microfone nem câmara. O acesso SHALL seguir o nível efectivo calculado pelo servidor, sem depender de cargo atribuído. «Testar vídeo» sintético SHALL NOT aparecer.

#### Scenario: Convidado sem cargo entra a falar
- **WHEN** um convidado sem cargo e com acesso para falar abre um canal de voz sem preferência de microfone guardada, navegando para ele durante a sessão já aberta
- **THEN** entra directamente com microfone ligado e câmara desligada

#### Scenario: Testar vídeo sem expor a câmara real
- **WHEN** um falante com preferência anterior de câmara ligada abre um canal de voz, navegando para ele durante a sessão já aberta
- **THEN** entra com câmara desligada e a opção «Testar vídeo» sintético não é oferecida; pode testar a câmara nas definições

#### Scenario: Utilizador só com permissão de ouvir
- **WHEN** uma pessoa com permissão apenas de ouvir abre um canal de voz, navegando para ele durante a sessão já aberta
- **THEN** entra directamente em escuta sem microfone ou câmara

#### Scenario: Cargo sem permissão de falar
- **WHEN** o cargo do utilizador não inclui falar ou o canal apenas permite ouvir, e a pessoa navega para o canal durante a sessão já aberta
- **THEN** entra directamente em modo de escuta sem publicar microfone ou câmara

#### Scenario: Falha de entrada
- **WHEN** o join automático, numa navegação dentro da sessão, falha
- **THEN** aparece o motivo, uma acção de tentar novamente e acesso às definições de dispositivos, sem nova tentativa automática

#### Scenario: Recarregar a página enquanto a rota já aponta para um canal de voz
- **WHEN** a pessoa estava numa chamada, fecha a aba/aplicação ou recarrega a página, e a URL restaurada no carregamento seguinte já aponta para esse canal de voz
- **THEN** a pessoa NÃO é reconectada automaticamente à chamada; vê um modal pedindo confirmação explícita, com as opções de entrar ou recusar, antes de qualquer ligação ao canal

#### Scenario: Link directo para um canal de voz
- **WHEN** a pessoa abre um link que aponta directamente para um canal de voz, sem a aplicação já estar aberta numa outra rota antes
- **THEN** a pessoa NÃO é conectada automaticamente à chamada; vê o mesmo modal de confirmação, com as opções de entrar ou recusar

#### Scenario: Confirmação explícita entra com as mesmas regras de permissão
- **WHEN** a pessoa escolhe entrar no modal de confirmação mostrado por carregamento de página ou link directo
- **THEN** a entrada segue exactamente as mesmas regras de modo (falar/escuta) e dispositivos (microfone conforme preferência, câmara sempre desligada) que a entrada automática por navegação dentro da sessão

#### Scenario: Recusar explicitamente a entrada
- **WHEN** a pessoa escolhe recusar no modal de confirmação, num servidor que tem pelo menos um canal de texto
- **THEN** a pessoa não liga à chamada e é levada para o primeiro canal de texto desse servidor

#### Scenario: Recusar num servidor sem canal de texto
- **WHEN** a pessoa escolhe recusar no modal de confirmação, num servidor sem nenhum canal de texto
- **THEN** a pessoa não liga à chamada e é levada para a vista do servidor, sem nenhum canal seleccionado

### Requirement: Controlos de chamada no painel do utilizador
O sistema SHALL apresentar os controlos de chamada (alternar microfone, alternar surdo/ouvir, alternar câmara, alternar partilha de ecrã quando aplicável, terminar chamada) exclusivamente no painel do utilizador, visíveis apenas enquanto uma chamada está activa — nunca sobrepostos ao palco de vídeo em si.

#### Scenario: Controlos aparecem só durante a chamada
- **WHEN** o utilizador não está em nenhuma chamada
- **THEN** os controlos de chamada não são apresentados no painel do utilizador

#### Scenario: Microfone desactivado para ouvintes
- **WHEN** o utilizador tem apenas permissão de ouvir no canal actual
- **THEN** o controlo de microfone aparece desactivado com uma explicação de que não tem permissão para falar

### Requirement: Blur de câmara em três níveis
O sistema SHALL permitir escolher entre Sem blur, Blur leve e Blur forte para a câmara local durante uma chamada activa, aplicando o efeito em tempo real, e SHALL apresentar uma mensagem de erro inline quando o ambiente não suportar o efeito.

#### Scenario: Aplicar blur forte
- **WHEN** o utilizador escolhe Blur forte durante uma chamada activa
- **THEN** a câmara local passa a mostrar o efeito imediatamente, sem reiniciar a ligação de vídeo

### Requirement: Indicadores de fala em tempo real
O sistema SHALL indicar visualmente, em qualquer lugar onde um participante apareça (vista Composição, vista Grade, roster de voz na sidebar), quando esse participante está a falar, actualizado a partir da detecção de nível de áudio do LiveKit.

#### Scenario: Indicador aparece e desaparece com a fala
- **WHEN** um participante começa e depois para de falar
- **THEN** o indicador visual de fala aparece e desaparece de forma consistente em todos os lugares onde esse participante é mostrado simultaneamente

### Requirement: Roster de voz na sidebar
O sistema SHALL apresentar, para cada canal de voz na sidebar, a lista de ocupantes actuais com avatar, handle, estado de microfone e destaque de fala, mesmo quando esse canal de voz não está aberto como a tela activa.

#### Scenario: Ver ocupantes sem abrir o canal
- **WHEN** há pessoas numa chamada de voz e o utilizador está a ver outro canal
- **THEN** a sidebar mostra a lista de ocupantes desse canal de voz, actualizada a partir do evento WS `voice.occupancy`

### Requirement: Estado de E2EE do canal de voz com faixa permanente e religar
O sistema SHALL apresentar um chip de estado E2EE no cabeçalho do canal de voz (ligada ou desligada), e quando desligada SHALL apresentar uma faixa de aviso permanente (não um alerta pontual) indicando quem a desligou e quando, com uma acção "Religar E2EE" disponível a quem tem a chave do canal, que exige fornecer essa chave antes de a religar.

#### Scenario: Faixa permanece visível enquanto desligada
- **WHEN** a E2EE de um canal de voz está desligada
- **THEN** a faixa de aviso permanece visível para todos os participantes durante toda a chamada, não apenas no momento em que foi desligada

#### Scenario: Religar exige a chave do canal
- **WHEN** um administrador com a chave do canal guardada tenta religar a E2EE
- **THEN** o sistema confirma a chave (localmente, se já presente no dispositivo, ou pedindo para a introduzir) antes de reactivar a E2EE

### Requirement: Nenhuma UI de gravação/egress
O sistema SHALL NOT apresentar nenhum botão, diálogo ou faixa relacionados com gravação de chamada ou exportação de cena via Egress — esse escopo está registado como funcionalidade futura em `docs/backlog/backlog.md` (item G1), não parte desta fase.

#### Scenario: Ausência confirmada
- **WHEN** um utilizador percorre o cabeçalho e os menus do canal de voz
- **THEN** em nenhum momento é apresentada uma opção de "Gravar" ou equivalente

### Requirement: Pré-entrada e roster fiéis aos mockups
O sistema SHALL preservar o roster de voz na sidebar e o acesso às definições de dispositivos fora da chamada. A checklist de fidelidade da pré-entrada do mockup SHALL deixar de se aplicar. Telemetria, codec, ruído neural, eco e AGC SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** há ocupantes num canal de voz que ainda não foi aberto
- **THEN** o roster na sidebar mostra quem já está no canal sem tela de pré-entrada

### Requirement: Paridade funcional da sessão de voz
O sistema SHALL manter as funcionalidades existentes desta área compatíveis com entrada directa: escuta para quem não pode falar, entrada só áudio se a câmara falhar quando ligada, libertação do hardware ao sair, mudança de canal, controlos de chamada, blur em três níveis, indicadores de fala, roster na sidebar, duração, E2EE desligada com faixa e Religar, saída por canal ou servidor apagado, e áudio remoto contínuo ao navegar. A pré-entrada, a entrada com câmara ligada e «Testar vídeo» sintético deixam de ser requisitos de paridade.

#### Scenario: Funcionalidades existentes
- **WHEN** os itens ainda aplicáveis de `docs/v2/parity-checklist.md` são exercidos
- **THEN** produzem os resultados documentados para a entrada directa

### Requirement: Desligar a câmara liberta a câmara
O sistema SHALL, quando o utilizador desliga a câmara (controlo da chamada ou teste da página de Áudio & Vídeo), parar a captura da câmara física, parar o processamento de vídeo associado (incluindo o desfoque) e deixar de enviar vídeo aos outros participantes. Ao voltar a ligar a câmara, o sistema SHALL retomar o desfoque escolhido sem reiniciar a chamada. Nenhuma faixa de captura de vídeo SHALL ficar ativa depois de a câmara ser desligada.

#### Scenario: Desligar a câmara na chamada com desfoque
- **WHEN** o utilizador está numa chamada com Blur forte e carrega em desligar a câmara
- **THEN** o indicador da câmara do navegador apaga-se, não resta nenhuma faixa de captura de vídeo ativa e os outros participantes veem o avatar em vez do vídeo, sem imagem congelada

#### Scenario: Desligar a câmara sem desfoque
- **WHEN** o utilizador está numa chamada com Sem blur e desliga a câmara
- **THEN** o mesmo: câmara física libertada e nenhum vídeo enviado

#### Scenario: Voltar a ligar
- **WHEN** o utilizador volta a ligar a câmara depois de a desligar
- **THEN** o vídeo volta, com o desfoque escolhido aplicado, sem reentrar na chamada

#### Scenario: Pré-entrada e página de Áudio & Vídeo
- **WHEN** o utilizador para o teste de câmara nas definições, com desfoque ativo
- **THEN** a câmara física é libertada e a pré-visualização fica vazia

#### Scenario: Sair da chamada
- **WHEN** o utilizador sai da chamada com a câmara ligada
- **THEN** nenhuma faixa de captura de vídeo fica ativa

### Requirement: A entrada numa chamada actualiza o canal na hora

Quando uma pessoa entra num canal de voz ou vídeo, ou muda o estado da câmara, do microfone ou da partilha de ecrã, o sistema SHALL actualizar nesse momento todos os clientes que já têm esse canal aberto. A actualização SHALL incluir quem está na chamada, o estado de câmara, microfone e partilha, e o início da sessão. SHALL acontecer sem recarregar a página e sem sair do canal e voltar. Quem já está na chamada SHALL ver a pessoa no palco, e o vídeo assim que a faixa estiver disponível, sem sair e voltar a entrar. Um resultado de ocupação pedido antes desta entrada SHALL NOT substituir o estado mais recente.

#### Scenario: Quem está no canal vê a entrada

- **WHEN** uma pessoa entra na chamada de um canal de voz e outra pessoa já tem esse canal aberto, fora da chamada
- **THEN** a lista de quem está na chamada e o indicador de chamada activa passam a incluir a pessoa que entrou, sem refresh e sem mudar de canal

#### Scenario: A câmara aparece sem sair do ecrã

- **WHEN** uma pessoa que já está na chamada liga a câmara
- **THEN** os outros clientes com esse canal aberto passam a mostrar a câmara ligada, e quem está no palco passa a ver o vídeo, sem sair da chamada

#### Scenario: Um pedido antigo não apaga a entrada

- **WHEN** a resposta de um pedido de ocupação iniciado antes da entrada chega depois do aviso em tempo real
- **THEN** a pessoa que entrou continua visível nos ecrãs que já estavam abertos
