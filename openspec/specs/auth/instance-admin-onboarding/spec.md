# instance-admin-onboarding Specification

## Purpose

Torna explícito, na primeira utilização de uma instância, que a pessoa está a criar a conta de administrador da instância, sem conceder por agora quaisquer permissões adicionais.

## Requirements

### Requirement: Estado de configuração inicial da instância

O sistema SHALL expor, sem autenticação, o estado de configuração inicial da instância, que SHALL ser verdadeiro se, e só se, não existir nenhuma conta. O estado SHALL ser derivado dos dados e SHALL passar a falso assim que a primeira conta for criada. A resposta SHALL conter apenas esse estado e o endpoint SHALL estar sujeito a limite por IP.

#### Scenario: Instância vazia

- **WHEN** um cliente consulta o estado numa instância sem contas
- **THEN** a resposta indica configuração inicial

#### Scenario: Depois da primeira conta

- **WHEN** a primeira conta é criada e o estado é consultado de novo
- **THEN** a resposta indica que a instância está pronta

#### Scenario: Limite por IP

- **WHEN** um IP excede o limite de consultas na janela
- **THEN** as consultas seguintes recebem 429

### Requirement: Cadastro guiado da conta de administrador

Quando a instância está em configuração inicial, o cliente SHALL apresentar o cadastro como a criação da conta de administrador da instância, explicando o papel antes do envio, SHALL NOT pedir nem aceitar código de convite nessa variante SHALL esconder a escolha entre entrar e cadastrar (não há contas para entrar), SHALL mostrar antes de tudo que por agora a conta não tem permissões extras e SHALL oferecer a criação da chave de recuperação em destaque, seleccionada por padrão. O cliente SHALL consultar o estado uma única vez ao abrir a tela de autenticação, e só depois de haver uma instância configurada, e SHALL abrir directamente no cadastro guiado quando a instância estiver em configuração inicial, sem passar antes pela tela de entrar. Se o estado não puder ser obtido, o cliente SHALL apresentar o cadastro normal.

#### Scenario: Primeiro uso

- **WHEN** a pessoa abre a aplicação numa instância vazia
- **THEN** a primeira tela já é o cadastro guiado e vê que está a criar a conta de administrador da instância, sem campo de convite, com a chave de recuperação em destaque

#### Scenario: Convite no URL numa instância vazia

- **WHEN** o cadastro é aberto com um código de convite numa instância vazia
- **THEN** a variante de configuração inicial é mostrada e o convite não é usado

#### Scenario: Consulta única

- **WHEN** a pessoa alterna entre os modos da tela de autenticação numa instância já pronta
- **THEN** o estado não é consultado de novo

#### Scenario: Sem opção de entrar

- **WHEN** a variante de configuração inicial é mostrada
- **THEN** não há seletor de entrar e a chave de recuperação vem seleccionada por padrão

#### Scenario: Convite com a instância já pronta

- **WHEN** a instância já tem contas e o cadastro é aberto com um código de convite
- **THEN** o cadastro normal é mostrado e o convite é usado

#### Scenario: Falha ao consultar o estado

- **WHEN** a consulta do estado falha
- **THEN** o cadastro normal é apresentado e a regra do servidor continua a valer

#### Scenario: Corrida com outra pessoa

- **WHEN** outra pessoa cria a primeira conta entre a consulta e o envio
- **THEN** o servidor recusa o cadastro e o cliente volta ao cadastro normal

### Requirement: A conta de administrador é identificada sem permissões novas

A conta criada com a instância vazia SHALL ser identificada na interface como «Administrador da instância» e SHALL ser informada, na própria conta, de que por agora não tem permissões adicionais. O sistema SHALL NOT conceder a essa conta qualquer acesso diferente do de uma conta normal, nem associá-la a um servidor.

#### Scenario: Boas-vindas após o cadastro

- **WHEN** a conta de administrador acaba de ser criada
- **THEN** vê uma vez uma mensagem que explica o papel e que por agora não tem permissões extras

#### Scenario: Selo na conta

- **WHEN** a conta de administrador abre a sua página de conta
- **THEN** vê o selo de administrador da instância e a nota de que não tem permissões extras

#### Scenario: Sem acesso diferenciado

- **WHEN** a conta de administrador acede a servidores, canais ou configurações
- **THEN** as regras de acesso são as mesmas de qualquer outra conta

#### Scenario: Conta comum

- **WHEN** uma conta que não é a primeira abre a sua página de conta
- **THEN** não vê o selo de administrador

### Requirement: Contrato de registo inalterado

O contrato de `POST /api/auth/register` e a marcação da primeira conta como administrador SHALL permanecer como antes; as alterações SHALL ser aditivas.

#### Scenario: Cliente antigo

- **WHEN** um cliente que não conhece o estado da instância regista a primeira conta
- **THEN** a conta é criada como administrador, como antes
