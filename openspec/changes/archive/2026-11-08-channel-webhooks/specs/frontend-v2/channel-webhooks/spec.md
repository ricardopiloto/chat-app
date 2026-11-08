# Spec Delta

## ADDED Requirements

### Requirement: Gerir webhooks de um canal de texto

O sistema SHALL permitir criar, listar, rodar o segredo, alterar nome/avatar, revogar e reactivar a identidade de webhook de um canal de texto apenas a quem tem permissão efectiva de gerir esse canal. SHALL existir no máximo um webhook e uma conta dedicada por canal, sem pertença a servidores; a reactivação SHALL reutilizar essa identidade. O segredo SHALL ser mostrado só na criação/rotação/reactivação, nunca na listagem. A criação SHALL exigir consentimento explícito para armazenar mensagens da integração em claro mesmo quando mensagens humanas do canal são E2EE. Revogar SHALL impedir novos envios sem apagar a conta ou mensagens anteriores.

#### Scenario: Gestor cria webhook

- **WHEN** uma pessoa autorizada cria um webhook num canal elegível
- **THEN** recebe uma URL secreta uma vez e a listagem posterior apresenta a integração sem o segredo

#### Scenario: Gestor revoga e reactiva webhook

- **WHEN** um gestor revoga um webhook e depois o reactiva
- **THEN** o segredo anterior deixa de publicar, é emitido um novo segredo para a mesma conta e as mensagens anteriores continuam visíveis

#### Scenario: Pessoa sem permissão

- **WHEN** uma pessoa sem gestão do canal tenta criar ou revogar um webhook
- **THEN** o servidor recusa a operação

### Requirement: Publicar por webhook

O sistema SHALL aceitar um POST com JSON `content` de texto não vazio e limitado na URL secreta de um webhook activo, publicar com `sender_account_id` da conta dedicada ao canal e difundir a mensagem em tempo real. SHALL consultar o estado de revogação em cada pedido e recusar token inválido ou revogado, corpo inválido ou excesso de taxa; neste último caso SHALL responder 429 e `Retry-After`.

#### Scenario: Fluxo externo publica

- **WHEN** n8n envia conteúdo válido à URL activa
- **THEN** uma mensagem de integração aparece no canal sem sessão de utilizador

#### Scenario: Segredo revogado

- **WHEN** um POST usa uma URL revogada
- **THEN** nenhuma mensagem é criada

### Requirement: Identidade visual de integração

O sistema SHALL guardar e apresentar em cada mensagem de webhook um snapshot do nome e avatar no envio, com indicador de integração e indicação de conteúdo recebido em claro, distinguindo-a de contas humanas no histórico e nos eventos em tempo real. A apresentação SHALL funcionar sem a conta de webhook constar da lista de membros; mudança posterior de nome/avatar ou revogação SHALL preservar a identidade visível das mensagens anteriores.

#### Scenario: Mensagem recebida

- **WHEN** um membro vê uma mensagem publicada por webhook
- **THEN** vê a identidade configurada da integração e um selo de bot/integração
