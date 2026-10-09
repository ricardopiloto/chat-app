# server-isolation Specification

## Purpose

Garante que uma conta autenticada que não é membro de um servidor não lê o histórico de um canal que existe nesse servidor, e que a recusa é de permissão, não de canal inexistente.

## Requirements

### Requirement: Estranho recebe recusa de permissão no histórico

O sistema SHALL recusar com 403 o pedido de histórico de um canal que existe quando a conta está autenticada e não é membro do servidor desse canal, e SHALL NOT devolver mensagens. Essa recusa SHALL ser a mesma já usada ao listar os canais desse servidor. O sistema SHALL NOT responder 404 nesse caso.

#### Scenario: Histórico de outro servidor

- **WHEN** a conta C, autenticada e membro apenas do servidor Beta, pede o histórico de um canal de texto que existe no servidor Alpha
- **THEN** a resposta é 403 e não inclui mensagens

#### Scenario: A lista de canais já recusa da mesma forma

- **WHEN** a mesma conta C pede a lista de canais do servidor Alpha
- **THEN** a resposta também é 403

### Requirement: Ausência real continua 404

O sistema SHALL responder 404 quando o canal não existe. O sistema SHALL responder 404 quando a conta é membro do servidor mas não tem permissão de ver esse canal. Um membro com permissão de ver SHALL continuar a receber o histórico.

#### Scenario: Canal inexistente

- **WHEN** uma conta autenticada pede o histórico de um identificador de canal que não existe
- **THEN** a resposta é 404

#### Scenario: Membro sem permissão de ver

- **WHEN** um membro do servidor pede o histórico de um canal que existe mas que ele não pode ver
- **THEN** a resposta é 404

#### Scenario: Membro que pode ver

- **WHEN** um membro com permissão de ver pede o histórico do canal
- **THEN** recebe o histórico que já conseguia ler

### Requirement: Acções no canal existente não mentem a existência

Quando uma conta autenticada que não é membro do servidor pratica outra acção sobre um canal que existe, e essa acção hoje responde 404 como se o canal não existisse, o sistema SHALL responder 403. Um canal que não existe SHALL continuar 404. Um pedido sem sessão SHALL continuar 401.

#### Scenario: Sem sessão

- **WHEN** um pedido de histórico chega sem sessão
- **THEN** a resposta é 401

#### Scenario: Não-membro noutra acção do canal existente

- **WHEN** uma conta autenticada que não é membro do servidor envia uma mensagem, ou outra acção equivalente, para um canal que existe
- **THEN** a resposta é 403 e não 404
