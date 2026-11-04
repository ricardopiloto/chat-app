# email-password-reset Specification

## Purpose

Permite começar a recuperação de conta só com o e-mail verificado, encaminhando para o fluxo de recuperação por chave, sem que o e-mail autorize por si só qualquer reset e sem que o servidor conheça qualquer chave.

## Requirements

### Requirement: Pedido de recuperação por e-mail com resposta uniforme

O sistema SHALL aceitar, sem autenticação, um pedido de recuperação com um e-mail e SHALL responder sempre com a mesma resposta de sucesso, haja ou não conta com esse e-mail verificado, e quer o limite por e-mail tenha sido atingido ou o honeypot preenchido. Só contas com e-mail verificado SHALL receber mensagem. O pedido SHALL estar sujeito aos limites por IP e por e-mail canonicalizado e SHALL poder ser desligado por configuração da instância.

#### Scenario: Conta com e-mail verificado e chave de recuperação

- **WHEN** é pedida a recuperação para o e-mail verificado de uma conta com chave de recuperação
- **THEN** a resposta é o sucesso genérico e a conta recebe um e-mail com o handle e um link para a tela de recuperação por chave

#### Scenario: Conta com e-mail verificado sem chave

- **WHEN** é pedida a recuperação para o e-mail verificado de uma conta sem chave de recuperação
- **THEN** a resposta é a mesma e a conta recebe um e-mail que explica que o reset exige o código do operador, sem link de reset

#### Scenario: E-mail desconhecido

- **WHEN** é pedida a recuperação para um e-mail sem conta
- **THEN** a resposta é idêntica e nenhum e-mail é enviado

#### Scenario: Limite excedido

- **WHEN** um IP excede o limite de pedidos
- **THEN** os pedidos seguintes recebem 429

### Requirement: O e-mail nunca autoriza um reset

O sistema SHALL NOT repor a senha nem substituir a identidade de uma conta com base apenas na posse do e-mail. O e-mail SHALL NOT conter token, código de recuperação, chave ou segredo. O link SHALL levar à tela de recuperação por chave, e a reposição da senha SHALL continuar a exigir a prova pela chave de recuperação (ou o código do operador).

#### Scenario: Link aberto sem a chave

- **WHEN** a pessoa abre o link de uma conta com chave mas não tem o código de recuperação
- **THEN** não consegue repor a senha

#### Scenario: Conteúdo do e-mail

- **WHEN** o e-mail de recuperação é gerado
- **THEN** não contém token, chave nem código, e só liga ao endereço público da instância

### Requirement: Link com o handle fora de logs de proxy

O link SHALL transportar o handle no fragmento do URL, e a tela de recuperação SHALL seleccionar o caminho «com a chave», preencher o handle e limpar o fragmento do URL.

#### Scenario: Abrir o link

- **WHEN** a pessoa abre o link do e-mail
- **THEN** a tela mostra o caminho com chave e o handle preenchido, e o fragmento deixa de constar do URL

### Requirement: Aviso de senha alterada

Concluído um reset por chave de recuperação ou por código do operador, o sistema SHALL enviar à conta com e-mail verificado um e-mail de aviso, sem link de acção, depois de a transacção estar concluída. A falha do envio SHALL NOT afectar o reset. Uma alteração de senha com sessão SHALL NOT disparar este aviso.

#### Scenario: Reset por chave concluído

- **WHEN** uma conta com e-mail verificado conclui a recuperação por chave
- **THEN** recebe um e-mail de aviso

#### Scenario: Alteração de senha com sessão

- **WHEN** a conta altera a senha estando autenticada
- **THEN** nenhum aviso de reset é enviado

### Requirement: Compatibilidade com os fluxos existentes

O código do operador e o reset por chave de recuperação SHALL continuar a funcionar sem e-mail e sem alteração de contrato. As alterações SHALL ser aditivas.

#### Scenario: Conta sem e-mail

- **WHEN** uma conta sem e-mail usa o código do operador ou a chave
- **THEN** o resultado é igual ao anterior a esta change
