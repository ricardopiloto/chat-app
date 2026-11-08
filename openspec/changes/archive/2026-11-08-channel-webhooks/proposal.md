# Proposal

## Why

Integrações externas como n8n precisam publicar avisos num canal de texto específico sem usar a sessão de uma pessoa. A API actual de mensagens exige `AuthUser` e `content_ciphertext`; `message.sender_account_id` exige uma conta existente.

## What Changes

- Criar uma conta de webhook dedicada por canal de texto, com nome/avatar próprios e URL secreta; permitir rotação e revogação sem apagar conta nem histórico.
- Aceitar POST externo com conteúdo de texto, validar token e limites, persistir a mensagem como integração e distribuí-la pelo evento `message.new`.
- Mostrar snapshot de nome/avatar da integração e selo de bot na UI, sem a apresentar como membro humano; alterações futuras de perfil não reescrevem mensagens anteriores.
- Definir explicitamente o impacto em E2EE: conteúdo de webhook chega em claro ao servidor, mesmo quando as mensagens humanas do canal são cifradas; a activação exige consentimento explícito do gestor e indicação visível no canal.

## Capabilities

### New Capabilities

- `frontend-v2/channel-webhooks`: gestão, publicação e apresentação de mensagens de integração.

## Impact

- Novas rotas, tabela `channel_webhook` e coluna `account.is_system_account` no backend; adaptar `domain/message.rs`, `db/message.rs`, `api/messages.rs`, evento WS e UI de mensagens/gestão. Migração aditiva sem alterar a FK ou reconstruir `message`; contagem de contas humanas no onboarding e rejeição explícita de login de conta de sistema. URLs de webhook são segredos.
