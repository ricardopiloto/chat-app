# Spec Delta

## MODIFIED Requirements

### Requirement: Canal de texto fiel ao mockup

O canal de texto SHALL apresentar cabeçalho de canal com chip E2EE, busca e alternância do painel de Membros, cartão de boas-vindas, banner de canal cifrado, mensagens com badge de cargo, legenda de anexo e reações com emoji, e composer com rodapé de ajuda, e cartões de rolagem de dados conforme a capability `rolagem de dados` deste documento. Spans de feitiço SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_shell_da_aplica_o_chat_de_texto` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído (à excepção da rolagem de dados, agora implementada) foi implementado, e a classificação é **Fiel**

## ADDED Requirements

### Requirement: Rolagem de dados em canais de texto e de Dados

Qualquer membro com permissão de escrever/rolar no canal (a mesma permissão exigida para enviar mensagens num canal de texto, ou a permissão equivalente num canal do tipo Dados — ver `frontend-v2/channel-management`) SHALL poder lançar uma notação `NdM+K` (`count` 1-20, `sides` 2-1000, `modificador` -100 a 100) num canal de texto ou num canal do tipo Dados, e o sistema SHALL gerar o resultado no servidor (nunca no cliente), SHALL publicar o resultado como uma mensagem normal do canal (com remetente, avatar e reacções, tal como qualquer outra mensagem), em tempo real para todos os membros, mostrando a notação, cada dado individual, o modificador e o total. Em canais de Texto, o lançamento SHALL ser feito pelo popover/modal "Lançar dados" do composer (mantido), com destaque visual por **borda** e **sombra**, e com controlo explícito de modificador além da notação e do rótulo opcional. Em canais de Dados, o composer dedicado SHALL expor os mesmos três controlos. Para uma notação `1d20` sem outros dados, um resultado natural de 20 ou de 1 SHALL ser destacado distintamente dos outros valores. Para cada dado com `sides === 100`, a animação 3D SHALL usar sempre **dois** dados físicos (dezena `d100` + unidade `d10`) com faces forçadas a partir do total do servidor. Um canal do tipo Dados SHALL NOT aceitar mensagens de texto normais — só rolagens.

Para uma mensagem `dice_roll` recebida ao vivo por `message.new` enquanto um canal de Texto ou Dados está aberto, o frontend SHALL apresentar a todos os membros que estão a ver esse canal um overlay de dados 3D somente se, em Texto, `dice_animations_enabled` estiver ligado; em Dados, a condição não se aplica e o overlay SHALL aparecer sempre, com cada dado a pousar no valor individual já gerado e persistido pelo servidor; a animação SHALL ser apenas apresentação local, sem decidir ou alterar resultados. Mensagens obtidas por histórico, paginação ou abertura posterior do canal SHALL mostrar somente o cartão estático. Sem WebGL ou com `prefers-reduced-motion`, o frontend SHALL mostrar directamente o cartão estático, sem overlay.

#### Scenario: Lançar uma notação simples num canal de texto

- **WHEN** um membro envia a notação `1d20+5` a partir do popover "Lançar dados" do composer de um canal de texto
- **THEN** uma mensagem nova aparece no canal, em tempo real para todos os membros, com a notação, o valor do dado, o modificador e o total, embutida na conversa normal desse canal

#### Scenario: Popover de lançar dados com destaque visual

- **WHEN** um membro abre o popover "Lançar dados" no composer de um canal de texto
- **THEN** o painel permanece disponível (não é removido) e apresenta borda e sombra de destaque coerentes com o design system da aplicação

#### Scenario: Modificador explícito na UI

- **WHEN** um membro define um modificador (ex. `+2` ou `-3`) no controlo dedicado do popover de Texto ou do composer de Dados e lança a rolagem
- **THEN** a notação publicada e o total reflectem esse modificador dentro dos limites aceites

#### Scenario: Lançar uma notação num canal de Dados

- **WHEN** um membro envia a notação `2d6+3` num canal do tipo Dados ("Histórico de Dados")
- **THEN** a mesma mensagem de resultado aparece nesse canal, em tempo real para todos os membros

#### Scenario: Vinte ou um natural em d20

- **WHEN** um membro lança `1d20` (sem outros dados) e o resultado do dado é 20, ou é 1
- **THEN** o resultado é destacado distintamente de um resultado intermédio

#### Scenario: Percentil 1d100 anima com dezena e unidade

- **WHEN** um membro lança `1d100` (com ou sem modificador) num canal elegível para overlay
- **THEN** a animação 3D mostra dois dados (dezena e unidade) que pousam nas faces correspondentes ao total decidido pelo servidor, e o cartão mostra o total (e modificador) correctos

#### Scenario: Notação inválida ou fora dos limites

- **WHEN** um membro tenta lançar uma notação fora dos limites aceites (ex. `21d20`, `1d2000`) ou malformada, em qualquer um dos dois tipos de canal
- **THEN** o pedido é recusado com um erro claro, e nenhuma mensagem é publicada

#### Scenario: Sem permissão de escrever/rolar

- **WHEN** um membro silenciado, ou sem permissão de escrever/rolar nesse canal, tenta lançar uma notação
- **THEN** o pedido é recusado, da mesma forma que uma tentativa de enviar uma mensagem de texto seria

#### Scenario: Canal de Dados recusa mensagens de texto normais

- **WHEN** um membro tenta enviar uma mensagem de texto normal (não uma rolagem) num canal do tipo Dados
- **THEN** o pedido é recusado com um erro claro

#### Scenario: Animação 3D ao vivo para os membros presentes num canal elegível

- **WHEN** uma mensagem `dice_roll` chega por `message.new` a membros que estão com o mesmo canal de Texto com `dice_animations_enabled` ligado ou canal de Dados aberto no momento da rolagem
- **THEN** todos esses membros vêem os dados 3D caírem no overlay, cada um pousando no seu valor individual já persistido pelo servidor, e o cartão normal da mensagem permanece na conversa com o mesmo total

#### Scenario: Histórico e membros ausentes não reproduzem a animação

- **WHEN** um membro abre o canal depois da rolagem, está a ver outro canal no momento, ou recebe a mensagem por histórico ou paginação
- **THEN** vê apenas o cartão estático da rolagem, sem overlay nem animação de recuperação

#### Scenario: Fallback sem WebGL ou com movimento reduzido

- **WHEN** uma rolagem chega ao vivo num cliente sem WebGL ou com `prefers-reduced-motion` activo
- **THEN** o overlay não é montado e o cartão estático aparece directamente com o resultado decidido pelo servidor

#### Scenario: Canal de Texto com animação desligada

- **WHEN** `dice_roll` chega por `message.new` a um canal de Texto aberto com `dice_animations_enabled` desligado (padrão)
- **THEN** nenhum overlay é montado e os membros vêem directamente apenas o cartão estático

#### Scenario: Canal de Texto com animação ligada

- **WHEN** `dice_roll` chega por `message.new` a um canal de Texto aberto com `dice_animations_enabled` ligado
- **THEN** os membros presentes vêem o overlay 3D pousar nos resultados persistidos e o cartão normal permanece na conversa

#### Scenario: Canal de Dados anima sempre

- **WHEN** `dice_roll` chega por `message.new` a um canal de Dados aberto
- **THEN** os membros presentes vêem o overlay 3D independentemente de `dice_animations_enabled`, que não se aplica ao canal
