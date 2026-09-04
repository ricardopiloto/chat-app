# Data Model: Fase 1 — MVP (cliente web)

Persistência: SQLite (arquivo único por Instância), via `sqlx` ([D6](./research.md#d6--sem-postgres-nem-abstração-de-repository-nesta-fase)). Convenção: `id` = UUID v4 (texto), timestamps UTC (`created_at`/etc.), booleanos como `INTEGER 0/1`. Nenhuma tabela guarda conteúdo de mensagem ou chave de mídia em claro — só ciphertext opaco ao servidor (FR-015).

## Visão geral

```text
HostingInstance (implícita — 1 processo = 1 instância)
  └─ Account (1..N)
       ├─ owns → Server (0..N)
       └─ Membership → Server (N..N)
Server
  ├─ Channel (1..N: text | voice_video)
  ├─ Invite (0..N)
  └─ server_key envelope por membro (KeyEnvelope, N..N com Account)
Channel(text) ── Message (0..N)
Channel(voice_video) ── GridSlot (2..4) ── Membership
```

---

## Account

Identidade de login na instância. A primeira conta criada (instância sem nenhuma) é o operador inicial (FR-002).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `handle` | text | Único (case-insensitive) na instância; identificador de login |
| `password_hash` | text | Argon2id |
| `identity_pubkey` | blob | Chave pública X25519 gerada no cliente ([D4](./research.md#d4--chave-de-identidade-do-usuário-gerada-e-mantida-só-no-navegador)); usada para envelopar `server_key` a esta conta |
| `is_initial_operator` | bool | `true` só na primeira conta da instância; informativo (não é um cargo com poderes extras nesta fase além de ter existido primeiro) |
| `created_at` | datetime | |

**Regra de criação**: `INSERT` só passa se (a) a instância não tem nenhuma `Account` ainda **ou** (b) a requisição carrega um `Invite` válido, não expirado, não revogado (FR-002, FR-007).

## Session

Token de sessão opaco ([D3](./research.md#d3--sessão-token-opaco-server-side-em-cookie-httponly)).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `account_id` | uuid | FK → Account |
| `token_hash` | text | Hash do token opaco enviado ao cliente (o valor em claro só existe no cookie) |
| `expires_at` | datetime | Sessão expira; renovável por atividade (política de implementação) |
| `revoked_at` | datetime? | Setado no logout — presença deste campo invalida a sessão imediatamente |
| `created_at` | datetime | |

## Server

Unidade social (FR-003). Dono é a `Account` criadora.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `owner_account_id` | uuid | FK → Account |
| `created_at` | datetime | |

**Isolamento**: toda query de `Channel`, `Message`, `Invite`, `Membership` desta fase é escopada por `server_id`; nenhum endpoint retorna dado de um Servidor sem `Membership` da conta pedinte (FR-005, SC-007).

## Membership

Vínculo conta↔Servidor. N..N.

| Campo | Tipo | Regras |
|---|---|---|
| `account_id` | uuid | FK → Account |
| `server_id` | uuid | FK → Server |
| `joined_at` | datetime | Marca o corte de histórico quando o convite usado não incluiu histórico (FR-008) |
| `joined_via_invite_id` | uuid? | FK → Invite; nulo para o dono na criação do Servidor |
| `key_handoff_status` | enum | `synced` \| `pending` — `pending` enquanto nenhum cliente já-sincronizado enviou o envelope da `server_key` a esta conta ([D5](./research.md#d5--e2ee-de-texto-e-mídia-uma-chave-simétrica-por-servidor-handoff-online-entre-clientes)) |

PK composta `(account_id, server_id)`.

## KeyEnvelope

A `server_key` (chave simétrica AES-256-GCM do Servidor) envelopada (`crypto_box_seal`) para a chave pública de cada membro. O servidor só armazena/roteia bytes opacos.

| Campo | Tipo | Regras |
|---|---|---|
| `server_id` | uuid | FK → Server |
| `account_id` | uuid | FK → Account (destinatário do envelope) |
| `sealed_key` | blob | `server_key` cifrada para `identity_pubkey` desta conta; opaca ao servidor |
| `sealed_by_account_id` | uuid | Quem gerou o envelope (o cliente que já tinha a chave) |
| `created_at` | datetime | |

PK composta `(server_id, account_id)`. Existência desta linha ⇒ `Membership.key_handoff_status = 'synced'` para o par.

## Channel

Pertence a um Servidor; tipo `text` ou `voice_video` (FR-004). Nesta fase, visível a todo membro do Servidor (FR-005) — sem ACL por canal.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `server_id` | uuid | FK → Server |
| `name` | text | |
| `type` | enum | `text` \| `voice_video` |
| `grid_slot_count` | int? | Só para `voice_video`; 2–4, default 4 (FR-010) |
| `created_at` | datetime | |

## Message

Corpo sempre ciphertext (FR-008, FR-015). Aplica a canais `text` e ao texto de canais `voice_video`.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `channel_id` | uuid | FK → Channel |
| `sender_account_id` | uuid | FK → Account |
| `content_ciphertext` | blob | Cifrado no cliente com a `server_key` do Servidor dono do canal |
| `created_at` | datetime | Ordena a exibição (FR-008: "ordem cronológica") |

**Regra de leitura por histórico**: `GET` de mensagens filtra `created_at >= Membership.joined_at` quando o convite usado não incluiu histórico; sem filtro quando incluiu (FR-008, US2 Acceptance Scenarios 5–6). O filtro é uma restrição de **consulta**, não uma segunda chave — a `server_key` é única por Servidor ([D5](./research.md#d5--e2ee-de-texto-e-mídia-uma-chave-simétrica-por-servidor-handoff-online-entre-clientes)).

## Invite

Link de ingresso num Servidor; também o único caminho de cadastro após a primeira conta (FR-006, FR-007).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | Token único, alta entropia, usado na URL do convite |
| `server_id` | uuid | FK → Server |
| `created_by_account_id` | uuid | FK → Account (deve poder administrar o Servidor) |
| `expires_at` | datetime? | `null` = convite permanente (FR-006) |
| `include_history` | bool | Default `false` (FR-006, Clarifications) |
| `revoked_at` | datetime? | Setado ao revogar; convite revogado nunca mais aceita (Edge Cases) |
| `created_at` | datetime | |

**Regra de aceite**: rejeitar se `revoked_at` setado, ou `expires_at` no passado (US2 Acceptance Scenario 7).

## GridSlot

Mapa da grade de câmeras de um canal `voice_video`. 2–4 posições (FR-010).

| Campo | Tipo | Regras |
|---|---|---|
| `channel_id` | uuid | FK → Channel |
| `slot_index` | int | `0..grid_slot_count-1`, ordem esquerda→direita, cima→baixo (FR-011) |
| `account_id` | uuid? | Conta ocupando o slot; `null` = vazio (visível, sem compactar — FR-010) |
| `assigned_by` | enum | `auto` (primeiro-vazio, FR-011) \| `owner` (mapa manual, FR-012) |
| `updated_at` | datetime | |

PK composta `(channel_id, slot_index)`. Ao reduzir `grid_slot_count`, slots com `slot_index >= novo_count` são removidos; contas que ocupavam esses slots ficam sem slot (Edge Cases) até o dono recolocar — não há campo de "slot antigo" a preservar.

**Regra de atribuição automática** (enquanto não há mapa do dono): ao publicar A/V pela primeira vez num canal, a conta ocupa o menor `slot_index` com `account_id IS NULL`. Se a conta já teve um `slot_index` nesse canal (linha existente, mesmo com A/V atualmente parado), ela retorna ao mesmo índice em vez de buscar o primeiro vazio (FR-011, US3 Acceptance Scenario 4) — isso implica que uma linha de `GridSlot` **não é removida** quando a conta para de publicar/sai; só `account_id` zera se o dono explicitamente liberar o slot via mapa manual.

**Regra de conflito multi-dispositivo**: a atribuição de slot é por `account_id`, nunca por dispositivo/sessão de mídia — o "último dispositivo a publicar prevalece" (FR-009) é um estado de **sessão de mídia no LiveKit** (qual `participant identity` está publicando agora), não uma coluna nova aqui; `GridSlot.account_id` não muda quando o segundo dispositivo assume.

## Key Entities não persistidas (vivem só em memória de processo / cliente)

- **MediaSession** (LiveKit-side): participante ativo numa sala LiveKit; `identity` = `account_id`; no máximo uma sessão publicando A/V por `account_id` — reforçado revogando/ignorando publish do dispositivo anterior quando um novo publica com a mesma identity (FR-009).
- **AccessToken**: JWT LiveKit emitido pelo `token` module do backend, mesmo contrato validado no spike (`sub`=`account_id`, `video.room`=`channel_id`, TTL curto, secret nunca no payload) — ver [contracts/token-api.yaml](./contracts/token-api.yaml).
- **Identity keypair** (cliente): gerado no cadastro, chave privada nunca sai do navegador ([D4](./research.md#d4--chave-de-identidade-do-usuário-gerada-e-mantida-só-no-navegador)).

## Índices sugeridos

- `Account(handle)` único.
- `Invite(code)` único.
- `Membership(account_id, server_id)` PK cobre lookups de "meus Servidores" e "sou membro?".
- `Message(channel_id, created_at)` para paginação cronológica.
- `GridSlot(channel_id, slot_index)` PK cobre render da grade.
