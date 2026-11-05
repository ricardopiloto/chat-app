# Spec Delta

## Purpose

Permite que a pessoa inicie, a partir do app desktop, uma instância local do Parley na própria máquina, com chat, voz e vídeo, e convide outras pessoas a se conectarem pelo app, sem montar um servidor dedicado.

## ADDED Requirements

### Requirement: A hospedagem local é explícita e desligada por padrão
O app SHALL oferecer uma área «Hospedar» onde a pessoa liga e desliga a instância local. O app SHALL NOT iniciar o servidor, abrir portas nem baixar componentes de hospedagem sem que a pessoa ligue a hospedagem. A área SHALL mostrar o estado (desligado, iniciando, no ar, com erro) e o motivo de qualquer erro.

#### Scenario: Primeiro uso do app
- **WHEN** a pessoa instala e abre o app e nunca ligou a hospedagem
- **THEN** nenhum servidor roda, nenhuma porta é aberta e nada é baixado

#### Scenario: Ligar a hospedagem
- **WHEN** a pessoa liga a hospedagem
- **THEN** o estado passa por «iniciando» e chega a «no ar» quando o servidor responde ao `GET /health`

#### Scenario: Falha ao iniciar
- **WHEN** o servidor não consegue iniciar (por exemplo, porta ocupada)
- **THEN** o estado é «com erro» com o motivo e nada fica rodando

### Requirement: A instância local usa o servidor do próprio Parley e guarda os dados na máquina
Ao ligar, o app SHALL iniciar o servidor do Parley empacotado com o instalador como processo filho, com dados (banco, anexos, avatares, chaves, certificado) em um diretório próprio do usuário, separado da configuração do cliente. Desligar a hospedagem SHALL encerrar o servidor e os processos que ele gerencia, preservando os dados. Ligar de novo SHALL reutilizar os mesmos dados.

#### Scenario: Dados preservados
- **WHEN** a pessoa desliga e liga novamente a hospedagem
- **THEN** contas, servidores, canais e mensagens anteriores continuam disponíveis

#### Scenario: Encerramento completo
- **WHEN** a pessoa desliga a hospedagem
- **THEN** o servidor e o processo de mídia terminam e nenhuma porta de hospedagem continua escutando

### Requirement: Voz e vídeo funcionam na instância local
A instância local SHALL oferecer canais de voz e vídeo. O componente de mídia SHALL ser baixado sob demanda na primeira vez que a hospedagem é ligada, com verificação de integridade antes de ser executado; se a verificação falhar, o componente SHALL NOT ser executado e a hospedagem SHALL continuar com o chat de texto e um aviso de voz indisponível. O app SHALL informar a necessidade e o tamanho do download antes de baixar.

#### Scenario: Primeira ativação com internet
- **WHEN** a pessoa liga a hospedagem pela primeira vez
- **THEN** o app informa o download do componente de mídia, baixa e verifica, e só então a voz fica disponível

#### Scenario: Integridade divergente
- **WHEN** o arquivo baixado não confere com o digest esperado
- **THEN** o componente é descartado, a voz fica indisponível com um aviso e o texto funciona

#### Scenario: Chamada na instância local
- **WHEN** duas pessoas conectadas à instância local entram em um canal de voz
- **THEN** áudio e vídeo fluem entre elas

### Requirement: O convite de hospedagem identifica a instância e fixa o certificado
O app SHALL gerar um convite com o endereço (IP ou nome) e a porta da instância local e a impressão digital SHA-256 do certificado do servidor. A pessoa SHALL poder copiar o convite. O convite SHALL NOT conter senhas, chaves de conta nem segredos do servidor. Quem recebe o convite no app Parley SHALL conseguir entrar colando o convite, e o app SHALL guardar a instância com a impressão digital fixada.

#### Scenario: Copiar o convite
- **WHEN** a instância está no ar e a pessoa copia o convite
- **THEN** o convite contém endereço, porta e impressão digital, e nenhum segredo

#### Scenario: Entrar pelo convite
- **WHEN** outra pessoa cola o convite no app Parley
- **THEN** o app valida o servidor e o certificado e mostra o ecrã de autenticação da instância

#### Scenario: Convite alterado
- **WHEN** o convite é alterado de modo que a impressão digital não corresponde ao certificado apresentado
- **THEN** a conexão é recusada com uma explicação

### Requirement: O app diagnostica o alcance da instância
O app SHALL oferecer um diagnóstico que informa o endereço local, o endereço público detectado (quando possível) e se a porta TCP do servidor responde de fora. Como a porta UDP de mídia não pode ser verificada de fora de forma confiável, o diagnóstico SHALL dizer isso e SHALL oferecer um teste de chamada com outra pessoa para confirmá-la. O diagnóstico SHALL explicar, em linguagem simples, as causas prováveis de falha (firewall, roteador sem encaminhamento de porta, CGNAT). O app SHALL NOT alterar o roteador nem o firewall por conta própria. A verificação de fora SHALL conectar somente ao endereço de quem a pediu e SHALL NOT aceitar um destino arbitrário.

#### Scenario: Portas alcançáveis
- **WHEN** a hospedagem está no ar e as portas respondem de fora
- **THEN** o diagnóstico mostra o endereço para o convite e o estado «alcançável»

#### Scenario: Porta inalcançável
- **WHEN** a porta TCP do servidor não responde de fora
- **THEN** o diagnóstico indica a porta e as causas prováveis, sem alterar nenhuma configuração do sistema

#### Scenario: Mídia UDP
- **WHEN** o diagnóstico termina
- **THEN** informa que a porta UDP de mídia só é confirmada por um teste de chamada com outra pessoa e oferece esse teste

#### Scenario: Destino arbitrário
- **WHEN** a verificação de fora recebe um pedido para sondar um endereço que não é o de quem pediu
- **THEN** recusa o pedido

### Requirement: Fechar a janela não derruba a instância sem aviso
Enquanto a hospedagem está ligada, fechar a janela do app SHALL perguntar se a pessoa quer manter a instância rodando na bandeja do sistema ou encerrá-la. A pessoa SHALL poder encerrar o servidor explicitamente por «Sair» e SHALL poder lembrar a escolha. Sem esse aviso, o servidor SHALL NOT continuar rodando depois que o app foi encerrado de fato. Antes de uma atualização do app que reinicie o processo, o servidor SHALL ser encerrado de forma ordenada.

#### Scenario: Fechar a janela com hospedagem ligada
- **WHEN** a pessoa fecha a janela enquanto hospeda
- **THEN** o app pergunta se mantém a instância na bandeja ou encerra

#### Scenario: Sair explicitamente
- **WHEN** a pessoa escolhe «Sair» na bandeja
- **THEN** o servidor é encerrado e o app fecha

#### Scenario: Atualização do app
- **WHEN** o app vai instalar uma atualização e reiniciar
- **THEN** o servidor é encerrado antes do reinício

### Requirement: A escuta de rede é conservadora
Com a hospedagem desligada, o app SHALL NOT escutar em nenhuma porta. Com ela ligada, o servidor SHALL escutar apenas nas portas necessárias e a pessoa SHALL ver quais são. A tela de hospedagem SHALL avisar que a instância fica exposta a quem alcançar o endereço e que o registro de contas segue a política de convites da instância.

#### Scenario: Hospedagem desligada
- **WHEN** a hospedagem está desligada
- **THEN** nenhuma porta de hospedagem escuta

#### Scenario: Aviso de exposição
- **WHEN** a pessoa liga a hospedagem
- **THEN** a tela informa as portas em uso e que a instância é alcançável por outras pessoas

### Requirement: O dono cria a conta de administrador sem digitar o token
Ao ligar a hospedagem pela primeira vez, o app SHALL registrar a instância local como a instância ativa do dono e SHALL preencher o token de configuração inicial no cadastro guiado do administrador, sem que o dono o digite. O token SHALL existir apenas em memória, SHALL NOT ser gravado em disco pelo app nem incluído no convite e SHALL deixar de ser fornecido assim que o administrador for criado. A configuração posterior da instância (registro, e-mail, voz, convites) SHALL ser feita pela tela «Configurações da instância», acessível a partir da área «Hospedar».

#### Scenario: Primeira hospedagem
- **WHEN** o dono liga a hospedagem pela primeira vez
- **THEN** o app abre o cadastro guiado do administrador da instância local com o token já preenchido

#### Scenario: Depois do administrador
- **WHEN** o administrador já foi criado
- **THEN** o app não fornece mais o token e a configuração passa a ser feita pela tela de configurações

#### Scenario: Token fora do convite
- **WHEN** o dono copia o convite de hospedagem
- **THEN** o convite não contém o token de configuração
