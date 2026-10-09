# password-recovery Specification

## Purpose

Permite a um utilizador sem acesso à password voltar a entrar na conta, por reset assistido pelo operador ou por chave de recuperação, e a quem tem a senha alterá-la. O servidor recebe a password por HTTPS para verificar e calcular o hash, mas SHALL NOT persistir a password em claro nem receber a chave secreta de identidade ou o código de recuperação.

## Requirements

### Requirement: Código de reset emitido pelo operador
O sistema SHALL permitir ao operador da instância emitir, por um comando executado no host (`reset-code <handle>`), um código de reset para uma conta existente. O código SHALL ser aleatório, de uso único, de validade limitada (por omissão 30 minutos, configurável no comando) e SHALL ser mostrado ao operador uma única vez; o sistema SHALL persistir apenas um hash do código. Emitir um novo código para a mesma conta SHALL invalidar o anterior. O comando SHALL falhar com mensagem clara para um handle inexistente.

#### Scenario: Emissão de código
- **WHEN** o operador executa `reset-code alice` para uma conta existente
- **THEN** o comando imprime um código e o seu prazo de validade, e a base de dados guarda só o hash do código

#### Scenario: Novo código substitui o anterior
- **WHEN** o operador emite dois códigos seguidos para a mesma conta
- **THEN** o primeiro código deixa de ser aceite e só o segundo é válido

#### Scenario: Handle inexistente
- **WHEN** o operador executa `reset-code` com um handle que não existe
- **THEN** o comando termina com erro e nenhum código é criado

### Requirement: Reset de senha com código do operador cria uma nova identidade
O sistema SHALL oferecer `POST /api/auth/recovery/code/redeem` (sem sessão) que, dados `handle`, `code`, a nova password e uma nova identidade (chave pública e cofre gerados no cliente), SHALL substituir `password_hash` e a identidade da conta de forma atómica, SHALL aplicar à conta o mesmo tratamento de identidade substituída de `PUT /api/auth/identity` (envelopes da conta apagados, participações marcadas como pendentes, pedido de handoff aos membros sincronizados), SHALL remover `recovery_vault`, verificador de recuperação e `recovery_set_at`, SHALL consumir o código e SHALL abrir uma sessão nova. Toda substituição de identidade, inclusive por `PUT /api/auth/identity`, SHALL invalidar atomicamente a recuperação da identidade anterior e fazer `has_recovery_key` voltar a `false`. Handle inexistente, código errado, expirado, já usado ou invalidado SHALL produzir a mesma resposta (401), sem distinguir a causa.

#### Scenario: Reset bem-sucedido
- **WHEN** um utilizador submete handle, código válido, nova password e nova identidade
- **THEN** o login com a nova password funciona, a antiga deixa de funcionar, o cofre guardado é o novo e as participações da conta ficam pendentes de handoff

#### Scenario: Código de uso único
- **WHEN** o mesmo código é submetido uma segunda vez
- **THEN** o pedido é recusado com 401

#### Scenario: Código expirado
- **WHEN** um código é submetido depois do prazo de validade
- **THEN** o pedido é recusado com 401 e nada na conta muda

#### Scenario: Substituição de identidade invalida recuperação antiga
- **WHEN** uma conta com chave de recuperação substitui a identidade por reset do operador ou por `PUT /api/auth/identity`
- **THEN** o cofre e verificador de recuperação anteriores são removidos na mesma transacção, `has_recovery_key` é falso e a chave anterior não autentica nem abre a nova identidade

#### Scenario: Resposta uniforme
- **WHEN** o pedido usa um handle inexistente, e noutro pedido um handle existente com código errado
- **THEN** ambas as respostas têm o mesmo estado e o mesmo corpo

#### Scenario: Password curta
- **WHEN** a nova password tem menos de 8 caracteres
- **THEN** o pedido é recusado com 400, o código não é consumido e a conta não muda

### Requirement: Recuperação com chave de recuperação preserva a identidade
O sistema SHALL permitir guardar por conta um segredo de recuperação opcional, composto por um `recovery_vault` (a chave secreta de identidade embrulhada com uma chave derivada do código de recuperação) e pelo verificador público de uma chave de assinatura derivada separadamente do mesmo código. O código SHALL ter pelo menos 128 bits de entropia, ser gerado no cliente e SHALL NOT ser enviado ao servidor. `POST /api/auth/recovery/key/challenge` SHALL devolver um desafio aleatório, curto e de uso único, sem revelar se o handle existe. `POST /api/auth/recovery/key/start` SHALL verificar uma assinatura do desafio vinculada a handle e operação, consumir o desafio e só então devolver o `recovery_vault` e um ticket de conclusão curto e de uso único. `POST /api/auth/recovery/key/redeem` SHALL exigir assinatura do ticket vinculada ao hash canónico da nova password e do novo cofre; SHALL consumir o ticket atomicamente com a troca de `password_hash` e cofre da **mesma** identidade, manter `identity_pubkey` e envelopes inalterados, revogar sessões e abrir sessão nova. Nenhuma prova reutilizável ou chave de assinatura privada SHALL atravessar a rede; desafio, ticket e assinaturas SHALL NOT constar de logs. O servidor SHALL recusar cofre com chave pública diferente da conta.

#### Scenario: Recuperação sem perda
- **WHEN** um utilizador com chave de recuperação a usa para repor a senha
- **THEN** o login com a nova password funciona, `identity_pubkey` e os envelopes de chave não mudam, e nenhuma participação passa a pendente

#### Scenario: Prova inválida não revela o cofre de recuperação
- **WHEN** `key/start` é chamado com uma assinatura inválida, ou para um handle sem chave de recuperação
- **THEN** a resposta é a mesma nos dois casos (401) e não contém o `recovery_vault`

#### Scenario: Cofre com outra identidade
- **WHEN** `key/redeem` traz um cofre cuja chave pública difere da guardada na conta
- **THEN** o pedido é recusado com 400 e a conta não muda

#### Scenario: O código nunca chega ao servidor
- **WHEN** a chave de recuperação é criada ou usada
- **THEN** nenhum pedido de rede contém o código em claro nem a chave secreta de identidade

#### Scenario: Replay e resgates concorrentes
- **WHEN** o mesmo desafio ou ticket é usado duas vezes, inclusive em pedidos simultâneos
- **THEN** no máximo um uso tem sucesso; o outro recebe resposta uniforme de autorização e não modifica credenciais, cofre ou sessões

#### Scenario: Assinatura vinculada ao pedido
- **WHEN** um ticket ou assinatura obtido para outra operação, handle, password ou cofre é reutilizado
- **THEN** o resgate é recusado sem modificar a conta

### Requirement: Criar ou rodar a chave de recuperação é opcional e exige a senha actual
O sistema SHALL oferecer `PUT /api/auth/recovery-key` (autenticada) que guarda atomicamente um novo par `recovery_vault`/verificador público, substituindo qualquer anterior e invalidando desafios e tickets antigos, e SHALL exigir a password actual no mesmo pedido. Contas sem chave SHALL continuar a funcionar normalmente. O sistema SHALL expor em `GET /api/auth/me` apenas `has_recovery_key` (booleano) e SHALL NOT incluir o `recovery_vault` nessa resposta.

#### Scenario: Conta existente cria a chave
- **WHEN** uma conta sem chave de recuperação chama `PUT /api/auth/recovery-key` com a senha actual correcta
- **THEN** `GET /api/auth/me` passa a devolver `has_recovery_key: true` e não devolve o `recovery_vault`

#### Scenario: Senha actual errada
- **WHEN** o pedido traz uma senha actual incorrecta
- **THEN** é recusado com 401 e a chave de recuperação anterior mantém-se

#### Scenario: Conta sem chave não é bloqueada
- **WHEN** uma conta sem chave de recuperação inicia sessão e usa a aplicação
- **THEN** nenhuma funcionalidade é bloqueada por essa ausência

### Requirement: Alterar senha com a senha actual
O sistema SHALL oferecer `PUT /api/auth/password` (autenticada) que, dados a password actual, a nova password e o cofre da mesma identidade re-embrulhado com a nova password, SHALL substituir `password_hash` e o cofre sem alterar `identity_pubkey`, recuperação configurada nem envelopes. O sistema SHALL revogar as outras sessões e fechar apenas os WebSockets delas, mantendo a sessão e WebSocket que fizeram o pedido.

#### Scenario: Alteração bem-sucedida
- **WHEN** um utilizador autenticado submete a senha actual correcta e uma nova senha com 8 ou mais caracteres
- **THEN** o login com a nova senha funciona, a antiga deixa de funcionar, a identidade é a mesma e outras sessões abertas ficam inválidas

#### Scenario: Senha actual errada
- **WHEN** a senha actual submetida está incorrecta
- **THEN** o pedido é recusado com 401 e nada muda

### Requirement: Conclusão de um reset revoga todas as sessões
Ao concluir um reset (código do operador ou chave de recuperação), o sistema SHALL revogar todas as sessões da conta na mesma transacção das credenciais e SHALL encerrar explicitamente os WebSockets dessas sessões após o commit, antes de devolver a nova sessão. O encerramento SHALL impedir recepção e envio e cobrir a corrida entre handshake e revogação. Após fecho ou falha do handshake WebSocket, o cliente SHALL verificar a sessão via `/api/auth/me` antes de reconectar; se revogada, SHALL parar as tentativas e limpar o estado autenticado. Nenhum evento de handoff SHALL ser emitido antes do commit.

#### Scenario: Sessão antiga deixa de valer
- **WHEN** existe uma sessão aberta numa conta e um reset da mesma é concluído
- **THEN** pedidos autenticados com o cookie antigo recebem 401 e a ligação WebSocket antiga é encerrada

#### Scenario: Falha de handshake não revela 401 ao navegador
- **WHEN** o WebSocket nativo fecha com `onclose` 1006 após revogação da sessão
- **THEN** o cliente consulta `/api/auth/me`, reconhece a sessão inválida e não inicia novo loop de reconexão

### Requirement: Limitação de tentativas por conta
O sistema SHALL limitar as tentativas de reset por conta (handle), independentemente do IP de origem, para além do limite por IP já existente. Um código de operador SHALL ser invalidado após 5 tentativas falhadas. As tentativas de `key/challenge`, `key/start` e `key/redeem` SHALL ser limitadas por conta numa janela deslizante (5 falhas por hora); pedidos válidos não SHALL consumir a quota de falhas. Os limites SHALL aplicar-se também a handles inexistentes. Handles SHALL ser normalizados e ter comprimento limitado antes de entrar no limiter; entradas expiradas SHALL ser expurgadas e o mapa SHALL ter cota máxima para não crescer sem limite com handles arbitrários.

#### Scenario: Código invalidado por tentativas
- **WHEN** são feitas 5 tentativas falhadas com um código de operador e depois uma com o código correcto
- **THEN** a última é recusada e o operador tem de emitir um código novo

#### Scenario: Limite por conta com IPs diferentes
- **WHEN** mais de 5 provas erradas por hora chegam para o mesmo handle, de IPs distintos
- **THEN** os pedidos seguintes são recusados com 429

#### Scenario: Handle inexistente também é limitado
- **WHEN** mais de 5 pedidos por hora chegam para um handle que não existe
- **THEN** são recusados com 429, tal como para um handle existente

#### Scenario: Muitos handles inexistentes
- **WHEN** um cliente tenta muitos handles distintos que não existem
- **THEN** o armazenamento do limitador permanece limitado e o limite por IP continua activo

### Requirement: Alterações de backend aditivas e retrocompatíveis
O sistema SHALL introduzir as capacidades de recuperação sem alterar o significado de campos ou rotas existentes e sem exigir novos campos em `POST /api/auth/register`: colunas novas SHALL ser anuláveis, rotas SHALL ser novas e o único campo novo em respostas existentes SHALL ser opcional. Um cliente anterior SHALL continuar a registar-se, iniciar sessão e usar a aplicação sem alteração.

#### Scenario: Cliente sem chave de recuperação
- **WHEN** um cliente regista uma conta sem enviar nenhum campo de recuperação
- **THEN** o registo é aceite e a conta funciona, com `has_recovery_key: false`

#### Scenario: Migração sobre dados existentes
- **WHEN** a migração é aplicada a uma base de dados com contas existentes
- **THEN** todas as contas continuam a iniciar sessão e a desbloquear o cofre sem qualquer acção
