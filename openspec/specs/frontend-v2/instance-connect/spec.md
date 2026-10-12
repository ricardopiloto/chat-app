# instance-connect Specification

## Purpose

Permite que a mesma aplicação SolidJS, quando carregada dentro do shell nativo (em vez de um browser), escolha e recorde a que instância Mesa se liga, e troque o transporte de autenticação e de tempo real em conformidade — sem alterar nada do comportamento existente quando é servida por um browser na mesma origem do backend.

## Requirements

### Requirement: O build web nunca mostra selecção de instância

Quando a aplicação corre num browser comum (não dentro do shell nativo), o sistema SHALL NOT apresentar qualquer ecrã de selecção/configuração de instância, e SHALL continuar a assumir que o backend está na mesma origem de onde a aplicação foi servida, exactamente como antes desta change.

#### Scenario: Acesso normal pelo browser

- **WHEN** a aplicação é aberta num browser comum, servida pela mesma origem do backend
- **THEN** o ecrã de login aparece directamente, sem qualquer passo de selecção de instância, e todos os pedidos continuam relativos à origem actual

### Requirement: Primeira execução no shell nativo pede a instância

Quando a aplicação corre dentro do shell nativo e não há nenhuma instância guardada, o sistema SHALL apresentar um ecrã que pede o endereço base de uma instância Mesa antes de qualquer ecrã de autenticação, SHALL validar o endereço contactando `GET /health` dessa instância, e SHALL recusar avançar enquanto essa validação não for bem-sucedida, mostrando o motivo da falha (endereço inacessível, resposta inesperada, etc.).

#### Scenario: Primeira execução, endereço válido

- **WHEN** a aplicação nativa arranca sem instância guardada e o utilizador introduz um endereço cujo `/health` responde com sucesso
- **THEN** o endereço é guardado como a instância activa e o ecrã de autenticação normal da instância é apresentado a seguir

#### Scenario: Endereço inacessível

- **WHEN** o utilizador introduz um endereço que não responde, ou responde com erro, em `/health`
- **THEN** o sistema mostra uma mensagem explicando a falha e não guarda esse endereço nem avança para a autenticação

### Requirement: A instância guardada é reutilizada em arranques seguintes

Quando a aplicação corre dentro do shell nativo e já existe uma instância guardada de uma execução anterior, o sistema SHALL ir directamente para o ecrã de autenticação dessa instância, sem repetir o passo de selecção.

#### Scenario: Arranque seguinte com instância guardada

- **WHEN** a aplicação nativa arranca e existe uma instância guardada de uma sessão anterior
- **THEN** o ecrã de selecção de instância não aparece, e os pedidos (autenticação, dados, tempo real) dirigem-se a essa instância

### Requirement: Trocar de instância é uma acção explícita e termina a sessão

No cliente nativo, com uma instância já guardada, o sistema SHALL oferecer "Trocar de instância" no ecrã de entrar e no de criar conta, antes de autenticar, e SHALL continuar a oferecê-la depois de autenticado, junto de "Trocar de conta" e de terminar sessão, e no ecrã de desbloqueio. Escolher a acção SHALL terminar a sessão corrente, quando existir, SHALL esquecer a instância guardada e SHALL voltar ao ecrã que pede o endereço. O sistema SHALL NOT guardar mais do que uma instância activa em simultâneo. O browser servido pela própria instância SHALL NOT mostrar esta acção.

#### Scenario: Trocar de instância

- **WHEN** um utilizador autenticado escolhe "Trocar de instância"
- **THEN** a sessão corrente termina (equivalente a logout), a instância guardada é substituída pela escolha seguinte, e os dados em cache da instância anterior deixam de ser usados

#### Scenario: Trocar antes de entrar

- **WHEN** o cliente nativo já tem uma instância guardada e a pessoa está no ecrã de entrar ou de criar conta e escolhe "Trocar de instância"
- **THEN** o endereço guardado é esquecido e o ecrã que pede a instância volta a aparecer, sem usar o endereço anterior

#### Scenario: O browser não mostra a acção

- **WHEN** a aplicação é aberta num browser servido pela própria instância
- **THEN** não existe "Trocar de instância" no ecrã de entrar

### Requirement: Modo nativo autentica por token, não por cookie

Quando a aplicação corre dentro do shell nativo com uma instância configurada, o sistema SHALL autenticar todos os pedidos REST com o header `Authorization: Bearer <token>`, usando o `session_token` devolvido pelo login/registo/recuperação (ver `native-client-auth`), e SHALL NOT depender de cookies de sessão para esse transporte.

#### Scenario: Pedido autenticado em modo nativo

- **WHEN** a aplicação nativa, já autenticada, faz um pedido a um recurso protegido
- **THEN** o pedido inclui o header `Authorization: Bearer <token>` e não depende de qualquer cookie

### Requirement: A ligação de tempo real em modo nativo transporta o mesmo token

Quando a aplicação corre dentro do shell nativo, o sistema SHALL estabelecer a ligação de tempo real (hoje `/ws`) autenticada com o mesmo token de sessão, usando um mecanismo compatível com a API `WebSocket` padrão (o `WebSocket` de um browser/Chromium não permite definir o header `Authorization` directamente na negociação, mas permite declarar sub-protocolos, enviados no header `Sec-WebSocket-Protocol` — ver `auth/session-tokens`). O comportamento observável de reconexão, re-sincronização e detecção de sessão terminada SHALL permanecer o mesmo que no build web.

#### Scenario: Ligação de tempo real autenticada por token

- **WHEN** a aplicação nativa estabelece a ligação de tempo real
- **THEN** a ligação é aceite com o mesmo token usado nos pedidos REST, sem depender de cookie

#### Scenario: Sessão terminada é detectada da mesma forma

- **WHEN** a sessão usada pela aplicação nativa deixa de ser válida (logout noutro local, expiração)
- **THEN** a aplicação detecta a perda de sessão e volta ao ecrã de autenticação, tal como já acontece hoje no build web

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
