# Spec Delta

## MODIFIED Requirements

### Requirement: Contratos de formato criptográfico especificados e testados
O sistema SHALL ter os formatos criptográficos persistidos (cofre de identidade, envelope de chave de canal, chave de canal, cifra de mensagem, cifra de anexo e parâmetros de derivação) descritos em `docs/v2/contracts/crypto-formats.md` e acompanhados de vectores de teste em `docs/v2/contracts/vectors/`, de modo que contas e dados criados antes da v2 continuem legíveis por ela — **excepto o envelope de chave**, cujo escopo muda de Servidor para Canal e para o qual não existe caminho de compatibilidade retroativa (ver `crypto/channel-keys`).

#### Scenario: Vector de cofre existente
- **WHEN** a implementação v2 do cofre de identidade recebe um vector de `docs/v2/contracts/vectors/` e a password associada
- **THEN** desbloqueia o cofre e obtém a chave de identidade esperada

#### Scenario: Escrita compatível
- **WHEN** a v2 cifra um novo cofre, mensagem ou anexo
- **THEN** o resultado é aceite pelo conjunto de verificação de formato e é legível pelo oráculo de referência da aplicação em produção

#### Scenario: Envelope de chave não é retroativamente compatível
- **WHEN** a v2 lê um `key_envelope` criado antes desta mudança (selado por `server_id`)
- **THEN** o conjunto de verificação de formato **não** exige que esse envelope seja legível pela v2 — o contrato de compatibilidade cobre só cofre, mensagem e anexo, não o formato antigo de envelope por Servidor
