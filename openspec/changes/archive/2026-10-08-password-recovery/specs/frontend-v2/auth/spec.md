# Spec Delta

## ADDED Requirements

### Requirement: Ecrã público "Esqueci a senha"
O sistema SHALL oferecer um ecrã público em `/recover`, acessível a partir do ecrã de login pelo link "Esqueci a senha", com dois caminhos: (a) "Tenho a chave de recuperação" e (b) "Tenho um código do operador". O caminho (b) SHALL pedir handle, código e nova senha e SHALL avisar, antes de confirmar, que gera uma identidade nova e quais as consequências reais (os Servidores voltam quando um membro com a chave estiver online; Servidores em que a conta era a única com a chave, e a custódia da chave de canal de voz, não voltam). O caminho (a) SHALL pedir handle, chave de recuperação e nova senha e SHALL informar que a identidade é preservada. O ecrã SHALL explicar que o operador da instância emite o código e SHALL NOT sugerir recuperação por e-mail. Erros SHALL ser genéricos para handle inexistente, código errado e código expirado, e SHALL mostrar mensagem distinta para limite de tentativas (429).

#### Scenario: Acesso a partir do login
- **WHEN** o utilizador está no ecrã de login
- **THEN** o link "Esqueci a senha" está visível e abre `/recover` sem exigir sessão

#### Scenario: Recuperação com chave
- **WHEN** o utilizador introduz handle, chave de recuperação válida e uma nova senha
- **THEN** entra na conta com a identidade desbloqueada e os Servidores intactos, sem passar pelo ecrã de desbloqueio

#### Scenario: Recuperação com código do operador
- **WHEN** o utilizador introduz handle, código válido do operador e uma nova senha e confirma o aviso de identidade nova
- **THEN** entra na conta com uma identidade nova e os Servidores ficam a sincronizar até um membro com a chave estar online

#### Scenario: Erro genérico
- **WHEN** o código é inválido, expirado ou o handle não existe
- **THEN** o ecrã mostra a mesma mensagem genérica nos três casos

#### Scenario: Limite de tentativas
- **WHEN** o backend responde 429
- **THEN** o ecrã explica que houve demasiadas tentativas e que deve esperar ou pedir novo código ao operador

### Requirement: Registo apresenta a chave de recuperação uma única vez
Antes de enviar o registo directo ou por convite, o sistema SHALL oferecer a escolha entre criar a chave de recuperação e "fazer depois". Se escolher criar, o cliente SHALL gerar e mostrar o código uma única vez com copiar/descarregar e exigir confirmação "guardei" **antes de enviar** `recovery_vault` e verificador público no POST de registo. Se escolher "fazer depois", o pedido SHALL omitir os campos de recuperação. O código SHALL permanecer apenas em memória até a confirmação e SHALL NOT ser guardado em armazenamento persistente do navegador. Se a resposta do POST se perder depois de a conta ser criada, o utilizador já terá tido oportunidade de guardar o código.

#### Scenario: Registo directo
- **WHEN** um utilizador escolhe criar recuperação no registo directo
- **THEN** vê e confirma que guardou o código antes do POST, e só depois do registo confirmado entra na aplicação

#### Scenario: Registo por convite
- **WHEN** um utilizador cria a conta ao aceitar um convite
- **THEN** o mesmo passo de chave de recuperação é confirmado antes do POST de aceitar convite

#### Scenario: Saltar o passo
- **WHEN** o utilizador escolhe "fazer depois" antes de enviar o registo
- **THEN** a conta é criada sem chave de recuperação e "Minha conta" mostra que ainda pode criá-la

## MODIFIED Requirements

### Requirement: Registo cria identidade local e envia só o cofre cifrado
Ao registar uma conta nova, o sistema SHALL gerar um par de chaves de identidade (NaCl box) inteiramente no cliente, cifrar a chave secreta com uma chave derivada da password por Argon2id (sal aleatório de 16 bytes, parâmetros do contrato de formato em `docs/v2/contracts/crypto-formats.md`: paralelismo 1, 3 iterações, 32 MiB), e enviar ao backend apenas o blob já cifrado (cofre de identidade) — nunca a chave secreta em claro nem a password derivada. Quando o utilizador escolhe criar recuperação antes do registo, SHALL enviar também `recovery_vault` e verificador público derivados do código, nunca o código nem a chave privada de assinatura.

#### Scenario: Registo bem-sucedido
- **WHEN** um utilizador submete handle + password no modo Registo
- **THEN** uma conta é criada no backend (`POST /api/auth/register`) e um cofre de identidade cifrado é guardado (local em IndexedDB e remoto via `PUT /api/auth/identity-vault`), sem que nenhum pedido de rede contenha a chave secreta em claro

#### Scenario: Registo com chave de recuperação
- **WHEN** o utilizador confirma que guardou a chave de recuperação
- **THEN** o backend recebe o `recovery_vault` e o verificador público, e nenhum pedido contém o código ou a chave privada de assinatura

#### Scenario: Registo por convite e abandono
- **WHEN** a escolha de recuperação é feita no fluxo de convite, ou a página é recarregada antes de "guardei"
- **THEN** o convite segue o mesmo contrato do registo directo e o código não reaparece nem fica gravado no navegador

#### Scenario: Resposta de registo perdida
- **WHEN** o servidor cria a conta com recuperação mas a resposta ao POST se perde
- **THEN** o código já foi apresentado e confirmado antes do POST; ao repetir a tentativa o cliente não activa uma recuperação cujo código nunca foi mostrado

### Requirement: Recuperação de identidade como acção alternativa ao desbloqueio
O sistema SHALL oferecer uma acção "Recuperar identidade" acessível a partir do ecrã de desbloqueio, disponível independentemente de o desbloqueio ter falhado ou não — não é condicional a uma tentativa de password falhada. A confirmação SHALL descrever com exactidão as consequências: o histórico volta a ser legível quando um membro com a chave do Servidor estiver online e reselar a chave; permanece ilegível em Servidores em que esta conta era a única com a chave; e a custódia da chave de canal de voz da conta deixa de ser recuperável por esta identidade. O sistema SHALL mostrar a chave de recuperação como alternativa que preserva a identidade quando a conta a tem.

#### Scenario: Acesso à recuperação
- **WHEN** o utilizador está no ecrã de desbloqueio de conta
- **THEN** a acção de recuperar identidade está sempre visível e acessível, não escondida atrás de uma tentativa de login falhada

#### Scenario: Aviso exacto
- **WHEN** o utilizador abre a confirmação de "Recuperar identidade"
- **THEN** o texto menciona que o histórico volta com a ajuda de um membro online, os casos em que não volta e a custódia da chave de voz, e não afirma perda total do histórico

### Requirement: Ecrãs de autenticação fiéis aos mockups
Os ecrãs de autenticação e de desbloqueio SHALL cumprir as checklists de fidelidade de `design.md` D7 para `mesa_autentica_o_e_registo_login_criar_conta`, `mesa_desbloqueio_de_conta_recupera_o_de_identidade` e SHALL ser classificados **Fiel** na comparação lado a lado, em tema escuro, com um único desvio documentado: o link do mockup "Esqueceu o cofre?" passa a "Esqueci a senha" e abre o ecrã de recuperação, porque o texto original só explicava o desbloqueio e não recuperava nada. Os ecrãs `/recover` e de chave de recuperação do registo não têm mockup e SHALL ser classificados **Adaptados**, construídos só com componentes e tokens do sistema de design existente.

#### Scenario: Comparação de fidelidade
- **WHEN** o ecrã de login é comparado com o mockup no mesmo estado
- **THEN** todos os elementos obrigatórios estão presentes (painel esquerdo, controlo segmentado, prefixo `@`, link de recuperação de senha, separador e acção secundária), nenhum elemento fora de escopo foi acrescentado, e o único desvio é o texto do link, registado no relatório de fidelidade
