# Spec Delta

## ADDED Requirements

### Requirement: O endereço da instância assume HTTPS

Quando a pessoa indica a instância, no primeiro arranque ou ao trocar de instância, o sistema SHALL aceitar um host sem esquema (por exemplo `chat.1nodado.com.br`) e SHALL tratá-lo como `https://` nesse host. SHALL aceitar um endereço que já comece por `https://` e SHALL guardar só a origem. SHALL recusar um endereço `http://` e SHALL NOT avançar nem guardá-lo. A validação continua a ser `GET /health` com `{ "ok": true }` antes de guardar.

#### Scenario: Host sem esquema

- **WHEN** a pessoa escreve `chat.1nodado.com.br` e o `GET /health` dessa origem HTTPS responde `{ "ok": true }`
- **THEN** a instância guardada é `https://chat.1nodado.com.br` e o ecrã de autenticação dessa instância aparece a seguir

#### Scenario: Endereço HTTPS colado

- **WHEN** a pessoa cola `https://chat.1nodado.com.br` e o `/health` responde com sucesso
- **THEN** a instância guardada é `https://chat.1nodado.com.br`

#### Scenario: HTTP recusado

- **WHEN** a pessoa indica um endereço que começa por `http://`
- **THEN** o sistema explica que a instância tem de ser HTTPS, não guarda o endereço e não avança para a autenticação
