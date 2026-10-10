# Spec Delta

## ADDED Requirements

### Requirement: O handshake de WebSocket aceita o token como sub-protocolo

O sistema SHALL autenticar a abertura de uma ligação de WebSocket usando o token de sessão quando enviado como um dos valores do header `Sec-WebSocket-Protocol` (negociação de sub-protocolo do `WebSocket`), com a mesma validação usada para o cookie e para o header `Authorization` (mesmo hash, mesma tabela de sessões, mesma verificação de validade). Este transporte é uma alternativa aos já existentes (cookie, header `Authorization`) — nenhum dos dois muda de comportamento.

#### Scenario: Ligação WebSocket autenticada por sub-protocolo

- **WHEN** um cliente abre a ligação de WebSocket declarando o token de sessão como sub-protocolo (`Sec-WebSocket-Protocol`), sem cookie de sessão e sem header `Authorization`
- **THEN** a ligação é estabelecida autenticada com a conta dessa sessão

#### Scenario: Precedência quando mais de um transporte está presente

- **WHEN** um pedido de ligação WebSocket chega com mais do que um dos três transportes (cookie, header `Authorization`, sub-protocolo)
- **THEN** o sistema usa o primeiro que corresponder a uma sessão válida, pela mesma ordem já estabelecida (cookie primeiro, depois header), com o sub-protocolo como última alternativa

#### Scenario: Logout invalida também o uso por sub-protocolo

- **WHEN** uma conta termina sessão e, a seguir, um pedido de ligação WebSocket usa o token dessa sessão como sub-protocolo
- **THEN** a ligação é recusada da mesma forma que já acontece hoje para os outros dois transportes
