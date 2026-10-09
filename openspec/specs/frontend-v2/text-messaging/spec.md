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
O sistema SHALL apresentar uma pill "Saltar para o presente" com uma contagem quando o utilizador está desviado do fundo da lista de mensagens e chegam mensagens novas, e SHALL rolar para o fundo e ocultar a pill ao ser clicada.

#### Scenario: Mensagens novas fora da vista
- **WHEN** o utilizador está a ler mensagens antigas (scroll para cima) e chega uma mensagem nova
- **THEN** a pill de saltar para o presente aparece com a contagem de mensagens novas acumuladas

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
