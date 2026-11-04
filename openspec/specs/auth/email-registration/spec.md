# email-registration Specification

## Purpose

Permite criar uma conta provando antes a posse de um e-mail, e abrir o registo a quem não tem convite quando a instância o permitir, sem enfraquecer o cadastro com chaves E2E gerado no cliente.

## Requirements

### Requirement: Modo de registo configurável

O sistema SHALL ter um modo de registo `fechado` ou `aberto`, definido por configuração da instância, com `fechado` como padrão quando ausente. Um valor inválido SHALL impedir o arranque. Um endpoint público de configuração SHALL informar o modo e a chave pública do captcha, se existir.

#### Scenario: Modo padrão

- **WHEN** a instância arranca sem modo definido
- **THEN** o modo é `fechado` e o comportamento do registo é o anterior a esta change

#### Scenario: Valor inválido

- **WHEN** a instância arranca com um modo que não é `fechado` nem `aberto`
- **THEN** o arranque falha com mensagem explícita

### Requirement: Pedido de verificação de e-mail com resposta genérica

O sistema SHALL aceitar, sem autenticação, um pedido de verificação com e-mail e aceite de termos e SHALL responder com a mesma resposta de sucesso (`202`), independentemente de o e-mail ter ou não conta, de o limite por e-mail ter sido atingido, de o honeypot vir preenchido ou de o envio ter falhado. O pedido SHALL ser recusado, com código de erro estável, quando o modo é `fechado` (`registration_closed`), quando falta o aceite (`terms_required`), quando o formato do e-mail é inválido (`email_invalid`), quando o domínio é descartável (`email_domain_blocked`) ou quando o captcha configurado falha (`captcha_failed`). Com o honeypot preenchido o sistema SHALL responder como sucesso e SHALL NOT enviar e-mail. Se o captcha estiver configurado, o pedido SHALL exigir um token válido.

#### Scenario: E-mail novo

- **WHEN** no modo `aberto` é pedido um e-mail sem conta, com aceite
- **THEN** a resposta é de sucesso genérico e é enviado um e-mail com um link de verificação

#### Scenario: E-mail que já tem conta

- **WHEN** é pedido um e-mail já associado a uma conta
- **THEN** a resposta é idêntica à do e-mail novo e é enviado um aviso de que a conta já existe, sem link de cadastro

#### Scenario: Modo fechado

- **WHEN** o modo é `fechado` e chega um pedido de verificação
- **THEN** o pedido é recusado com `registration_closed` e nenhum e-mail é enviado

#### Scenario: Domínio descartável

- **WHEN** o e-mail pertence a um domínio descartável
- **THEN** o pedido é recusado com `email_domain_blocked` e nenhum e-mail é enviado

#### Scenario: Honeypot

- **WHEN** o campo honeypot vem preenchido
- **THEN** a resposta é igual à de sucesso e nenhum e-mail é enviado

### Requirement: Limites de pedidos de verificação

O sistema SHALL limitar os pedidos de verificação por IP do cliente e por e-mail canonicalizado. A canonicalização SHALL pôr em minúsculas, remover a etiqueta `+…` e, para `gmail.com` e `googlemail.com`, remover pontos e normalizar o domínio. O limite por IP SHALL responder 429. O limite por e-mail SHALL ser silencioso (resposta genérica, sem envio) e igual para e-mail novo e já registado.

#### Scenario: Muitos pedidos do mesmo IP

- **WHEN** um IP excede o limite de pedidos de verificação na janela
- **THEN** os pedidos seguintes recebem 429

#### Scenario: Alias do mesmo e-mail

- **WHEN** são pedidos `a.b+x@gmail.com` e `ab@gmail.com`
- **THEN** ambos contam para o mesmo limite por e-mail

### Requirement: IP do cliente atrás de proxy confiável

O sistema SHALL determinar o IP usado pelos limites de verificação de e-mail a partir do cabeçalho `X-Real-IP` somente quando `TRUSTED_PROXY` está activo **e** a ligação TCP vem de loopback; caso contrário SHALL usar o IP do peer TCP, como hoje. Os limitadores de login e registo já existentes SHALL manter o comportamento actual. Com o modo `aberto` em produção, o arranque SHALL falhar se `TRUSTED_PROXY` não estiver activo.

#### Scenario: Pedidos de IPs diferentes atrás do proxy

- **WHEN** `TRUSTED_PROXY` está activo e dois pedidos chegam de loopback com `X-Real-IP` distintos
- **THEN** cada IP tem o seu próprio balde de limite

#### Scenario: Cabeçalho forjado

- **WHEN** um pedido chega de um peer que não é loopback com `X-Real-IP` arbitrário, ou `TRUSTED_PROXY` está inactivo
- **THEN** o cabeçalho é ignorado e o limite usa o IP do peer

### Requirement: Token de verificação de uso único e curta duração

O link enviado SHALL conter um token opaco no **fragmento** do URL (nunca no caminho nem na query), que SHALL ser guardado apenas como hash, SHALL expirar 5 horas após a emissão e SHALL ser consumido uma única vez. Um novo pedido para o mesmo e-mail SHALL invalidar os tokens anteriores ainda pendentes. Um endpoint público, chamado com o token no corpo do pedido, SHALL permitir validar um token sem o consumir e devolver o e-mail verificado, e SHALL responder de forma única (`email_token_invalid`) para token inexistente, expirado, consumido ou substituído.

#### Scenario: Token válido

- **WHEN** a página de cadastro valida um token dentro do prazo
- **THEN** recebe o e-mail verificado e o token continua utilizável

#### Scenario: Token expirado, consumido ou substituído

- **WHEN** o token está expirado, já foi usado para criar uma conta, ou foi invalidado por um pedido mais recente
- **THEN** a validação e o cadastro com esse token falham com o mesmo erro `email_token_invalid`

#### Scenario: Token fora de logs de proxy

- **WHEN** o link é aberto e validado
- **THEN** o token não consta de nenhum caminho nem query string enviados ao servidor

### Requirement: Cadastro com e-mail verificado

`POST /api/auth/register` SHALL aceitar o campo opcional `email_token`. Com token válido, o sistema SHALL criar a conta na mesma transacção que consome o token, guardar o e-mail, o e-mail canonicalizado e o instante de verificação, e registar o aceite de termos. No modo `aberto`, um token válido SHALL dispensar o convite e a conta SHALL ser criada sem pertencer a nenhum servidor. Se também houver convite válido, a conta SHALL entrar no servidor do convite. No modo `fechado`, o convite SHALL continuar obrigatório depois da primeira conta, com ou sem token. Um código de convite fornecido e inválido SHALL recusar o cadastro (403) mesmo com token válido. Os erros SHALL ser avaliados por esta ordem: limite de IP (429), validação do corpo (400), token inválido (400 `email_token_invalid`), regra de convite/modo (403, com a mensagem actual), handle existente (409, como hoje), e-mail já associado a uma conta (409 `email_taken`). Uma falha em qualquer passo SHALL NOT consumir o token.

#### Scenario: Registo aberto sem convite

- **WHEN** no modo `aberto` é submetido o cadastro com handle, senha, chaves e `email_token` válido, sem convite
- **THEN** a conta é criada com o e-mail verificado, a sessão é aberta e o token deixa de ser utilizável

#### Scenario: Token e convite juntos

- **WHEN** o cadastro traz `email_token` válido e um convite válido
- **THEN** a conta é criada com o e-mail verificado e entra no servidor do convite

#### Scenario: Convite inválido com token válido

- **WHEN** no modo `aberto` o cadastro traz `email_token` válido e um código de convite inexistente ou expirado
- **THEN** o cadastro é recusado com 403 e o token permanece utilizável

#### Scenario: Modo fechado exige convite

- **WHEN** o modo é `fechado`, já existe uma conta e o cadastro não traz convite válido
- **THEN** o cadastro é recusado com 403, mesmo com `email_token`

#### Scenario: Cadastro falhado não consome o token

- **WHEN** o cadastro falha por handle já existente
- **THEN** o token permanece utilizável até expirar

#### Scenario: E-mail já associado a uma conta

- **WHEN** o cadastro traz um token válido cujo e-mail canonicalizado já pertence a uma conta
- **THEN** o cadastro falha com 409 `email_taken` e o token não é consumido

#### Scenario: Sem token

- **WHEN** o cadastro não traz `email_token` e traz convite válido
- **THEN** a conta é criada como antes, com e-mail nulo

### Requirement: O e-mail só é visível à própria conta

O sistema SHALL devolver o e-mail e o estado de verificação apenas na resposta de autenticação da própria conta (`/auth/me`, login, registo). O e-mail SHALL NOT constar de listas de membros, mencionáveis, eventos WebSocket, convites nem de qualquer resposta destinada a outras contas.

#### Scenario: Outro membro lista os membros

- **WHEN** um membro lista os membros de um servidor onde está uma conta com e-mail
- **THEN** a resposta não contém o e-mail dessa conta

#### Scenario: Própria conta

- **WHEN** a conta chama `/auth/me`
- **THEN** a resposta inclui o seu e-mail e `email_verified_at`

### Requirement: Envio de e-mail desacoplado e sem dados sensíveis em logs

O envio SHALL passar por uma interface com uma implementação real (Resend) e uma implementação de log para desenvolvimento e testes. Falhas de envio SHALL NOT ser visíveis ao cliente do pedido, e o envio SHALL NOT ocorrer com uma transacção de base de dados aberta. Os logs SHALL NOT conter o token nem o e-mail em claro, e SHALL conter o suficiente para diagnosticar a entrega (finalidade, estado HTTP do provedor, identificador do envio e um prefixo do hash do e-mail canonicalizado). Chaves e segredos da configuração SHALL NOT aparecer na representação de depuração da configuração. Com o modo `aberto` em produção, o arranque SHALL falhar se faltar a chave do provedor, o remetente ou uma URL pública HTTPS.

#### Scenario: Falha do provedor

- **WHEN** o provedor devolve erro ao enviar a verificação
- **THEN** o cliente recebe a resposta genérica e o erro fica registado sem token nem e-mail

#### Scenario: Configuração insegura em produção

- **WHEN** o modo é `aberto`, a instância está em produção e falta `EMAIL_API_KEY`, `EMAIL_FROM`, `TRUSTED_PROXY` ou a URL pública não é HTTPS
- **THEN** o arranque falha com mensagem explícita

### Requirement: Limpeza de verificações expiradas

O sistema SHALL apagar periodicamente as verificações expiradas ou consumidas há mais de 24 horas, sem afectar contas.

#### Scenario: Limpeza periódica

- **WHEN** a tarefa de limpeza corre
- **THEN** verificações expiradas desaparecem e as contas permanecem intactas

### Requirement: Alterações de backend aditivas e retrocompatíveis

As alterações SHALL ser aditivas: novas tabelas e colunas anuláveis, novos endpoints e um campo opcional no corpo do registo. Clientes existentes e instâncias em modo `fechado` SHALL comportar-se como antes, e a resposta de autenticação de contas existentes SHALL permanecer válida.

#### Scenario: Cliente antigo

- **WHEN** um cliente que não conhece `email_token` regista com convite
- **THEN** o resultado é igual ao anterior a esta change
