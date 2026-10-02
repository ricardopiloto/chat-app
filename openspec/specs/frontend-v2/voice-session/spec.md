# voice-session Specification

## Purpose

Permite entrar e permanecer numa chamada de voz/vídeo de um canal, controlar a própria transmissão (microfone, câmara, surdo, partilha de ecrã), ver quem mais está na chamada e o seu estado de fala, e gerir o estado de E2EE do canal de voz.

## Requirements

### Requirement: Pré-entrada com escolha de participação
O sistema SHALL apresentar, antes de entrar numa chamada, uma pré-visualização (câmara real quando o utilizador a liga, com selector de blur, alternadores de câmara e microfone e medidor de nível do microfone), a lista de quem está no canal e três acções: "Entrar" (com câmara/microfone conforme a preferência guardada do utilizador), "Testar vídeo" (entra usando uma faixa de vídeo sintética/padrão de teste em vez da câmara real), e "Entrar (ouvir)" para utilizadores cuja permissão no canal é apenas ouvir.

#### Scenario: Testar vídeo sem expor a câmara real
- **WHEN** o utilizador escolhe "Testar vídeo"
- **THEN** entra na chamada com uma faixa de vídeo sintética, sem activar a câmara física

#### Scenario: Utilizador só com permissão de ouvir
- **WHEN** um utilizador cuja permissão no canal não inclui falar tenta entrar
- **THEN** a única opção disponível é "Entrar (ouvir)", sem opção de activar microfone ou câmara

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
A pré-entrada SHALL cumprir a checklist de D7 (cabeçalho, pré-visualização com blur e medidor, calibração de dispositivos, três ações em cartões, "No canal agora"). Telemetria, codec, ruído neural, eco e AGC SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da sessão de voz
O sistema SHALL manter todas as funcionalidades existentes desta área: entrar com câmara e microfone conforme a preferência, Testar vídeo, Entrar (ouvir), entrada só áudio se a câmara falhar, libertação do hardware ao sair, mudança de canal, controlos de chamada, blur em três níveis, indicadores de fala, roster na sidebar, duração, E2EE desligada com faixa e Religar, saída por canal ou servidor apagado, e áudio remoto contínuo ao navegar.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
