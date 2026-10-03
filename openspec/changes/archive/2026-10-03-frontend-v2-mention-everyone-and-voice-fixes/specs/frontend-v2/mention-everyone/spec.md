# Spec Delta

## Purpose

Permite que quem tem autorização chame a atenção de todo o canal de texto com `@todos`, sem abrir essa possibilidade a toda a gente.

## ADDED Requirements

### Requirement: Permissão de mencionar @todos
O sistema SHALL ter uma permissão de cargo "Mencionar @todos", desligada por omissão em todos os cargos, sempre ativa para o dono do servidor, e configurável na gestão de cargos como as restantes. A permissão SHALL ser verificada pelo servidor no momento do envio, não só pelo cliente.

#### Scenario: Por omissão ninguém além do dono
- **WHEN** um cargo é criado sem alterar permissões, ou um membro não tem cargo
- **THEN** essas pessoas não podem mencionar `@todos`; o dono pode

#### Scenario: Ativar num cargo
- **WHEN** o dono ativa "Mencionar @todos" num cargo e guarda
- **THEN** quem tem esse cargo passa a poder mencionar `@todos` sem recarregar a aplicação

### Requirement: Notificar todos os membros do canal
O sistema SHALL, quando uma mensagem de texto enviada por quem tem a permissão contém `@todos`, criar uma notificação de menção para cada membro que vê esse canal, exceto quem escreveu, entregando-a em tempo real aos que estão ligados. O limite de 20 menções individuais por mensagem SHALL NOT limitar `@todos`. Membros que não veem o canal (canal privado sem acesso) SHALL NOT receber a notificação.

#### Scenario: Todos os membros recebem
- **WHEN** quem tem a permissão envia "@todos reunião às 20h" num canal público de um servidor com cinco membros
- **THEN** os outros quatro recebem uma notificação de menção que leva à mensagem, e quem escreveu não recebe

#### Scenario: Canal privado
- **WHEN** o canal é privado e só dois cargos têm acesso
- **THEN** só os membros desses cargos recebem a notificação

#### Scenario: Mais de vinte membros
- **WHEN** o servidor tem mais de vinte membros que veem o canal
- **THEN** todos recebem a notificação, e a mensagem continua a aceitar até 20 menções individuais adicionais

#### Scenario: Silenciado
- **WHEN** quem escreve está silenciado no canal
- **THEN** a mensagem é recusada como qualquer outra e ninguém é notificado

### Requirement: Sem permissão, é texto simples
O sistema SHALL tratar `@todos` escrito por quem não tem a permissão como texto simples: a mensagem é enviada, não gera notificações para os outros membros, não é destacada como menção e não mostra erro. O servidor SHALL ignorar o pedido de notificar todos quando a pessoa não tem a permissão, mesmo que um cliente desatualizado o envie.

#### Scenario: Escrever @todos sem permissão
- **WHEN** um membro sem a permissão envia "@todos olá"
- **THEN** a mensagem aparece normalmente, com "@todos" como texto simples, e ninguém recebe notificação

#### Scenario: Permissão retirada com a página aberta
- **WHEN** um cargo perde a permissão e quem o tem envia `@todos` antes de a aplicação o saber
- **THEN** o servidor entrega a mensagem sem notificar ninguém

### Requirement: @todos no composer e nas mensagens
O sistema SHALL oferecer "todos" no autocompletar de menções apenas a quem tem a permissão, no topo da lista e distinto dos membros; SHALL destacar `@todos` nas mensagens que o servidor marcou como notificando todos, com o mesmo estilo das menções a membros; e SHALL mostrar a notificação na lista de menções e respostas como uma menção.

#### Scenario: Autocompletar só com permissão
- **WHEN** quem tem a permissão digita `@` ou `@to` no composer
- **THEN** a lista de sugestões inclui "todos" antes dos membros; para quem não tem a permissão ela não aparece

#### Scenario: Destaque na mensagem
- **WHEN** uma mensagem foi enviada com `@todos` por alguém com a permissão
- **THEN** todos os que a leem veem `@todos` destacado como menção

#### Scenario: Notificação na lista
- **WHEN** chega uma notificação gerada por `@todos`
- **THEN** aparece em "Menções e respostas" e acende o indicador da topbar, como uma menção normal, com o mesmo efeito sonoro de nova menção
