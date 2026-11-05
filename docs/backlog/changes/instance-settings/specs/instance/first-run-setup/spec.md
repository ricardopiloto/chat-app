# Spec Delta

## Purpose

Permite instalar uma instância nova e criar sua conta de administrador pelo navegador ou pelo app, de forma segura contra quem alcançar o servidor antes do dono, e deixa de oferecer o instalador depois que a instância está configurada.

## ADDED Requirements

### Requirement: O primeiro arranque prepara a instância sozinho
Quando o diretório de dados não contém uma instância, o servidor SHALL criar o diretório, o banco, a chave mestra de segredos, as chaves do LiveKit (únicas, nunca as de exemplo), um certificado autoassinado para a fase de configuração e um token de configuração, sem intervenção de quem o iniciou. SHALL registrar no log a URL de acesso, a impressão digital do certificado e o token, e SHALL gravar o token em um arquivo do diretório de dados com permissões restritas. Reiniciar uma instância já preparada SHALL NOT recriar nem alterar nada disso.

#### Scenario: Diretório vazio
- **WHEN** o servidor inicia em um diretório de dados vazio
- **THEN** cria banco, chaves, certificado e token e informa URL, impressão digital e token

#### Scenario: Reinício
- **WHEN** o servidor reinicia sobre uma instância já preparada
- **THEN** reutiliza banco, chaves e certificado sem recriá-los

#### Scenario: Primeiro arranque interrompido
- **WHEN** o primeiro arranque é interrompido depois de criar parte dos itens
- **THEN** a execução seguinte completa apenas o que faltou, sem recriar nem alterar o que já existe

### Requirement: O token de configuração controla a criação do primeiro administrador
Enquanto não existe administrador, o servidor SHALL aceitar a criação da primeira conta somente com o token de configuração correto, comparado em tempo constante. O token SHALL ser gerado ao acaso com entropia suficiente ou definido por `PARLEY_SETUP_TOKEN`, caso em que o valor externo vence. Tentativas com token errado SHALL receber um atraso progressivo e limitado, global (não por IP), e SHALL NOT bloquear definitivamente o token correto nem o dono. O token SHALL ser de uso único: após a criação do administrador ele SHALL ser invalidado e o arquivo do token SHALL ser removido.

#### Scenario: Token correto
- **WHEN** o cadastro da primeira conta é enviado com o token correto
- **THEN** a conta é criada como administrador da instância e o token deixa de valer

#### Scenario: Token errado
- **WHEN** o cadastro é enviado sem token ou com token incorreto
- **THEN** é recusado e a tentativa conta para o limite do IP

#### Scenario: Excesso de tentativas
- **WHEN** várias tentativas erradas ocorrem em sequência, de um ou de vários endereços
- **THEN** as respostas ficam progressivamente mais lentas até um teto curto, e o token correto continua sendo aceito

#### Scenario: Token definido de fora
- **WHEN** `PARLEY_SETUP_TOKEN` está definida no primeiro arranque
- **THEN** esse valor é o token e nenhum token aleatório é gerado

### Requirement: Enquanto não há administrador, só o necessário para configurar responde
Antes da criação do administrador, o servidor SHALL responder apenas ao estado da instância, à validação do token e ao cadastro da primeira conta (e ao que for necessário para entregar a interface). Os demais endpoints SHALL recusar. Depois da criação, o servidor SHALL se comportar como uma instância normal.

#### Scenario: Endpoint comum antes da configuração
- **WHEN** um cliente chama um endpoint de conteúdo antes de existir administrador
- **THEN** a resposta é uma recusa e nada é exposto

#### Scenario: Depois da configuração
- **WHEN** o administrador já foi criado
- **THEN** os endpoints respondem normalmente

### Requirement: O instalador se tranca depois da configuração
Depois que o administrador é criado, as rotas de validação de token e de instalação SHALL deixar de responder (resposta 404) e SHALL NOT ser reabertas por nenhuma ação remota. Reabrir a instalação SHALL exigir acesso à máquina (remover os dados da instância).

#### Scenario: Tentativa de reabrir
- **WHEN** alguém chama as rotas de instalação em uma instância configurada
- **THEN** a resposta é 404

### Requirement: A configuração inicial trafega cifrada
Durante a fase de configuração, o servidor SHALL aceitar conexões somente por HTTPS com o certificado autoassinado gerado no primeiro arranque, cuja impressão digital SHALL ser informada junto com a URL para conferência. O tráfego com o token e a senha do administrador SHALL NOT ocorrer em HTTP puro, exceto quando o servidor estiver atrás de um proxy que termina TLS e declarar isso na configuração de arranque.

#### Scenario: Acesso à instalação
- **WHEN** o dono abre a URL informada no log
- **THEN** a conexão é HTTPS e a impressão digital do certificado confere com a informada

#### Scenario: Tentativa em HTTP
- **WHEN** alguém tenta acessar a instalação por HTTP puro sem proxy declarado
- **THEN** a conexão não é atendida em texto claro

### Requirement: Instâncias existentes não passam pelo instalador
Se o banco já contém contas ao iniciar o servidor novo, a instância SHALL ser tratada como já configurada: nenhum token é gerado, o instalador permanece trancado, as variáveis de ambiente continuam valendo e a conta do operador inicial passa a ser o administrador da configuração.

#### Scenario: Produção atual
- **WHEN** o servidor novo inicia sobre o `chat.db` da produção existente
- **THEN** não gera token, não abre o instalador e o administrador existente pode abrir a tela de configuração

### Requirement: Uma instalação nova nasce com padrões que funcionam sem acesso à máquina
Quando o primeiro arranque prepara uma instância nova, o sistema SHALL gravar como configuração os padrões necessários para que a instância seja usada sem acesso à máquina: interface servida pelo próprio servidor (quando o binário a contém), HTTPS com certificado autoassinado e LiveKit gerenciado ligado, com o TURN desligado e o aviso correspondente visível ao administrador. Uma variável de ambiente definida SHALL vencer esses padrões. Instâncias que já têm contas SHALL NOT receber esses padrões. Antes da criação do administrador, o LiveKit gerenciado SHALL NOT aceitar conexões de sinalização.

#### Scenario: Instalação nova
- **WHEN** o servidor inicia em um diretório de dados vazio, sem variáveis de ambiente
- **THEN** serve a interface, fala HTTPS com o certificado autoassinado e tem o LiveKit gerenciado ligado depois da criação do administrador

#### Scenario: Variável vence
- **WHEN** a instalação nova inicia com `TLS_MODE=off` definido no ambiente
- **THEN** o servidor respeita a variável e o campo aparece travado

#### Scenario: Instância existente
- **WHEN** o servidor inicia sobre um banco que já tem contas
- **THEN** nenhum padrão de instalação nova é aplicado
