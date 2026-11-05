# Spec Delta

## MODIFIED Requirements

### Requirement: O endereço da instância assume HTTPS

Quando a pessoa indica a instância, no primeiro arranque ou ao trocar de instância, o sistema SHALL aceitar um host sem esquema (por exemplo `chat.1nodado.com.br`) e SHALL tratá-lo como `https://` nesse host. SHALL aceitar um endereço que já comece por `https://` e SHALL guardar só a origem. SHALL recusar um endereço `http://` e SHALL NOT avançar nem guardá-lo. A validação continua a ser `GET /health` com `{ "ok": true }` antes de guardar. SHALL também aceitar o convite de uma instância local de hospedagem (endereço, porta e impressão digital SHA-256 do certificado), SHALL guardar a origem `https://` correspondente juntamente com a impressão digital fixada e SHALL validar o certificado autoassinado dessa instância exclusivamente por essa impressão digital. Para qualquer instância sem impressão digital fixada, SHALL continuar a exigir um certificado válido por uma autoridade de confiança.

#### Scenario: Host sem esquema

- **WHEN** a pessoa escreve `chat.1nodado.com.br` e o `GET /health` dessa origem HTTPS responde `{ "ok": true }`
- **THEN** a instância guardada é `https://chat.1nodado.com.br` e o ecrã de autenticação dessa instância aparece a seguir

#### Scenario: Endereço HTTPS colado

- **WHEN** a pessoa cola `https://chat.1nodado.com.br` e o `/health` responde com sucesso
- **THEN** a instância guardada é `https://chat.1nodado.com.br`

#### Scenario: HTTP recusado

- **WHEN** a pessoa indica um endereço que começa por `http://`
- **THEN** o sistema explica que a instância tem de ser HTTPS, não guarda o endereço e não avança para a autenticação

#### Scenario: Convite de instância local

- **WHEN** a pessoa cola um convite de hospedagem com endereço, porta e impressão digital, e o certificado apresentado coincide com a impressão digital
- **THEN** o `GET /health` responde com sucesso, a instância é guardada com a impressão digital fixada e o ecrã de autenticação aparece a seguir

#### Scenario: Impressão digital divergente

- **WHEN** o certificado apresentado pelo endereço do convite não coincide com a impressão digital
- **THEN** o sistema recusa a conexão, explica que o certificado não confere e não guarda a instância

#### Scenario: Certificado autoassinado sem convite

- **WHEN** a pessoa indica `https://` para um servidor com certificado autoassinado e sem impressão digital fixada
- **THEN** o sistema recusa a conexão como qualquer certificado inválido
