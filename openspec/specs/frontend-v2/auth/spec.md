# auth Specification

## Purpose

Permite a um utilizador entrar na Mesa (registar-se, iniciar sessão, desbloquear ou recuperar a sua identidade criptográfica local num dispositivo novo) sem que o servidor alguma vez veja a chave secreta de identidade em texto simples.

## Requirements

### Requirement: Registo cria identidade local e envia só o cofre cifrado
Ao registar uma conta nova, o sistema SHALL gerar um par de chaves de identidade (NaCl box) inteiramente no cliente, cifrar a chave secreta com uma chave derivada da password por Argon2id (sal aleatório de 16 bytes, parâmetros do contrato de formato em `docs/v2/contracts/crypto-formats.md`: paralelismo 1, 3 iterações, 32 MiB), e enviar ao backend apenas o blob já cifrado (cofre de identidade) — nunca a chave secreta em claro nem a password derivada.

#### Scenario: Registo bem-sucedido
- **WHEN** um utilizador submete handle + password no modo Registo
- **THEN** uma conta é criada no backend (`POST /api/auth/register`) e um cofre de identidade cifrado é guardado (local em IndexedDB e remoto via `PUT /api/auth/identity-vault`), sem que nenhum pedido de rede contenha a chave secreta em claro

### Requirement: Login existente reutiliza o cofre local quando presente
Ao iniciar sessão num dispositivo que já tem o cofre de identidade daquela conta em IndexedDB, o sistema SHALL pedir apenas a password para desbloquear o cofre local, sem exigir um passo adicional de sincronização com o servidor.

#### Scenario: Login em dispositivo já usado
- **WHEN** um utilizador com cofre local existente insere handle + password correctos
- **THEN** a sessão é estabelecida (`POST /api/auth/login`) e a identidade é desbloqueada localmente a partir do cofre em IndexedDB

### Requirement: Desbloqueio de conta em dispositivo novo
Quando existe uma sessão de servidor válida mas falta o cofre de identidade local (dispositivo novo ou dados do site apagados), o sistema SHALL apresentar um ecrã de desbloqueio dedicado que tenta obter o cofre remoto (`GET /api/auth/me` → `identity_vault`) e desbloqueá-lo localmente com a password fornecida, e SHALL oferecer uma acção "Trocar de conta" que encerra a sessão actual.

#### Scenario: Cofre remoto existe
- **WHEN** o utilizador fornece a password correcta e existe um cofre remoto associado à conta
- **THEN** a identidade é desbloqueada a partir do cofre remoto e persistida também em IndexedDB local para acessos futuros

#### Scenario: Nem cofre local nem remoto existem
- **WHEN** o utilizador fornece uma password e não há cofre nem local nem remoto
- **THEN** o sistema apresenta uma mensagem explicando que não há cofre de chaves neste navegador nem no servidor, que o histórico cifrado antigo deixará de ser legível, e oferece a opção de gerar novas chaves de identidade

#### Scenario: Password incorrecta
- **WHEN** o utilizador fornece uma password que não abre o cofre disponível (local ou remoto)
- **THEN** o sistema apresenta um erro de "senha incorrecta ou cofre de chaves ilegível" sem revelar qual das duas condições falhou

### Requirement: Recuperação de identidade como acção alternativa ao desbloqueio
O sistema SHALL oferecer uma acção "Recuperar identidade" acessível a partir do ecrã de desbloqueio, disponível independentemente de o desbloqueio ter falhado ou não — não é condicional a uma tentativa de password falhada.

#### Scenario: Acesso à recuperação
- **WHEN** o utilizador está no ecrã de desbloqueio de conta
- **THEN** a acção de recuperar identidade está sempre visível e acessível, não escondida atrás de uma tentativa de login falhada

### Requirement: Nenhuma UI de múltiplos dispositivos, MLS ou Passkeys
O sistema SHALL NOT apresentar qualquer ecrã de gestão de dispositivos/sessões autorizadas, cofre de chaves MLS/RFC 9420, ou registo/gestão de Passkeys/FIDO2 — esse escopo foi explicitamente excluído desta e de todas as fases (ver `docs/v2/TR-frontend-v2.md` §7).

#### Scenario: Ausência confirmada
- **WHEN** um utilizador navega por todo o fluxo de autenticação (login, registo, desbloqueio, recuperação)
- **THEN** em nenhum momento é apresentado um ecrã de dispositivos autorizados, epochs/árvore de chaves MLS, ou configuração de chave de hardware/Passkey

### Requirement: Cadastro com convite após a primeira conta
O sistema SHALL oferecer um campo de código de convite no cadastro, preencher o código recebido em `/invite/:code` ou `?invite=<code>`, e enviá-lo em `invite_code` ao backend. O campo SHALL ser opcional para permitir a primeira conta; a exigência e validade do convite são decididas pelo backend.

#### Scenario: Cadastro por link de convite
- **WHEN** um visitante abre uma URL com convite
- **THEN** o formulário inicia em modo de cadastro com código preenchido e permite corrigir o código antes da submissão

#### Scenario: Convite inválido ou ausente
- **WHEN** o backend recusa o cadastro por falta de convite válido
- **THEN** o formulário explica que é necessário um convite válido, sem criar uma identidade desbloqueada na aplicação

### Requirement: Formato do cofre compatível com contas existentes
O sistema SHALL ler e escrever o cofre de identidade no formato definido em `docs/v2/contracts/crypto-formats.md`, de modo que um cofre criado antes da v2 seja desbloqueado pela v2 e um cofre criado pela v2 seja desbloqueado pela aplicação anterior durante o período de rollback.

#### Scenario: Cofre existente
- **WHEN** um utilizador com conta e cofre anteriores à v2 inicia sessão na v2 com a sua password
- **THEN** a identidade é desbloqueada sem qualquer migração

### Requirement: Ecrãs de autenticação fiéis aos mockups
Os ecrãs de autenticação e de desbloqueio SHALL cumprir as checklists de fidelidade de `design.md` D7 para `mesa_autentica_o_e_registo_login_criar_conta`, `mesa_desbloqueio_de_conta_recupera_o_de_identidade` e SHALL ser classificados **Fiel** na comparação lado a lado, em tema escuro.

#### Scenario: Comparação de fidelidade
- **WHEN** o ecrã de login é comparado com o mockup no mesmo estado
- **THEN** todos os elementos obrigatórios estão presentes (painel esquerdo, controlo segmentado, prefixo `@`, "Esqueceu o cofre?", separador e acção secundária) e nenhum elemento fora de escopo foi acrescentado

### Requirement: Paridade funcional da autenticação
O sistema SHALL manter todas as funcionalidades de autenticação existentes: registo, registo por convite (campo, `/invite/:code`, `?invite=`), login, sessão persistente, desbloqueio em dispositivo novo, recuperação de identidade, trocar de conta e terminar sessão com confirmação.

#### Scenario: Fluxos existentes
- **WHEN** cada fluxo de autenticação listado em `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
