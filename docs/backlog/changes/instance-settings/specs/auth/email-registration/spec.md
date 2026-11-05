# Spec Delta

## MODIFIED Requirements

### Requirement: Modo de registo configurável

O sistema SHALL ter um modo de registo `fechado` ou `aberto`, definido pela configuração da instância (variável de ambiente `REGISTO_MODO`, se definida, ou valor gravado pelo administrador), com `fechado` como padrão quando ausente. Um valor inválido SHALL impedir o arranque se vier de variável de ambiente e SHALL ser recusado, sem gravar, se vier do administrador. Um endpoint público de configuração SHALL informar o modo e a chave pública do captcha, se existir.

#### Scenario: Modo padrão

- **WHEN** a instância arranca sem modo definido
- **THEN** o modo é `fechado` e o comportamento do registo é o anterior a esta change

#### Scenario: Valor inválido

- **WHEN** a instância arranca com um modo que não é `fechado` nem `aberto`
- **THEN** o arranque falha com mensagem explícita

#### Scenario: Modo gravado pelo administrador

- **WHEN** não há variável de ambiente e o administrador grava o modo `aberto` com os requisitos de e-mail atendidos
- **THEN** o próximo cadastro já usa o modo `aberto`

### Requirement: IP do cliente atrás de proxy confiável

O sistema SHALL determinar o IP usado pelos limites de verificação de e-mail a partir do cabeçalho `X-Real-IP` somente quando a configuração de proxy confiável (`TRUSTED_PROXY`, vinda da variável de ambiente ou gravada pelo administrador) está activa **e** a ligação TCP vem de loopback; caso contrário SHALL usar o IP do peer TCP, como hoje. Os limitadores de login e registo já existentes SHALL manter o comportamento actual. Com o modo `aberto` em produção, o arranque e a gravação da configuração SHALL falhar se o proxy confiável não estiver activo.

#### Scenario: Pedidos de IPs diferentes atrás do proxy

- **WHEN** o proxy confiável está activo e dois pedidos chegam de loopback com `X-Real-IP` distintos
- **THEN** cada IP tem o seu próprio balde de limite

#### Scenario: Cabeçalho forjado

- **WHEN** um pedido chega de um peer que não é loopback com `X-Real-IP` arbitrário, ou o proxy confiável está inactivo
- **THEN** o cabeçalho é ignorado e o limite usa o IP do peer

#### Scenario: Registro aberto sem proxy confiável

- **WHEN** o administrador tenta gravar o modo `aberto` em produção com o proxy confiável inativo
- **THEN** a gravação é recusada com a explicação
