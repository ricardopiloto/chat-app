# text-messaging Specification

## Purpose

Permite ler, enviar, responder, apagar e anexar conteúdo a mensagens num canal de texto, com o texto e os anexos sempre cifrados de ponta-a-ponta antes de saírem do cliente.

## Requirements

### Requirement: Mensagens cifradas no cliente antes do envio
O sistema SHALL cifrar o corpo de cada mensagem com a chave do servidor antes de a enviar (`POST /api/channels/{id}/messages`), de modo que o backend armazene e encaminhe apenas texto cifrado, nunca o conteúdo em claro.

#### Scenario: Envio de mensagem
- **WHEN** o utilizador envia uma mensagem de texto
- **THEN** o pedido de rede contém apenas o `content_ciphertext`, nunca o texto em claro

### Requirement: Lista de mensagens agrupada e separada por dia
O sistema SHALL apresentar as mensagens agrupadas por remetente consecutivo (mostrando o avatar apenas uma vez por grupo) e separadas por marcadores de dia (com rótulos "Hoje"/"Ontem"/data completa), incluindo um marcador fixo no topo da vista enquanto se percorre um dia com scroll. O agrupamento por remetente consecutivo SHALL só continuar enquanto o intervalo entre a mensagem e a mensagem imediatamente anterior do mesmo remetente for de 5 minutos ou menos; passado esse intervalo, a mensagem SHALL iniciar um novo grupo (com o seu próprio avatar e cabeçalho), mesmo sendo o mesmo remetente e o mesmo dia.

#### Scenario: Agrupamento por remetente
- **WHEN** o mesmo remetente envia várias mensagens em sequência sem intervenção de outro remetente, cada uma até 5 minutos depois da anterior
- **THEN** essas mensagens aparecem agrupadas visualmente, com o avatar e o nome mostrados apenas na primeira

#### Scenario: Separador de dia
- **WHEN** existem mensagens de dias diferentes na mesma vista
- **THEN** um separador visual com o rótulo do dia aparece entre elas

#### Scenario: Intervalo longo quebra o agrupamento
- **WHEN** o mesmo remetente envia uma mensagem mais de 5 minutos depois da sua mensagem anterior, no mesmo dia
- **THEN** a nova mensagem inicia um novo grupo, com o seu próprio avatar e cabeçalho

### Requirement: Responder e apagar mensagens
O sistema SHALL permitir responder a uma mensagem (mostrando uma citação da mensagem original acima do composer, removível antes de enviar) e apagar uma mensagem própria, de um canal que o utilizador criou, de um servidor que o utilizador possui, ou quando o utilizador tem a permissão `apagar mensagens` — nunca para outros casos.

#### Scenario: Responder a uma mensagem
- **WHEN** o utilizador clica em responder numa mensagem e envia uma nova mensagem
- **THEN** a nova mensagem mostra uma citação truncada do autor e conteúdo da mensagem original

#### Scenario: Apagar sem permissão
- **WHEN** um utilizador sem nenhuma das condições de permissão tenta apagar a mensagem de outra pessoa
- **THEN** a acção de apagar não está disponível para essa mensagem

### Requirement: Reações com emoji em mensagens
O sistema SHALL permitir reagir com emoji a qualquer mensagem do canal (de texto simples, com anexo, ou com citação de resposta), reutilizando o mesmo conjunto de emoji e shortcodes já disponível no composer. O sistema SHALL agrupar as reações por emoji, apresentando sob a mensagem uma pill por emoji com a contagem de utilizadores que reagiram, e SHALL alternar (adicionar/remover) a reação do próprio utilizador ao clicar numa pill existente de um emoji com que já reagiu, ou ao escolher esse emoji novamente através do botão de reagir. Um utilizador SHALL ter no máximo uma reação por emoji em cada mensagem, mas MAY reagir com vários emoji diferentes na mesma mensagem.

#### Scenario: Reagir a uma mensagem
- **WHEN** o utilizador clica no botão de reagir de uma mensagem e escolhe um emoji no selector
- **THEN** uma pill com esse emoji e contagem 1 aparece sob a mensagem, com destaque visual indicando que o próprio utilizador reagiu

#### Scenario: Remover a própria reação
- **WHEN** o utilizador clica numa pill de emoji sob uma mensagem à qual já reagiu com esse mesmo emoji
- **THEN** a sua reação é removida, a contagem da pill diminui em 1, e a pill desaparece se a contagem chegar a 0

#### Scenario: Reagir com vários emoji diferentes
- **WHEN** o utilizador reage à mesma mensagem com dois emoji diferentes
- **THEN** duas pills distintas aparecem sob a mensagem, cada uma reflectindo apenas a contagem do seu próprio emoji

#### Scenario: Tooltip com autores da reação
- **WHEN** o utilizador foca ou passa o cursor sobre uma pill de emoji
- **THEN** é apresentada a lista de nomes de quem reagiu com esse emoji, resumida em "e mais N" quando o número de autores excede o limite apresentado

#### Scenario: Sincronização em tempo real
- **WHEN** outro utilizador ligado ao mesmo canal adiciona ou remove uma reação numa mensagem
- **THEN** a pill correspondente actualiza-se em tempo real para todos os clientes ligados ao canal, sem recarregar a página

#### Scenario: Reação restrita ao conjunto fechado de emoji
- **WHEN** o utilizador abre o selector de reagir a uma mensagem
- **THEN** só pode escolher um emoji do mesmo conjunto fechado já usado no composer, nunca introduzir texto livre como reação

### Requirement: Posicionamento do selector de reações
O selector de emoji aberto a partir do botão de reagir de uma mensagem SHALL abrir no lado (acima ou abaixo do botão) que tenha espaço suficiente dentro da área visível da lista de mensagens, preferindo abaixo quando ambos os lados couberem. Quando existe um lado com espaço suficiente, abrir o selector SHALL NOT provocar rolagem da lista de mensagens nem alterar a sua posição de rolagem. Se nenhum dos lados couber por inteiro, o selector SHALL abrir no lado com mais espaço e SHALL reduzir a sua altura para caber nesse espaço (a grelha de emoji passa a rolar internamente), de modo a não ficar cortado nem alargar a área rolável do chat.

#### Scenario: Mensagem junto ao fundo da lista
- **WHEN** o utilizador abre o selector de reações de uma mensagem cujo espaço abaixo do botão, dentro da área visível do chat, é menor que a altura do selector e o espaço acima é suficiente
- **THEN** o selector abre acima do botão e a posição de rolagem do chat não muda

#### Scenario: Mensagem com espaço abaixo
- **WHEN** o utilizador abre o selector de reações de uma mensagem com espaço suficiente abaixo do botão
- **THEN** o selector abre abaixo do botão e a posição de rolagem do chat não muda

#### Scenario: Espaço insuficiente nos dois lados
- **WHEN** o utilizador abre o selector numa área visível em que nem acima nem abaixo cabe a altura completa do selector
- **THEN** o selector abre no lado com mais espaço, com a altura reduzida para caber nesse espaço, a grelha de emoji rola internamente e a posição de rolagem do chat não muda

### Requirement: O selector de reações cabe na largura visível
O selector de emoji aberto a partir do botão de reagir SHALL permanecer inteiro dentro da largura visível da lista de mensagens. Nenhum emoji da grelha SHALL ficar fora do ecrã à esquerda ou à direita. A escolha de abrir acima ou abaixo do botão SHALL permanecer a já definida.

#### Scenario: Janela estreita
- **WHEN** o utilizador abre o selector de reações numa janela em que 320px alinhados à direita do botão ultrapassam o bordo esquerdo da área visível
- **THEN** o selector inteiro fica dentro dessa área e a grelha de emoji continua utilizável

#### Scenario: Janela com largura de sobra
- **WHEN** o utilizador abre o selector de reações numa janela em que os 320px cabem à direita do botão
- **THEN** o selector mantém a largura e o alinhamento actuais

### Requirement: Menções resolvidas para membros reais
O sistema SHALL apresentar ocorrências de `@handle` no corpo de uma mensagem como um elemento visualmente destacado e clicável apenas quando esse handle corresponde a um membro real do servidor; handles que não correspondem a nenhum membro SHALL ser apresentados como texto simples.

#### Scenario: Menção válida é clicável
- **WHEN** uma mensagem contém `@handle` de um membro real do servidor
- **THEN** esse trecho é apresentado como um elemento destacado que, ao ser clicado, foca esse membro

### Requirement: Anexos de imagem decifrados e com lightbox
O sistema SHALL permitir anexar imagens ao compor uma mensagem (incluindo colar directamente da área de transferência), cifrar cada anexo antes do envio, decifrar anexos recebidos localmente antes de os apresentar como miniaturas, e abrir um lightbox ao clicar numa miniatura com zoom, download, navegação entre anexos da mesma mensagem, e fecho por Escape, por um botão explícito e por clique fora da imagem.

#### Scenario: Anexar por colar
- **WHEN** o utilizador cola uma imagem da área de transferência com o composer em foco
- **THEN** a imagem é adicionada à composição como um anexo pendente, tal como se tivesse sido escolhida por ficheiro

#### Scenario: Fechar o lightbox por clique fora
- **WHEN** o lightbox está aberto e o utilizador clica fora da imagem (no fundo escurecido)
- **THEN** o lightbox fecha

### Requirement: Pré-visualização automática de links
O sistema SHALL detectar até 5 URLs no texto de uma mensagem e apresentar uma pré-visualização para cada uma, obtida após a decifra do conteúdo da mensagem. Para uma URL reconhecida como um dos provedores com oEmbed suportados (YouTube, Vimeo, Spotify, SoundCloud, TikTok), a pré-visualização SHALL mostrar uma miniatura, o nome do provedor e um indicador de reprodução, e SHALL NOT carregar nenhum conteúdo incorporado desse provedor até o utilizador clicar explicitamente nela. Para uma URL que aponta directamente a um arquivo de vídeo, a pré-visualização SHALL ser um player de vídeo reproduzível inline na mensagem. Para qualquer outra URL reconhecível, a pré-visualização SHALL ser o cartão genérico já existente (miniatura, nome do site, título). Uma falha ao obter a pré-visualização de um provedor SHALL degradar para o cartão genérico ou para a ausência de cartão, nunca para um erro visível na mensagem.

#### Scenario: Mensagem com um link
- **WHEN** uma mensagem contém uma URL reconhecível
- **THEN** uma pré-visualização dessa URL é apresentada por baixo do texto da mensagem

#### Scenario: Mensagem com um link de um provedor com embed
- **WHEN** uma mensagem contém uma URL do YouTube, Vimeo, Spotify, SoundCloud ou TikTok
- **THEN** a pré-visualização mostra uma miniatura com o nome do provedor e um indicador de reprodução, sem carregar nenhum iframe do provedor

#### Scenario: Clicar na pré-visualização de um provedor com embed
- **WHEN** o utilizador clica na miniatura de uma pré-visualização de um provedor com embed
- **THEN** o player desse provedor é carregado e embutido no lugar da miniatura, dentro da própria mensagem

#### Scenario: Mensagem com um link directo de arquivo de vídeo
- **WHEN** uma mensagem contém uma URL que aponta directamente a um arquivo de vídeo
- **THEN** a pré-visualização é um player de vídeo reproduzível inline, sem precisar de um clique adicional para carregar

#### Scenario: Pré-visualização indisponível
- **WHEN** a obtenção da pré-visualização de uma URL falha, seja pelo provedor externo ou pela página de destino
- **THEN** a mensagem continua a mostrar o link como texto normal, sem nenhum cartão de erro

### Requirement: Composer com autocompletar e estados restritos
O sistema SHALL oferecer, no campo de composição, autocompletar de menções ao digitar `@` e autocompletar de emoji ao digitar `:shortcode:`, além de um selector de emoji dedicado; e SHALL substituir o composer por um aviso de "somente leitura" em canais sem permissão de escrita, ou por um aviso de "silenciado até HH:MM" enquanto o utilizador estiver silenciado nesse canal (capability `frontend-v2/channel-management`).

#### Scenario: Autocompletar de menção
- **WHEN** o utilizador digita `@` seguido de letras que correspondem ao início do handle de um membro
- **THEN** uma lista de sugestões aparece, navegável pelo teclado, e seleccionar uma insere a menção completa

#### Scenario: Composer bloqueado por silenciamento
- **WHEN** o utilizador está silenciado no canal actual
- **THEN** o campo de composição é substituído por um aviso indicando até quando o silenciamento dura, e nenhuma mensagem pode ser enviada enquanto isso

### Requirement: Saltar para o presente
O sistema SHALL apresentar uma pill "Saltar para o presente" sempre que o utilizador está desviado do fundo da lista de mensagens (independentemente de terem chegado mensagens novas), SHALL mostrar uma contagem junto à pill quando houver mensagens novas acumuladas desde que o utilizador se desviou do fundo, e SHALL rolar para o fundo e ocultar a pill ao ser clicada.

#### Scenario: Scroll para mensagens antigas sem mensagens novas
- **WHEN** o utilizador rola para cima, para ler mensagens antigas, e nenhuma mensagem nova chega enquanto isso
- **THEN** a pill de saltar para o presente aparece, sem nenhuma contagem visível

#### Scenario: Mensagens novas fora da vista
- **WHEN** o utilizador está a ler mensagens antigas (scroll para cima) e chega uma mensagem nova
- **THEN** a pill de saltar para o presente aparece (ou já visível, actualiza) com a contagem de mensagens novas acumuladas

### Requirement: Canal de texto fiel ao mockup

O canal de texto SHALL apresentar cabeçalho de canal com chip E2EE, busca e alternância do painel de Membros, cartão de boas-vindas, banner de canal cifrado, mensagens com badge de cargo, legenda de anexo e reações com emoji, e composer com rodapé de ajuda, e cartões de rolagem de dados conforme a capability `rolagem de dados` deste documento. Spans de feitiço SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_shell_da_aplica_o_chat_de_texto` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído (à excepção da rolagem de dados, agora implementada) foi implementado, e a classificação é **Fiel**

### Requirement: Lightbox fiel ao mockup
O lightbox SHALL ter barra superior com metadados e controlos de zoom/enquadrar/1:1/descarregar/fechar, setas de navegação e faixa de miniaturas com contagem.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional do chat de texto
O sistema SHALL manter todas as funcionalidades existentes desta área: enviar, ler, agrupar, separar por dia, responder, apagar por permissão, menções, anexos com cifra e lightbox, pré-visualização de links, autocompletar de menção e emoji, estados somente leitura e silenciado, e saltar para o presente.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend

### Requirement: Indicação de digitação no canal de texto

O sistema SHALL mostrar, a quem estiver a ver um canal de texto, os nomes dos outros membros desse canal que estejam activamente a digitar uma mensagem. O indicador SHALL aparecer imediatamente acima da caixa de composição, integrado no rodapé, sem cobrir mensagens, a resposta em composição, sugestões, ou o controlo «Saltar para o presente». O próprio utilizador SHALL NOT aparecer no seu indicador.

#### Scenario: Um membro começa a digitar

- **WHEN** um membro autorizado começa a digitar no canal de texto que outra pessoa está a ver
- **THEN** o nome desse membro e uma indicação de digitação aparecem acima da caixa de composição dessa pessoa, sem mostrar o texto digitado

#### Scenario: Vários membros digitam

- **WHEN** duas ou mais pessoas digitam no mesmo canal de texto
- **THEN** o indicador identifica os membros activos, resumindo a lista quando não houver espaço para todos os nomes, sem criar rolagem horizontal

#### Scenario: Indicador e salto coexistem

- **WHEN** o indicador está visível e a pessoa está a ler mensagens antigas com «Saltar para o presente» visível
- **THEN** ambos os controlos ficam legíveis e utilizáveis, sem sobreposição, também numa janela estreita

#### Scenario: Resposta e sugestões coexistem

- **WHEN** há uma resposta em composição ou uma lista de sugestões aberta enquanto outro membro digita
- **THEN** o indicador mantém a sua posição acima da caixa e não cobre a resposta nem as sugestões

### Requirement: Presença de digitação efémera e restrita ao canal

O sistema SHALL transportar apenas o identificador do canal, a identidade autenticada de quem digita e o estado de digitação, sem transportar o rascunho nem persistir este estado. Só membros com permissão de escrita no canal SHALL poder anunciar digitação; apenas membros com acesso de leitura SHALL receber o evento. O indicador SHALL desaparecer ao cessar a digitação, ao enviar a mensagem, ao mudar de canal ou após um curto período sem actividade, mesmo se a ligação cair.

#### Scenario: Parar ou enviar

- **WHEN** um membro limpa o campo, deixa de digitar ou envia a mensagem
- **THEN** a sua indicação desaparece dos outros clientes do canal em tempo útil

#### Scenario: Ligação interrompida

- **WHEN** a ligação do membro que digitava termina sem aviso de paragem
- **THEN** a indicação desaparece automaticamente após o período de expiração

#### Scenario: Outro canal ou acesso negado

- **WHEN** alguém vê outro canal, ou não tem acesso de leitura ao canal onde ocorre a digitação
- **THEN** não vê o indicador desse canal nem recebe dados de digitação de um canal inacessível

#### Scenario: Utilizador sem permissão de escrita

- **WHEN** uma pessoa sem permissão para escrever tenta anunciar digitação no canal
- **THEN** o sistema não divulga essa presença aos outros membros

### Requirement: Mensagem pinada única por canal de texto
O sistema SHALL manter no máximo uma mensagem pinada em cada canal de texto. A mensagem pinada SHALL pertencer ao próprio canal e SHALL continuar disponível após recarregar a aplicação. Quando a mensagem original for excluída, o pin SHALL ser removido.

#### Scenario: Pinar mensagem
- **WHEN** uma mensagem do canal é pinada com sucesso
- **THEN** ela passa a ser a única mensagem pinada nesse canal e o estado persiste após recarregar

#### Scenario: Mensagem inelegível
- **WHEN** alguém tenta pinar uma mensagem de webhook ou de outro canal
- **THEN** o sistema recusa a ação e o pin atual não muda

#### Scenario: Mensagem excluída
- **WHEN** a mensagem pinada é excluída
- **THEN** o canal deixa de ter mensagem pinada e o informativo desaparece para seus membros

### Requirement: Informativo e navegação para mensagem pinada
O sistema SHALL mostrar a todos os membros com acesso ao canal um informativo visual persistente enquanto houver uma mensagem pinada. Ao ativá-lo, SHALL navegar até a mensagem original, carregar o histórico necessário, centralizar a mensagem e destacá-la temporariamente. O informativo SHALL refletir alterações do pin em tempo real e após reconexão.

#### Scenario: Membro acessa a mensagem pinada
- **WHEN** um membro clica no informativo de pin
- **THEN** a mensagem original aparece no histórico com destaque temporário, mesmo que não estivesse na página inicialmente carregada

#### Scenario: Pin fora do histórico visível
- **WHEN** a mensagem pinada é anterior ao histórico visível do membro (convite sem histórico compartilhado)
- **THEN** o informativo é mostrado como indisponível, sem conteúdo, autor nem navegação, e nenhum endpoint revela a mensagem

#### Scenario: Clique repetido
- **WHEN** o membro clica no informativo mais de uma vez para o mesmo pin
- **THEN** a mensagem é centralizada e destacada a cada clique

#### Scenario: Conteúdo ilegível
- **WHEN** o cliente não consegue descriptografar a mensagem pinada
- **THEN** o informativo mostra um rótulo genérico e continua permitindo a navegação

#### Scenario: Troca ou remoção remota
- **WHEN** outro gestor troca ou remove o pin enquanto o membro está conectado
- **THEN** o informativo atualiza sem recarregar a página

#### Scenario: Reconexão
- **WHEN** o cliente reconecta após perder um evento de pin
- **THEN** o informativo passa a refletir o estado persistido do canal

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

### Requirement: Barra de dados no canal de Dados

Num canal do tipo Dados, o sistema SHALL apresentar, junto ao composer dedicado de rolagem, uma barra de dados configurável visível apenas nesse tipo de canal. O composer existente (notação, modificador explícito, rótulo e botão de lançar) SHALL permanecer disponível e SHALL reduzir de tamanho/layout para encaixar a barra no mesmo rodapé, sem remover controlos.

A barra SHALL listar apenas as faces que o utilizador marcou como visíveis numa checklist de faces padrão (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`). Para cada face visível, o clique esquerdo SHALL aumentar a quantidade a rolar dessa face, e o clique direito SHALL diminuir essa quantidade, com mínimo 1 e máximo igual ao limite de `count` já aceite pela rolagem (1–20). Nesta ronda, apenas **um** tipo de face activo SHALL alimentar a rolagem: interagir com um dado da barra SHALL tornar essa face a notação activa (`NdM`) sincronizada com o campo de notação do formulário; o lançamento continua a usar o endpoint e a notação `NdM+K` existentes, sem pools multi-face.

A checklist de faces visíveis SHALL ser persistida no servidor associada à conta autenticada e SHALL ser reaplicada ao reabrir a aplicação ou outro cliente da mesma conta. Quantidades por face na barra MAY ser apenas estado de sessão (não é obrigatório persistir `count`). Canais de Texto e o popover “Lançar dados” SHALL NOT mostrar esta barra.

#### Scenario: Barra só no canal de Dados

- **WHEN** um membro abre um canal do tipo Dados
- **THEN** vê a barra de dados e o composer dedicado no mesmo rodapé, com o formulário compactado para caber com a barra

#### Scenario: Barra ausente em Texto

- **WHEN** um membro está num canal de Texto (com ou sem popover de dados aberto)
- **THEN** a barra de dados do canal de Dados não aparece

#### Scenario: Checklist define faces visíveis

- **WHEN** o utilizador marca `d20` e `d6` na checklist e desmarca as restantes
- **THEN** a barra mostra apenas esses dois dados, e a preferência fica disponível após recarregar a sessão na mesma conta

#### Scenario: Clique esquerdo aumenta quantidade

- **WHEN** o utilizador faz clique esquerdo num `d20` visível cuja quantidade actual é 1
- **THEN** a quantidade desse dado passa a 2 e a notação activa do formulário reflecte `2d20` (mantendo o modificador do formulário)

#### Scenario: Clique direito respeita mínimo 1

- **WHEN** o utilizador faz clique direito num dado da barra cuja quantidade actual é 1
- **THEN** a quantidade permanece 1

#### Scenario: Um só tipo por rolagem

- **WHEN** o utilizador tem `d6` e `d20` na barra e interage com o `d6` antes de lançar
- **THEN** a rolagem publicada usa apenas o tipo activo (`Nd6+K`), não a soma de vários tipos

#### Scenario: Preferência por conta no servidor

- **WHEN** o utilizador altera a checklist noutro dispositivo ou após novo login com a mesma conta
- **THEN** as faces visíveis coincidem com o último valor gravado no servidor para essa conta
