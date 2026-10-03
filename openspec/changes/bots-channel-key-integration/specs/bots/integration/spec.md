# Spec Delta

## Purpose

Permite instalar processos externos ("bots") com acesso escopado exactamente aos canais para que foram autorizados — cobrindo, nesta primeira versão, um bot de música (ingress de áudio num canal de voz) e um bot de conversa (leitura/escrita de mensagens num canal de texto) — sem lhes dar nunca acesso de decifragem a canais onde não foram instalados.

## ADDED Requirements

### Requirement: Conta de bot distinta de conta humana
O sistema SHALL suportar um tipo de conta "bot", distinto de conta humana: sem `password_hash` utilizável para login nem `identity_vault`, autenticada por um token próprio, mas com a sua própria `identity_pubkey` para participar do mecanismo de handoff de chave de canal como qualquer outro membro.

#### Scenario: Conta de bot não tem fluxo de login humano
- **WHEN** alguém tenta autenticar uma conta de bot com password num formulário de login humano
- **THEN** o sistema rejeita — contas de bot só autenticam por token

#### Scenario: Conta de bot recebe envelope de chave como qualquer membro
- **WHEN** uma conta de bot é instalada (ACL concedida) num Canal
- **THEN** o mecanismo de handoff de `channel_key` (ver `crypto/channel-keys`) trata-a como qualquer conta elegível, selando o envelope para a sua `identity_pubkey`

### Requirement: Expiração do token de bot configurável pelo dono na criação
O sistema SHALL permitir que quem cria/instala um bot escolha, no momento da criação, se o seu token de autenticação expira numa data/duração definida por essa pessoa, ou nunca expira. O sistema SHALL recusar autenticação por um token cuja expiração escolhida já tenha passado.

#### Scenario: Dono define expiração na criação
- **WHEN** o dono cria um bot e escolhe uma expiração de 30 dias para o seu token
- **THEN** o sistema regista essa expiração e recusa a autenticação desse token depois de passados 30 dias

#### Scenario: Dono escolhe não expirar
- **WHEN** o dono cria um bot sem escolher nenhuma expiração
- **THEN** o token desse bot continua válido indefinidamente, até ser revogado

### Requirement: Instalação de bot escopada a canais específicos
O sistema SHALL instalar um bot concedendo-lhe ACL (visibilidade/overwrite) só nos Canais escolhidos no momento da instalação, nunca acesso implícito a todo o Servidor.

#### Scenario: Bot instalado num canal não vê outro canal do mesmo servidor
- **WHEN** um bot é instalado só no Canal de voz "Mesa" de um Servidor
- **THEN** o bot não tem ACL nem recebe envelope de `channel_key` de nenhum outro Canal desse Servidor, incluindo canais de texto

### Requirement: Revogação atómica de bot
O sistema SHALL, ao remover uma conta de bot, invalidar de imediato o seu acesso a todos os Canais onde estava instalado — removendo a sua ACL e os seus envelopes de `channel_key` — sem exigir uma operação por Canal.

#### Scenario: Apagar a conta de bot remove acesso a todos os canais de uma vez
- **WHEN** um gestor do Servidor apaga a conta de um bot instalado em três Canais
- **THEN** nenhum desses três Canais mantém ACL ou envelope de chave para esse bot após a operação

### Requirement: Bot de música publica áudio como participante de canal de voz
O sistema SHALL permitir que uma conta de bot instalada num Canal de voz entre nesse Canal como participante da sessão de voz/vídeo e publique uma faixa de áudio cifrada com a `channel_key` desse Canal, da mesma forma que um participante humano publicaria.

#### Scenario: Bot de música entra e publica áudio
- **WHEN** uma conta de bot com acesso a um Canal de voz inicia uma sessão de reprodução de áudio
- **THEN** os demais participantes desse Canal recebem a faixa de áudio publicada pelo bot, decifrável com a `channel_key` que já detêm

### Requirement: Bot de conversa lê e escreve mensagens do canal onde está instalado
O sistema SHALL permitir que uma conta de bot instalada num Canal de texto leia mensagens novas desse Canal (decifrando com a `channel_key` desse Canal) e publique mensagens de resposta (cifradas com a mesma chave), sujeita às mesmas regras de ACL de envio que um membro humano teria nesse Canal.

#### Scenario: Bot de conversa responde no canal onde está instalado
- **WHEN** uma conta de bot com acesso a um Canal de texto recebe uma mensagem endereçada a ela nesse Canal
- **THEN** o bot consegue decifrar essa mensagem e publicar uma resposta cifrada, visível aos demais membros desse Canal

#### Scenario: Bot de conversa não consegue ler outro canal
- **WHEN** uma conta de bot só tem ACL e envelope de chave do Canal "geral"
- **THEN** o bot não consegue decifrar mensagens de nenhum outro Canal do mesmo Servidor

### Requirement: Gestão de bots acessível na shell de definições do servidor
O sistema SHALL expor a criação, listagem e revogação de bots como um item da navegação de definições do Servidor já existente (ver spec `frontend-v2/server-management`), acessível só a quem tiver a capacidade de papel "Gerenciar bots" ou for o dono do Servidor.

#### Scenario: Item "Bots" visível a quem tem a capacidade
- **WHEN** um membro com a capacidade "Gerenciar bots" (ou o dono do Servidor) entra no modo de definições do Servidor
- **THEN** vê um item "Bots" na navegação, que abre uma página listando os bots instalados nesse Servidor

#### Scenario: Item "Bots" ausente para quem não tem a capacidade
- **WHEN** um membro sem a capacidade "Gerenciar bots" e que não é dono do Servidor entra no modo de definições
- **THEN** não vê o item "Bots" na navegação

#### Scenario: Criar bot mostra o token uma única vez
- **WHEN** alguém com acesso à página "Bots" cria um bot novo, escolhendo nome, canais e expiração do token
- **THEN** o token em claro é mostrado uma única vez nessa resposta, com aviso de que não será mostrado novamente, e não é recuperável depois através da UI
