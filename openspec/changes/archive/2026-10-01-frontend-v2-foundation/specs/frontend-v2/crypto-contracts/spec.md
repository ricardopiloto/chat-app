# Spec Delta

## Purpose

Garante que os formatos criptográficos usados por contas e dados existentes estão especificados e testáveis, para a v2 ser compatível sem consultar código da v1.

## ADDED Requirements

### Requirement: Contratos de formato criptográfico especificados e testados
O sistema SHALL ter os formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem, cifra de anexo e parâmetros de derivação) descritos em `docs/v2/contracts/crypto-formats.md` e acompanhados de vectores de teste em `docs/v2/contracts/vectors/`, de modo que contas e dados criados antes da v2 continuem legíveis por ela.

#### Scenario: Vector de cofre existente
- **WHEN** a implementação v2 do cofre de identidade recebe um vector de `docs/v2/contracts/vectors/` e a password associada
- **THEN** desbloqueia o cofre e obtém a chave de identidade esperada

#### Scenario: Escrita compatível
- **WHEN** a v2 cifra um novo cofre, envelope ou mensagem
- **THEN** o resultado é aceite pelo conjunto de verificação de formato e é legível pelo oráculo de referência da aplicação em produção
