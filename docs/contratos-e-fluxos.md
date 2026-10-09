# Contratos e fluxos

Rotas que o frontend v2 consome e os fluxos entre o cliente e o backend. O [README](../README.md) fica com a visão do produto; o detalhe de integração está aqui.

## Contratos Frontend ↔ Backend

Só os contratos que a **v2** consome. O backend tem mais rotas (listadas em [Rotas do backend que a v2 não usa](#rotas-do-backend-que-a-v2-não-usa)). Tipos de referência: [`frontend-v2/src/api/types.ts`](../frontend-v2/src/api/types.ts) e clientes em [`frontend-v2/src/api/endpoints/`](../frontend-v2/src/api/endpoints/).

### Convenções

| Tema | Contrato |
|------|----------|
| **Base** | REST sob `/api/*`, JSON, mesma origem. WebSocket em `GET /ws`. Saúde em `GET /health` |
| **Sessão** | Cookie `Session` (httpOnly, SameSite=Strict), emitido por *register* e *login*, revogado por *logout*. TTL por omissão 7 dias |
| **Erros** | `{ "error": "...", "code"?: "...", "message"?: "..." }`. Com `message`, `error` é o código de máquina. Estados usados: 400, 401, 403, 404, 409, 429, 503 |
| **Binários** | Corpo `application/octet-stream` e cabeçalho `X-Mesa-Media-Type` com o tipo real (avatares, imagens de servidor, anexos) |
| **Limites** | Avatar e imagem de servidor 1 MiB (JPEG, PNG, WebP). Anexo 5 MiB (mais GIF). Até 10 anexos e 20 menções por mensagem |
| **Datas** | RFC 3339 (`Timestamp`). Ids são UUID (`Id`) |
| **204** | Respostas sem corpo (apagar, sair, marcar como lido) devolvem `undefined` no cliente |

### Autenticação e conta

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `POST` | `/api/auth/register` | `RegisterBody` `{ handle, password, identity_pubkey, identity_vault?, invite_code? }` | `Account` | A primeira conta é o operador inicial; as seguintes exigem convite. Emite o cookie |
| `POST` | `/api/auth/login` | `{ handle, password }` | `Account` (inclui `identity_vault`) | Emite o cookie |
| `POST` | `/api/auth/logout` | — | sem corpo | Revoga a sessão |
| `GET` | `/api/auth/me` | — | `Account` ou 204 | 204 quando não há sessão |
| `PUT` | `/api/auth/identity-vault` | `IdentityVaultPayload` | sem corpo | Guarda o cofre cifrado |
| `PUT` | `/api/auth/identity` | `{ identity_pubkey, identity_vault }` | `Account` | Recuperação: troca a identidade, apaga os envelopes, marca os handoffs como pendentes e invalida a chave de recuperação anterior |
| `PUT` | `/api/auth/password` | `{ current_password, new_password, identity_vault }` | sem corpo (204) | Autenticada. Mesma identidade; revoga as outras sessões, mantém a actual |
| `POST` | `/api/auth/recovery/code/redeem` | `{ handle, code, password, identity_pubkey, identity_vault }` | `Account` | Sem sessão. Código de uso único emitido pelo operador (`reset-code`); troca identidade e senha, revoga todas as sessões. 401 uniforme para handle/código inválidos |
| `POST` | `/api/auth/recovery/key/challenge` | `{ handle }` | `{ challenge_id, nonce }` | Sem sessão. Nunca revela se a conta existe |
| `POST` | `/api/auth/recovery/key/start` | `{ handle, challenge_id, nonce, signature }` | `{ recovery_vault, ticket }` | Consome o desafio; devolve o cofre de recuperação só com assinatura válida |
| `POST` | `/api/auth/recovery/key/redeem` | `{ handle, ticket, signature, password, identity_vault }` | `Account` | Consome o ticket; mantém `identity_pubkey` e envelopes, revoga todas as sessões |
| `PUT` | `/api/auth/recovery-key` | `{ current_password, recovery_vault, recovery_verifier_pubkey }` | `Account` | Autenticada. Cria ou substitui a chave de recuperação; invalida desafios/tickets antigos |
| `PATCH` | `/api/auth/display-name` | `{ display_name: string \| null }` | `Account` | Handle não muda |
| `PUT` / `DELETE` | `/api/auth/avatar` | bytes + `X-Mesa-Media-Type` / — | `Account` / sem corpo | JPEG, PNG, WebP, 1 MiB |
| `GET` | `/api/accounts/{id}/avatar` | — | imagem | Usada em `<img src>` |

### Servidores, membros e cargos

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `GET` | `/api/servers` | — | `Server[]` | `has_unread`, `has_voice` por servidor |
| `POST` | `/api/servers` | `{ name, custody_ack, channel_key_sealed }` | `Server` | Cria o servidor, o canal `geral` e o canal de voz `mesa` com chave |
| `DELETE` | `/api/servers/{id}` | — | sem corpo | Só o dono. Emite `server.deleted` |
| `GET` / `PUT` / `DELETE` | `/api/servers/{id}/image` | — / bytes / — | imagem / `Server` / sem corpo | Imagem do servidor |
| `GET` / `PATCH` | `/api/servers/{id}/welcome` | `Partial<WelcomeSettings>` | `WelcomeSettings` | Canal e modelo de boas-vindas |
| `GET` | `/api/servers/{id}/members` | — | `Member[]` | Inclui `identity_pubkey` (para selar envelopes) |
| `GET` | `/api/servers/{id}/presence` | — | `{ online_account_ids }` | Complementa o evento `presence` |
| `DELETE` | `/api/servers/{id}/members/{account}` | — | sem corpo | Remover membro |
| `PUT` | `/api/servers/{id}/members/{account}/role` | `{ role_id: Id \| null }` | `{ account_id, role_id }` | Mudar cargo |
| `GET` / `POST` | `/api/servers/{id}/roles` | — / `{ name, capabilities? }` | `ServerRole[]` / `ServerRole` | `RoleCapabilities` tem 12 permissões; `can_mention_everyone` (Mencionar @todos) vem desligada por omissão |
| `PATCH` / `DELETE` | `/api/servers/{id}/roles/{role}` | `{ name?, capabilities? }` / — | `ServerRole` / sem corpo | O cargo de sistema do dono é só de leitura |
| `PUT` | `/api/servers/{id}/roles/positions` | `{ roles: [{ id, position }] }` | `ServerRole[]` | Reordenar |
| `PUT` | `/api/servers/{id}/roles/{role}/members` | `{ member_ids }` | `ServerRole` | Substitui os membros do cargo |

### Convites

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `POST` | `/api/servers/{id}/invites` | `{ include_history?, welcome_channel_id?, expires_in_seconds? }` | `Invite` (201) | TTL por omissão 300 s |
| `GET` | `/api/invites/{code}` | — | `InvitePreview` | Público, sem sessão. `requires_account_creation` diz se é preciso registo |
| `GET` | `/api/invites/{code}/handle-available?handle=` | — | `{ available }` | Só para convite utilizável. Limitado por IP |
| `POST` | `/api/invites/{code}/accept` | `{ handle?, password?, identity_pubkey?, identity_vault? }` | `Membership` `{ account_id, server_id, key_handoff_status }` | Com sessão: só entra. Sem sessão: regista e entra. Emite `invite.consumed` e `key_handoff.requested` |

### Canais, acesso e silenciamento

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `GET` / `POST` | `/api/servers/{id}/channels` | — / `CreateChannelBody` `{ name, type, grid_slot_count?, visibility?, custody_ack?, channel_key_sealed? }` | `Channel[]` / `Channel` | Canal de voz exige `custody_ack` e `channel_key_sealed` |
| `GET` | `/api/channels/{id}` | — | `Channel` | `my_permission`, `e2ee_enabled`, `has_channel_key` |
| `PATCH` | `/api/channels/{id}` | `{ name?, visibility?, visible_to_new_members? }` | `Channel` | Renomear e visibilidade |
| `DELETE` | `/api/channels/{id}` | — | sem corpo | **409** `last_channel_of_type` se for o último do tipo. Emite `channel.deleted` |
| `GET` | `/api/channels/{id}/mentionables` | — | `Mentionable[]` | Membros que podem ser mencionados neste canal |
| `PUT` | `/api/channels/{id}/read` | `{ last_read_at? }` | sem corpo | Marca o canal como lido |
| `GET` / `PUT` | `/api/channels/{id}/acl` | — / `AclEntryInput[]` | `AclEntry[]` | Regras por membro, cargo ou todos |
| `GET` | `/api/channels/{id}/access/{account}` | — | `AccessReport` | Acesso efetivo e fatores |
| `GET` | `/api/channels/{id}/mutes` | — | `Mute[]` | Silenciamentos ativos |
| `GET` | `/api/channels/{id}/mutes/me` | — | `MyMute` | Para o composer "silenciado até" |
| `PUT` / `DELETE` | `/api/channels/{id}/mutes/{account}` | `{ duration_minutes }` / — | `Mute` / sem corpo | Silenciar e dessilenciar |

### Mensagens, anexos, links e notificações

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `GET` | `/api/channels/{id}/messages?before=` | — | `Message[]` | Página mais recente primeiro. `before` pagina para trás. Só `content_ciphertext` |
| `POST` | `/api/channels/{id}/messages` | `PostMessageBody` `{ content_ciphertext, attachment_ids?, mentioned_account_ids?, reply_to_message_id?, mention_everyone? }` | `Message` (201) | Cria notificações de menção e de resposta. Emite `message.new` |
| `DELETE` | `/api/channels/{id}/messages/{mid}` | — | sem corpo | Por permissão. Emite `message.deleted` |
| `POST` | `/api/channels/{id}/attachments` | bytes cifrados + `X-Mesa-Media-Type` | `Attachment` (201) | O backend guarda bytes opacos |
| `GET` | `/api/attachments/{id}` | — | bytes + `X-Mesa-Media-Type` | Cifrados |
| `POST` | `/api/unfurl` | `{ url }` | `LinkPreview` | O servidor busca o URL (ele vê o URL) |
| `GET` | `/api/notifications?unread_only=&limit=` | — | `Notification[]` | `kind` é `mention` ou `reply` |
| `POST` | `/api/notifications/{id}/read` | — | sem corpo | |
| `POST` | `/api/notifications/read-all` | — | sem corpo | Ação "Limpar" |

### Voz, grade e E2EE do canal

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `POST` | `/api/channels/{id}/voice/join` | `{ mic_on, cam_on }` | `VoiceJoin` `{ token, url, room }` | Token LiveKit. `can_publish` segue a permissão de falar. Faz *upsert* da ocupação e tira o utilizador de outra mesa |
| `POST` | `/api/channels/{id}/voice/leave` | — | sem corpo | Liberta a posição na grade. Também chamado com `keepalive` ao fechar a aba |
| `PATCH` | `/api/channels/{id}/voice/media` | `{ mic_on?, cam_on?, screen_on? }` | sem corpo | Sem corpo serve de *heartbeat*. 403 se não for ocupante |
| `GET` | `/api/servers/{id}/voice-occupancy` | — | `VoiceOccupancy` | Snapshot, depois acompanhado por `voice.occupancy` |
| `POST` | `/api/channels/{id}/voice/e2ee` | `{ enabled, intent? }` | `{ e2ee_enabled, audit_id, at }` | Só o dono e só com `has_channel_key`. Regista auditoria. Emite `channel.e2ee_changed` |
| `GET` | `/api/channels/{id}/voice/channel-key` | — | `{ channel_key_sealed }` | Só o custodiante (403 caso contrário, 404 sem chave). Base da validação ao religar |
| `GET` / `PUT` | `/api/channels/{id}/grid` | — / `GridLayout` | `GridLayout` | Layout e posições da cena. `PUT` emite `grid.updated` |
| `GET` | `/api/channels/{id}/scenes` | — | `SceneList` | A v2 usa só a cena ativa |

### Chaves (handoff)

| Método | Caminho | Pedido | Resposta | Notas |
|--------|---------|--------|----------|-------|
| `POST` | `/api/servers/{id}/key-envelopes` | `{ account_id, sealed_key }` | 201 sem corpo | `sealed_key` é Base64 da caixa selada (80 bytes). Marca o handoff como concluído e emite `key_handoff.completed`. **409** `key already exists` quando o envelope próprio já existe com bytes diferentes, ou outro membro já tem envelope no escopo — primeiro escritor vence |
| `GET` | `/api/servers/{id}/key-envelopes/me` | — | `{ server_id, account_id, sealed_key }` | 404 "key envelope not ready" enquanto o handoff está pendente |
| `GET` | `/api/servers/{id}/key-envelopes/exists` | — | `{ exists: boolean }` | Indicador autoritativo de existência de envelope no Servidor, sem expor a chave; usado por `ensureServerKey` para não gerar chave nova quando já existe uma a sincronizar |

### Eventos WebSocket

Ligação `GET /ws` com o mesmo cookie. O cliente **só recebe**; a única mensagem que envia é o texto `ping` (a cada 25 s) como *keep-alive*. Envelope:

```json
{ "event": "message.new", "server_id": "uuid", "payload": { } }
```

| Evento | Destinatários | Payload | Efeito no cliente |
|--------|---------------|---------|-------------------|
| `message.new` | Quem pode ver o canal | `Message` | Acrescenta à timeline, marca não lido |
| `message.deleted` | Quem pode ver o canal | `{ id, channel_id }` | Remove da timeline |
| `notification.created` | A conta notificada | `Notification` (sem `account_id`) | Sino e indicadores |
| `presence` | Membros do servidor | `{ online_account_ids }` | Painel de Membros |
| `voice.occupancy` | Membros do servidor | `{ channel_id, call_started_at, occupants[] }` | Roster da sidebar, duração, PiP |
| `grid.updated` | Membros do servidor | `{ channel_id, grid: GridLayout }` | Palco e editor de cena |
| `scene.changed` | Membros do servidor | `{ channel_id, active_scene_id, scenes[] }` | Cena ativa |
| `channel.e2ee_changed` | Membros do servidor | `{ channel_id, e2ee_enabled, actor_account_id, at, intent }` | Chip, faixa "E2EE desligada", reinício da chamada |
| `channel.deleted` | Membros do servidor | `{ channel_id, server_id }` | Sai do canal e da chamada |
| `channel_role.changed` | Membros do servidor | `{ channel_id, roles }` | Papéis de canal |
| `server.deleted` | Membros do servidor | `{ server_id }` | Limpa a seleção, encerra a chamada |
| `invite.consumed` | Membros do servidor | `{ invite_code, new_member_account_id }` | Atualiza membros e cargos |
| `key_handoff.requested` | Membros que já têm a chave | `{ account_id, identity_pubkey }` | Sela a chave para o novo membro |
| `key_handoff.completed` | O membro novo | `{ account_id }` | Vai buscar o seu envelope |

O backend **não** emite eventos de criação de canal ou de servidor: o cliente refaz o pedido das listas. Após uma interrupção do socket o cliente reconecta com recuo exponencial (0,5 s a 15 s) e volta a pedir o que perdeu.

### Rotas do backend que a v2 não usa

Existem no backend por herança da v1 e estão fora do escopo da v2 (ver [`parity-checklist.md` §12](v2/parity-checklist.md)): gravação (`POST /api/channels/{id}/egress/start` e `/stop`), cenas múltiplas (`POST`, `PATCH`, `DELETE` em `/scenes`, `/duplicate`, `/activate`), papéis de co-diretor (`GET`/`PUT /api/channels/{id}/roles`), e a listagem e revogação de convites (`GET /api/servers/{id}/invites`, `POST /api/invites/{code}/revoke`).

### Política de alterações do backend

O backend da v1 é reaproveitado como está. Alterações só são admitidas quando aditivas, retrocompatíveis, com tarefa própria, testes e registo em [`docs/v2/contracts/backend-change-policy.md`](v2/contracts/backend-change-policy.md). Adições da v2 até agora: `GET /api/invites/{code}/handle-available`, `GET /api/channels/{id}/voice/channel-key`, e as rotas de recuperação de senha (`PUT /api/auth/password`, `POST /api/auth/recovery/code/redeem`, `POST /api/auth/recovery/key/{challenge,start,redeem}`, `PUT /api/auth/recovery-key`, `GET /api/servers/{id}/key-envelopes/exists`).

---

## Fluxos de integração

### 1. Registo, login e desbloqueio

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilizador
    participant C as Cliente
    participant B as Backend

    Note over U,B: Registo
    U->>C: handle e palavra-passe
    C->>C: gerar identidade NaCl box
    C->>C: Argon2id sobre a palavra-passe, AES-GCM da chave secreta = cofre
    C->>B: POST /api/auth/register (handle, password, identity_pubkey, identity_vault)
    B-->>C: Account + cookie Session
    C->>C: guardar cofre no IndexedDB, identidade so em memoria

    Note over U,B: Login no mesmo dispositivo
    U->>C: handle e palavra-passe
    C->>B: POST /api/auth/login
    B-->>C: Account (com identity_vault) + cookie Session
    C->>C: abrir cofre local com a palavra-passe

    Note over U,B: Recarregar a pagina ou dispositivo novo
    C->>B: GET /api/auth/me
    B-->>C: Account ou 204
    alt cofre local existe
        C->>U: pedir palavra-passe
        C->>C: abrir cofre local
    else so existe o cofre remoto
        C->>U: pedir palavra-passe
        C->>C: abrir identity_vault vindo do servidor
    else palavra-passe perdida
        C->>C: gerar nova identidade
        C->>B: PUT /api/auth/identity (nova pubkey + cofre)
        B->>B: apagar envelopes, handoff pendente em cada servidor
        B-->>C: Account
    end
```

### 2. Criar servidor e distribuir a chave

```mermaid
sequenceDiagram
    autonumber
    actor O as Dono
    participant C as Cliente
    participant B as Backend

    O->>C: nome do servidor e confirmar custodia
    C->>C: gerar chave do servidor (32 bytes)
    C->>C: gerar chave do canal de voz (32 bytes)
    C->>O: mostrar a chave do canal uma vez para guardar
    C->>C: channel_key_sealed = seal(chave do canal, pubkey do dono)
    C->>B: POST /api/servers (name, custody_ack, channel_key_sealed)
    B->>B: criar servidor, canal geral, canal de voz mesa, cargo Dono
    B->>B: guardar channel_key.sealed_blob
    B-->>C: Server
    C->>C: envelope = seal(chave do servidor, pubkey do dono)
    C->>B: POST /api/servers/id/key-envelopes (account_id do dono, sealed_key)
    B-->>C: 201
    C->>C: chave do servidor fica em memoria durante a sessao
```

### 3. Convite e entrada de um membro novo (handoff da chave)

```mermaid
sequenceDiagram
    autonumber
    actor A as Membro com permissao
    actor N as Convidado
    participant CA as Cliente A
    participant CN as Cliente N
    participant B as Backend
    participant CM as Clientes que ja tem a chave

    A->>CA: Convidar
    CA->>B: POST /api/servers/id/invites
    B-->>CA: Invite (code)
    A-->>N: link /invite/code
    N->>CN: abrir o link
    CN->>B: GET /api/invites/code
    B-->>CN: InvitePreview (server_name, requires_account_creation)
    CN->>B: GET /api/invites/code/handle-available?handle=
    B-->>CN: available
    CN->>CN: gerar identidade e cofre
    CN->>B: POST /api/invites/code/accept (handle, password, identity_pubkey, identity_vault)
    B->>B: criar conta, membership com handoff pendente
    B-->>CN: Membership (key_handoff_status pending) + cookie Session
    B--)CM: WS invite.consumed
    B--)CM: WS key_handoff.requested (account_id, identity_pubkey)
    CM->>CM: envelope = seal(chave do servidor, pubkey de N)
    CM->>B: POST /api/servers/id/key-envelopes
    B->>B: handoff = synced
    B--)CN: WS key_handoff.completed
    CN->>B: GET /api/servers/id/key-envelopes/me
    B-->>CN: sealed_key
    CN->>CN: unseal com a identidade, chave do servidor em memoria
```

Se N abrir a app antes de alguém com a chave estar online, `GET .../key-envelopes/me` responde 404 "key envelope not ready" e o cliente espera pelo evento `key_handoff.completed`.

### 4. Enviar e receber uma mensagem

```mermaid
sequenceDiagram
    autonumber
    actor A as Autor
    participant CA as Cliente A
    participant B as Backend
    participant CB as Cliente B (destinatario)

    opt anexos
        CA->>CA: cifrar bytes com a chave do servidor (AES-GCM)
        CA->>B: POST /api/channels/id/attachments (octet-stream + X-Mesa-Media-Type)
        B-->>CA: Attachment (id)
    end
    A->>CA: escrever (com @mencoes e resposta)
    CA->>CA: content_ciphertext = AES-GCM(chave do servidor, texto)
    CA->>B: POST /api/channels/id/messages (content_ciphertext, attachment_ids, mentioned_account_ids, reply_to_message_id)
    B->>B: guardar, criar notificacoes de mencao e de resposta
    B-->>CA: 201 Message
    B--)CB: WS message.new (Message)
    B--)CB: WS notification.created (so para quem foi mencionado ou respondido)
    CB->>CB: decifrar com a chave do servidor e mostrar
    opt anexos na mensagem
        CB->>B: GET /api/attachments/id
        B-->>CB: bytes cifrados
        CB->>CB: decifrar e mostrar miniatura
    end
    CB->>B: PUT /api/channels/id/read (ao ver a mensagem)
    CB->>B: POST /api/notifications/id/read
```

Mensagens apagadas seguem o caminho `DELETE /api/channels/{id}/messages/{mid}` seguido de `message.deleted`. A pesquisa corre toda no cliente: usa as mensagens que os canais abertos já decifraram e busca e decifra a página mais recente dos outros canais de texto. O termo pesquisado nunca é enviado ao servidor.

### 5. Entrar numa chamada de voz/vídeo

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilizador
    participant C as Cliente
    participant B as Backend
    participant L as LiveKit
    participant O as Outros membros

    U->>C: abrir canal de voz (pre-entrada)
    C->>C: pre-visualizar camera, microfone e blur localmente
    U->>C: Entrar (ou Entrar ouvir, ou Testar video)
    C->>B: POST /api/channels/id/voice/join (mic_on, cam_on)
    B->>B: upsert da ocupacao, sair de outra mesa, can_publish pela permissao de falar
    B-->>C: token, url, room
    opt chave do servidor ainda nao esta em memoria
        C->>B: GET /api/servers/id/key-envelopes/me
        B-->>C: sealed_key
    end
    C->>C: chave do servidor, E2EE de frames
    C->>L: ligar (token) com ExternalE2EEKeyProvider
    L-->>C: participantes e faixas cifradas
    B--)O: WS voice.occupancy (ocupantes, mic, cam, call_started_at)

    loop enquanto na chamada
        C->>B: PATCH /api/channels/id/voice/media (heartbeat e estado mic, cam, ecra)
        B--)O: WS voice.occupancy
    end

    U->>C: Terminar
    C->>L: desligar
    C->>B: POST /api/channels/id/voice/leave
    B->>B: apagar ocupacao, libertar posicao da grade
    B--)O: WS voice.occupancy e grid.updated
```

Ao fechar a aba, o cliente repete `voice/leave` com `keepalive`. Se a câmera falhar ou for negada, entra só com áudio e avisa. Se o canal ou o servidor forem apagados (`channel.deleted`, `server.deleted`), o cliente sai sozinho.

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> connecting: entrar
    connecting --> live: LiveKit ligado
    connecting --> idle: falhou (negado, sem chave, indisponivel)
    live --> reconnecting: ligacao caiu
    reconnecting --> live: voltou
    reconnecting --> idle: nao voltou
    live --> connecting: E2EE ligada ou desligada (rejoin)
    live --> idle: terminar, canal ou servidor apagado
```

### 6. Desligar e religar a E2EE de um canal de voz

```mermaid
sequenceDiagram
    autonumber
    actor O as Dono
    participant C as Cliente do dono
    participant B as Backend
    participant M as Outros clientes

    O->>C: desligar E2EE
    C->>B: POST /api/channels/id/voice/e2ee (enabled false)
    B->>B: so o dono, so com has_channel_key, auditoria
    B-->>C: e2ee_enabled false, audit_id, at
    B--)C: WS channel.e2ee_changed
    B--)M: WS channel.e2ee_changed (actor_account_id, at)
    C->>C: faixa permanente E2EE desligada (quem e quando), reentrar na sala sem cifra
    M->>M: faixa permanente, reentrar na sala sem cifra

    O->>C: Religar E2EE
    alt chave do canal ja no dispositivo
        C->>C: confirmar
    else nao esta no dispositivo
        O->>C: colar a chave do canal (44 caracteres)
        C->>C: validar o formato (32 bytes em Base64)
    end
    C->>B: GET /api/channels/id/voice/channel-key
    B-->>C: channel_key_sealed
    C->>C: unseal com a identidade e comparar com a chave fornecida
    alt iguais
        C->>B: POST /api/channels/id/voice/e2ee (enabled true, intent reenable)
        B--)M: WS channel.e2ee_changed
        C->>C: guardar a chave no dispositivo, reentrar na sala cifrada
    else diferentes
        C->>O: Esta nao e a chave deste canal (nada e enviado nem guardado)
    end
```

### 7. Cena, composição e grade

```mermaid
sequenceDiagram
    autonumber
    actor D as Dono (editor)
    participant CD as Cliente do dono
    participant B as Backend
    participant CM as Outros clientes

    CD->>B: GET /api/channels/id/grid
    B-->>CD: GridLayout (layout_key, slot_count, slots)
    D->>CD: atribuir pessoas a posicoes, escolher layout e numero de posicoes
    D->>CD: Salvar e aplicar
    CD->>B: PUT /api/channels/id/grid (GridLayout)
    B->>B: validar, guardar posicoes
    B-->>CD: GridLayout
    B--)CM: WS grid.updated (channel_id, grid)
    CM->>CM: Composicao atualiza sem acao do utilizador

    Note over B,CM: Quando alguem sai da chamada
    B->>B: unassign_account (a posicao fica livre)
    B--)CM: WS grid.updated
```

Quem não tem posição aparece na faixa "No banco". A vista Grade não depende da cena: mostra câmeras e partilhas de quem está na sala.

### 8. Notificação de menção e resposta

```mermaid
sequenceDiagram
    autonumber
    participant A as Cliente do autor
    participant B as Backend
    participant D as Cliente mencionado

    A->>B: POST /api/channels/id/messages (mentioned_account_ids, reply_to_message_id)
    B->>B: UserNotification mention para cada mencionado
    B->>B: UserNotification reply para o autor da mensagem respondida
    B--)D: WS notification.created (kind, channel_id, message_id, actor_account_id)
    D->>D: sino e indicadores, lista local
    D->>B: GET /api/notifications?unread_only=true&limit=100 (carga inicial e apos reconexao)
    B-->>D: Notification[]
    D->>B: POST /api/notifications/id/read (ao ver a mensagem)
    D->>B: POST /api/notifications/read-all (Limpar)
```

### 9. WebSocket: ligação, presença e reconexão

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant B as Backend

    C->>B: GET /ws (cookie Session)
    B->>B: autenticar, registar a conta como online
    B--)C: WS presence (online_account_ids) para os servidores da conta
    loop a cada 25 s
        C->>B: texto ping
    end
    B--)C: eventos do dominio (message.new, voice.occupancy, ...)
    Note over C,B: A ligacao cai
    C->>C: faixa de ligacao, recuo exponencial 0,5 s ate 15 s
    C->>B: GET /ws
    C->>B: refazer GET das listas, mensagens e ocupacao de voz
```
