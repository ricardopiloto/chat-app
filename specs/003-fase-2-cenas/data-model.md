# Data Model: Fase 2 — Cenas de câmera trocáveis

Herdado da Fase 1 ([`specs/002-fase-1-mvp/data-model.md`](../002-fase-1-mvp/data-model.md)). Persistência: SQLite / `sqlx`. Esta fase **não** altera Account, Session, Server, Membership, Message, Invite, KeyEnvelope nem E2EE.

## Visão geral (delta)

```text
Channel(voice_video)
  ├─ active_scene_id → Scene (1, obrigatório)
  ├─ Scene (1..32)
  │    └─ SceneSlot (2..4) ── Account?
  └─ ChannelRole (0..N) ── Account  (role = co_director)
```

`GridSlot` ao nível do canal **deixa de ser fonte de verdade** (migration copia para a cena padrão e remove ou ignora a tabela antiga — [D1](./research.md#d1--cena-é-tabela-grid_slot-do-canal-migra-para-a-cena-padrão)).

---

## Channel (campos novos / sentido novo)

| Campo | Tipo | Regras |
|---|---|---|
| `active_scene_id` | uuid | FK → Scene; NOT NULL em `voice_video` após migration. Sempre uma cena ativa (FR-001). |
| `grid_slot_count` | int? | Continua no JSON F1 de Channel; **espelha** `Scene.slot_count` da cena ativa ([D1](./research.md#d1--cena-é-tabela-grid_slot-do-canal-migra-para-a-cena-padrão)). |

Canais `text`: `active_scene_id` NULL, sem cenas.

**Migration (canais existentes)**: inserir `Scene` name=`Cena padrão`, `slot_count` = `grid_slot_count`, copiar cada `grid_slot` para `scene_slot`, setar `active_scene_id`. Canal `voice_video` novo: mesma cena padrão vazia (4 slots, `assigned_by=auto`), como o `init_empty` F1.

---

## Scene

Composição nomeada da grade de um canal `voice_video` (FR-002).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `channel_id` | uuid | FK → Channel ON DELETE CASCADE |
| `name` | text | 1–64 chars após trim; **único** por canal case-insensitive ([D5](./research.md#d5--nome-de-cena-único-por-canal-obrigatório-dado-pelo-cliente)) |
| `slot_count` | int | 2–4 |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Limite**: no máximo 32 cenas por `channel_id` (create/duplicate → 400 se exceder).

**Não se apaga** se `id = channel.active_scene_id` (FR-003, spec Q4) nem se for a última cena do canal.

**Create from active**: novo `Scene` + cópia de todos os `scene_slot` da ativa; slots da cópia com `assigned_by = owner` ([D6](./research.md#d6--primeiro-vazio-só-na-cena-ativa-ainda-automática)). `active_scene_id` **não** muda.

**Duplicate**: igual, origem = `scene_id` pedido (pode ser inativa). `active_scene_id` **não** muda.

---

## SceneSlot

Mapa de uma cena. Mesmas regras de ocupação da Fase 1, no âmbito da cena.

| Campo | Tipo | Regras |
|---|---|---|
| `scene_id` | uuid | FK → Scene ON DELETE CASCADE |
| `slot_index` | int | `0..slot_count-1` |
| `account_id` | uuid? | Conta no slot; `null` = vazio visível; no máximo um slot por `account_id` nesta cena |
| `assigned_by` | enum | `auto` \| `owner` |
| `updated_at` | datetime | |

PK `(scene_id, slot_index)`.

Reduzir `slot_count`: apagar índices `>= novo_count`; contas nesses slots ficam sem câmara nesta cena até remapear.

Conta que saiu do Servidor: `account_id` pode ficar stale; ao renderizar, tratar como vazio (edge spec) — opcionalmente NULL no próximo PUT.

---

## ChannelRole

Papel extra **por canal** ([D4](./research.md#d4--co-diretor--linha-em-channel_role-não-cargo-de-servidor)).

| Campo | Tipo | Regras |
|---|---|---|
| `channel_id` | uuid | FK → Channel ON DELETE CASCADE |
| `account_id` | uuid | FK → Account |
| `role` | text | Nesta fase só `co_director` |
| `granted_by_account_id` | uuid | Quem concedeu (admin do canal) |
| `created_at` | datetime | |

PK `(channel_id, account_id, role)`. A conta MUST ser membro do Servidor do canal.

**Permissões**

| Acção | Membro | Co-diretor | Channel admin (dono do Servidor) |
|---|---|---|---|
| Listar cenas / ver activa | sim | sim | sim |
| Ativar cena | não | sim | sim |
| Criar / duplicar / editar / apagar / renomear | não | não | sim |
| Conceder / revogar co-diretor | não | não | sim |
| `PUT /grid` (editar activa) | não | não | sim |

---

## Estado da cena activa (não é tabela)

`Channel.active_scene_id` + `Scene` + `SceneSlot`. `GET /grid` e o evento `grid.updated` projectam **só** este estado ([D2](./research.md#d2--getput-channelsidgrid-opera-na-cena-ativa), [D3](./research.md#d3--ativar-cena-emite-gridupdated--scenechanged)).

Join de voz: auto primeiro-vazio **apenas** se a cena activa ainda é `auto` ([D6](./research.md#d6--primeiro-vazio-só-na-cena-ativa-ainda-automática)).

---

## Índices

- `Scene(channel_id, lower(name))` UNIQUE
- `Scene(channel_id)` para listar
- `Channel(active_scene_id)`
- `ChannelRole(channel_id, account_id)`
- `SceneSlot(scene_id, slot_index)` PK; índice `SceneSlot(account_id)` opcional para “em que cenas esta conta aparece”
