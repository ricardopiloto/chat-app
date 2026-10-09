# Spec Delta

## Purpose

Define como o token de sessão de uma conta é transportado entre o cliente e o backend — por cookie (cliente web, same-origin) ou por header `Authorization` (clientes nativos, cross-origin) — mantendo uma única sessão subjacente por token em ambos os casos.

## ADDED Requirements

### Requirement: Login, registo e reset devolvem o token de sessão no corpo

Quando uma conta autentica com sucesso via login, registo, ou um dos fluxos de reset de password que criam sessão, o sistema SHALL definir o cookie de sessão exactamente como hoje (HttpOnly, SameSite=Strict, Secure conforme configuração) E SHALL incluir o mesmo token de sessão, em claro, num campo do corpo JSON da resposta. O sistema SHALL NOT alterar o comportamento do cookie existente.

#### Scenario: Login devolve cookie e token no corpo

- **WHEN** uma conta faz login com credenciais válidas
- **THEN** a resposta define o cookie de sessão como hoje E o corpo JSON inclui o token de sessão em claro

#### Scenario: Registo devolve cookie e token no corpo

- **WHEN** uma conta nova regista-se com sucesso
- **THEN** a resposta define o cookie de sessão como hoje E o corpo JSON inclui o token de sessão em claro

#### Scenario: Reset de password com sessão resultante devolve token no corpo

- **WHEN** um fluxo de reset de password (senha actual, chave de recuperação, ou código do operador) termina a criar uma nova sessão
- **THEN** a resposta define o cookie de sessão como hoje E o corpo JSON inclui o token de sessão em claro

### Requirement: Autenticação REST aceita o token por cookie ou por header Authorization

O sistema SHALL autenticar um pedido REST usando o token de sessão presente no cookie quando esse cookie corresponder a uma sessão válida. Quando não houver cookie, ou o cookie não corresponder a uma sessão válida, o sistema SHALL tentar autenticar usando o token presente no header `Authorization: Bearer <token>`, validado da mesma forma (mesmo hash, mesma tabela de sessões, mesma verificação de validade). Um pedido sem sessão válida por nenhum dos dois transportes SHALL ser tratado como não autenticado.

#### Scenario: Cookie válido autentica como hoje

- **WHEN** um pedido chega com um cookie de sessão válido e sem header Authorization
- **THEN** o pedido é autenticado com a conta dessa sessão

#### Scenario: Header Authorization autentica sem cookie

- **WHEN** um pedido chega sem cookie de sessão mas com header `Authorization: Bearer <token>` correspondente a uma sessão válida
- **THEN** o pedido é autenticado com a conta dessa sessão

#### Scenario: Nenhum transporte válido não autentica

- **WHEN** um pedido chega sem cookie de sessão válido e sem header Authorization válido
- **THEN** o pedido é tratado como não autenticado (401 num endpoint que exige sessão, ou sessão ausente num endpoint opcional)

#### Scenario: Cookie inválido cai para o header

- **WHEN** um pedido chega com um cookie de sessão que já não é válido (sessão expirada ou revogada) e com um header Authorization válido para outra sessão
- **THEN** o pedido é autenticado com a conta da sessão do header

### Requirement: O handshake de WebSocket aceita o mesmo header Authorization

O sistema SHALL autenticar a abertura de uma ligação de WebSocket usando o cookie de sessão quando presente e válido, e SHALL aceitar o header `Authorization: Bearer <token>` como alternativa quando o cookie estiver ausente ou inválido, com a mesma validação usada nos pedidos REST.

#### Scenario: Ligação WebSocket autenticada por header

- **WHEN** um cliente abre a ligação de WebSocket definindo o header `Authorization: Bearer <token>` com um token de sessão válido, sem cookie de sessão
- **THEN** a ligação é estabelecida autenticada com a conta dessa sessão

#### Scenario: Ligação WebSocket sem transporte válido é recusada

- **WHEN** um cliente tenta abrir a ligação de WebSocket sem cookie de sessão válido e sem header Authorization válido
- **THEN** a ligação é recusada da mesma forma que já é hoje para um pedido sem sessão

### Requirement: Logout invalida o token para ambos os transportes

Quando uma conta termina sessão, o sistema SHALL invalidar o token de sessão subjacente na base de dados. Como o cookie e o header Authorization transportam o mesmo token, essa invalidação SHALL impedir a autenticação por qualquer um dos dois transportes a partir desse momento.

#### Scenario: Logout invalida o uso por header

- **WHEN** uma conta termina sessão e, a seguir, um pedido usa o token que tinha sido devolvido no corpo dessa sessão via header Authorization
- **THEN** o pedido é tratado como não autenticado

#### Scenario: Logout invalida o uso por cookie

- **WHEN** uma conta termina sessão e, a seguir, um pedido usa o cookie dessa sessão
- **THEN** o pedido é tratado como não autenticado, tal como já acontece hoje
