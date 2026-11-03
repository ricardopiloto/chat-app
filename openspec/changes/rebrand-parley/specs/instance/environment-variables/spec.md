# Spec Delta

## Purpose

Define como a instância, o cliente de desenvolvimento e o shell desktop leem a configuração por variáveis de ambiente, usando o prefixo `PARLEY_` e impedindo que variáveis `MESA_*` esquecidas desliguem proteções em silêncio.

## ADDED Requirements

### Requirement: Variáveis de configuração usam o prefixo PARLEY_

O sistema SHALL ler as variáveis de configuração documentadas com o prefixo `PARLEY_` (`PARLEY_PRODUCTION`, `PARLEY_ENV`, `PARLEY_RATE_LIMIT_DISABLED`, `PARLEY_BACKEND`, `PARLEY_BACKEND_WS`, `PARLEY_DEV_PORT`, `PARLEY_ELECTRON_DEV`), com o mesmo significado das antigas `MESA_*`. O sistema SHALL NOT ler as variáveis `MESA_*` como configuração.

#### Scenario: Modo produção com a variável nova
- **WHEN** a instância arranca com `PARLEY_PRODUCTION=1`
- **THEN** o modo de produção fica ativo, com a recusa das credenciais de exemplo do LiveKit e a exigência de cookie seguro

#### Scenario: Variável antiga não tem efeito em desenvolvimento
- **WHEN** o cliente de desenvolvimento arranca com `MESA_DEV_PORT=1500` e sem `PARLEY_DEV_PORT`
- **THEN** usa a porta padrão e ignora `MESA_DEV_PORT`

### Requirement: O backend recusa partir com variáveis MESA_ descontinuadas

O backend SHALL recusar arrancar, com erro que nomeia a variável antiga e a nova, quando `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED` estiver definida no ambiente, independentemente de a variável `PARLEY_*` equivalente também estar definida.

#### Scenario: Deploy esquecido com a variável antiga
- **WHEN** o backend arranca com `MESA_PRODUCTION=1` e sem `PARLEY_PRODUCTION`
- **THEN** o processo termina com erro que diz para renomear `MESA_PRODUCTION` para `PARLEY_PRODUCTION`, e não aceita pedidos

#### Scenario: Ambiente limpo
- **WHEN** o backend arranca sem nenhuma variável `MESA_*` descontinuada
- **THEN** arranca normalmente
