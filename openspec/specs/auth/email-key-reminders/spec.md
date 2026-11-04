# email-key-reminders Specification

## Purpose

Lembra a pessoa, por e-mail, de criar e guardar a chave de recuperação depois do cadastro e ao criar um canal, sem nunca enviar chaves nem segredos.

## Requirements

### Requirement: Os e-mails nunca contêm chaves nem segredos

O sistema SHALL NOT incluir em nenhum e-mail a chave de recuperação, o código de recuperação, a chave secreta de identidade, uma chave de canal ou material derivado deles. O servidor SHALL NOT receber esse material para efeitos de e-mail.

#### Scenario: Conteúdo dos e-mails

- **WHEN** qualquer e-mail de lembrete é gerado
- **THEN** o corpo não contém chaves nem códigos e afirma que o serviço nunca recebe nem envia a chave da pessoa

### Requirement: E-mail de boas-vindas depois do cadastro

O sistema SHALL enviar, depois de o cadastro ser concluído com sucesso, um e-mail à conta com e-mail verificado, com um lembrete sobre a chave de recuperação adequado ao estado da conta (sem chave: recomenda criá-la; com chave: confirma que existe) e um link para a página de conta. O envio SHALL ocorrer depois do commit e a sua falha SHALL NOT afectar o cadastro.

#### Scenario: Conta nova sem chave

- **WHEN** uma conta com e-mail verificado é criada sem chave de recuperação
- **THEN** recebe um e-mail que recomenda criar a chave de recuperação

#### Scenario: Cadastro sem e-mail

- **WHEN** uma conta é criada por convite sem e-mail
- **THEN** nenhum e-mail é enviado

#### Scenario: Falha do envio

- **WHEN** o provedor falha ao enviar
- **THEN** o cadastro permanece concluído e a sessão é aberta

### Requirement: Lembrete ao criar um canal

Quando uma conta com e-mail verificado cria um canal, o sistema SHALL enviar-lhe um lembrete sobre a chave de recuperação se, e só se, a preferência de lembretes estiver activa, a conta não tiver chave de recuperação, não tiver sido enviado um lembrete de canal nas últimas 24 horas e não tiverem já sido enviados três lembretes de canal. Só a criação de canal pedida pela própria conta SHALL contar; canais criados automaticamente pelo sistema SHALL NOT gerar lembrete. A falha do envio SHALL NOT afectar a criação do canal.

#### Scenario: Primeiro canal sem chave

- **WHEN** uma conta sem chave de recuperação cria um canal
- **THEN** recebe um lembrete e o instante do envio fica registado

#### Scenario: Vários canais seguidos

- **WHEN** a mesma conta cria outro canal dentro de 24 horas
- **THEN** nenhum novo e-mail é enviado

#### Scenario: Teto de lembretes

- **WHEN** a conta já recebeu três lembretes de canal e cria outro canal, passadas 24 horas
- **THEN** nenhum e-mail é enviado

#### Scenario: Canal criado automaticamente

- **WHEN** um servidor é criado e o sistema cria o seu canal inicial
- **THEN** nenhum lembrete é enviado

#### Scenario: Conta com chave de recuperação

- **WHEN** uma conta com chave de recuperação cria um canal
- **THEN** nenhum e-mail é enviado

### Requirement: Preferência para desligar lembretes

O sistema SHALL ter por conta uma preferência de lembretes, activa por omissão, alterável pela própria conta autenticada, e SHALL respeitá-la em todos os lembretes de canal. Cada e-mail SHALL indicar onde a alterar. O cliente SHALL mostrar o interruptor apenas quando o recurso de lembretes estiver activo na instância, e a configuração pública de registo SHALL informar esse estado.

#### Scenario: Recurso desligado na instância

- **WHEN** a instância tem o recurso de lembretes desligado
- **THEN** a configuração pública informa `key_reminders: false` e a página de conta não mostra o interruptor

#### Scenario: Recurso activo na instância

- **WHEN** a instância tem o recurso de lembretes activo
- **THEN** a configuração pública informa `key_reminders: true` e a página de conta mostra o interruptor

#### Scenario: Lembretes desligados

- **WHEN** a conta desliga os lembretes e cria um canal
- **THEN** nenhum lembrete é enviado

### Requirement: Alterações aditivas

As alterações SHALL ser aditivas e SHALL NOT mudar o comportamento da criação de canais nem do cadastro para quem não tem e-mail.

#### Scenario: Conta sem e-mail

- **WHEN** uma conta sem e-mail cria um canal
- **THEN** o resultado é igual ao anterior a esta change
