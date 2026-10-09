# Spec Delta

## MODIFIED Requirements

### Requirement: Contratos de formato criptográfico especificados e testados
O sistema SHALL ter os formatos criptográficos persistidos (cofre de identidade, cofre de recuperação, derivação da chave verificadora de recuperação, envelope de chave de servidor, chave de canal, cifra de mensagem, cifra de anexo e parâmetros de derivação) descritos em `docs/v2/contracts/crypto-formats.md` e acompanhados de vectores em `docs/v2/contracts/vectors/`, de modo que dados anteriores continuem legíveis. A chave de embrulho e a semente de assinatura SHALL usar domínios distintos. O contrato SHALL fixar codificação canónica e versionada das assinaturas de desafio e ticket, enquadramento inequívoco de campos e TTLs.

#### Scenario: Vector de cofre existente
- **WHEN** a implementação v2 do cofre de identidade recebe um vector de `docs/v2/contracts/vectors/` e a password associada
- **THEN** desbloqueia o cofre e obtém a chave de identidade esperada

#### Scenario: Escrita compatível
- **WHEN** a v2 cifra um novo cofre, envelope ou mensagem
- **THEN** o resultado é aceite pelo conjunto de verificação de formato e é legível pelo oráculo de referência da aplicação em produção

#### Scenario: Vector de cofre de recuperação
- **WHEN** a implementação recebe um vector de recuperação (código, handle e cofre esperado) de `docs/v2/contracts/vectors/`
- **THEN** a chave pública verificadora, as assinaturas de teste e a identidade obtida do `recovery_vault` coincidem com as esperadas

#### Scenario: Separação de domínio
- **WHEN** se conhece a chave pública verificadora e uma assinatura de teste
- **THEN** não é possível obter delas a chave que embrulha o `recovery_vault` nem a chave privada de assinatura
