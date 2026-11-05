# Spec Delta

## ADDED Requirements

### Requirement: O shell aceita um certificado autoassinado somente por impressão digital fixada
O shell SHALL aceitar o certificado de uma instância apenas quando ele for válido por uma autoridade de confiança ou quando o host e a porta da instância tiverem uma impressão digital SHA-256 fixada e o certificado apresentado coincidir com ela. O shell SHALL NOT aceitar certificados autoassinados para nenhum outro host, SHALL NOT relaxar a verificação para outros endereços e SHALL aplicar a mesma regra a pedidos REST, ao WebSocket e à sinalização de voz da instância.

#### Scenario: Certificado fixado confere
- **WHEN** a instância guardada tem impressão digital fixada e o servidor apresenta o certificado correspondente
- **THEN** pedidos REST, WebSocket e sinalização de voz funcionam

#### Scenario: Certificado diferente no mesmo endereço
- **WHEN** o servidor apresenta um certificado cuja impressão digital difere da fixada
- **THEN** a conexão é recusada e a pessoa é avisada

#### Scenario: Outro host
- **WHEN** a janela tenta alcançar um host diferente com certificado autoassinado
- **THEN** a conexão é recusada

### Requirement: O shell gerencia o ciclo de vida do servidor local
O processo principal do shell SHALL iniciar, monitorar e encerrar o processo do servidor local somente por ação explícita da pessoa, SHALL encerrar o servidor e os seus processos filhos quando o app for encerrado de fato, SHALL oferecer um ícone na bandeja do sistema enquanto a hospedagem está ligada e SHALL NOT expor ao conteúdo da janela capacidades além de ligar, desligar, consultar o estado, obter o convite, diagnosticar o alcance e obter o token de configuração inicial (somente enquanto a instância local estiver em configuração).

#### Scenario: Encerramento do app
- **WHEN** o app é encerrado de fato com a hospedagem ligada
- **THEN** o servidor e o processo de mídia são encerrados

#### Scenario: Superfície exposta à janela
- **WHEN** a ponte entre janela e processo principal é inspecionada
- **THEN** ela oferece apenas ligar, desligar, estado, convite, diagnóstico e o token de configuração inicial da hospedagem
