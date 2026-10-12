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
O sistema SHALL detectar até 5 URLs no texto de uma mensagem e apresentar uma pré-visualização (miniatura, nome do site, título) para cada uma, obtida após a decifra do conteúdo da mensagem.

#### Scenario: Mensagem com um link
- **WHEN** uma mensagem contém uma URL reconhecível
- **THEN** uma pré-visualização dessa URL é apresentada por baixo do texto da mensagem

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
O canal de texto SHALL apresentar cabeçalho de canal com chip E2EE, busca e alternância do painel de Membros, cartão de boas-vindas, banner de canal cifrado, mensagens com badge de cargo, legenda de anexo e reações com emoji, e composer com rodapé de ajuda. Cartões de rolagem de dados e spans de feitiço SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_shell_da_aplica_o_chat_de_texto` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

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
