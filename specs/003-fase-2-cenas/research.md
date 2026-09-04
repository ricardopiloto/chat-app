# Research: Fase 2 — Cenas de câmera trocáveis

Fecha as lacunas de implementação da spec ( Clarifications 2026-09-04 ) sobre o código da Fase 1 (`grid_slot`, `PUT /grid`, `grid.updated`, `is_channel_admin` = dono do Servidor). Nenhum item fica como NEEDS CLARIFICATION.

---

## D1 — Cena é tabela; `grid_slot` do canal migra para a cena padrão

- **Decision**: Cada canal `voice_video` tem N linhas em `scene` e um `channel.active_scene_id` NOT NULL. O mapa de slots vive em `scene_slot` (PK `scene_id, slot_index`), não mais como único mapa do canal. Na migration, para cada canal existente: criar cena nomeada **"Cena padrão"**, copiar `grid_slot` → `scene_slot`, apontar `active_scene_id`, manter `channel.grid_slot_count` igual ao `slot_count` da cena ativa (coluna denormalizada para o contrato F1 de `Channel`).
- **Rationale**: FR-001 exige cena ativa o tempo todo e preservação do layout F1. Copiar em vez de reinterpretar `grid_slot` “às escondidas” deixa o histórico de cenas explícito e permite duplicar sem aliasing.
- **Alternatives considered**: JSON blob de cenas numa coluna do canal — rejeitado: queries de slot, unicidade de `account_id` por cena e migration a partir de `grid_slot` ficam piores. Manter `grid_slot` como “ativa” e outras cenas noutro sítio — rejeitado: dois modelos para o mesmo mapa.

Após a migration, `grid_slot` deixa de ser fonte de verdade (pode ser dropada na mesma migration ou na seguinte, desde que nenhum código F1 a leia).

---

## D2 — `GET`/`PUT /channels/{id}/grid` opera na **cena ativa**

- **Decision**: Os endpoints F1 de grade continuam. `GET` devolve o layout da cena ativa (mesmo schema `grid-layout.json`). `PUT` substitui o mapa **dessa** cena (efeito imediato ao vivo, spec US1 / edge “editar cena ativa”). Não cria cena nova.
- **Rationale**: O `VoiceChannel` / `GridAdmin` / join de voz já falam com `/grid` e `grid.updated`. Reduzir retrabalho e cumprir “editar ativa = imediato”.
- **Alternatives considered**: Deprecar `/grid` só com `/scenes/{id}` — rejeitado nesta fase: quebra o cliente F1 e o teste `grid_admin` sem ganho de produto.

`PUT /scenes/{sceneId}` edita uma cena qualquer (incluindo inativa, sem mexer no quadro). `PUT /grid` é atalho para `PUT` da ativa.

---

## D3 — Ativar cena emite `grid.updated` + `scene.changed`

- **Decision**: `POST .../scenes/{id}/activate` (admin ou co-diretor) numa transação: `active_scene_id = id`, `channel.grid_slot_count = scene.slot_count`. Hub:
  1. `grid.updated` — payload F1 (`channel_id` + `grid` da nova ativa) para os tiles de vídeo existentes (&lt;3s, SC-002).
  2. `scene.changed` — `channel_id`, `active_scene_id`, lista resumida (id, name, is_active) para a UI de cenas.
- **Rationale**: A chamada LiveKit **não** reinicia: mesma room, mesmas identities. Só o mapa de slots na página muda (spec: “sem sair da chamada”). Reusar `grid.updated` evita um segundo caminho no `CameraGrid`.
- **Alternatives considered**: Só `scene.changed` e o cliente refetch `/grid` — um RTT a mais, risco de dessincronizar tiles. Trocar de room LiveKit por cena — rejeitado: derruba A/V (viola SC-007).

Criar/duplicar/apagar/renomear inativa: só `scene.changed` (sem `grid.updated`, salvo se a edição for da ativa via D2).

Última escrita vence (edge de duas ativações simultâneas): um `UPDATE` de `active_scene_id` + emit do estado lido após commit.

---

## D4 — Co-diretor = linha em `channel_role`, não cargo de Servidor

- **Decision**: Tabela `channel_role (channel_id, account_id, role='co_director')`. Só `is_channel_admin` (hoje = dono do Servidor, F1) concede/revoga. Co-diretor: `POST activate` permitido; CRUD de cenas e roles → 403. Vários co-diretores por canal. Membership no Servidor é pré-requisito.
- **Rationale**: Spec Q3: quem administra o canal (incluindo dono do Servidor); co-diretor não delega. F1 ainda não tem admin de canal distinto do dono — não inventar essa tabela agora.
- **Alternatives considered**: Flag em `membership` — rejeitado: o papel é **por canal**, não por Servidor. Reusar “admin de canal” genérico — rejeitado: a spec distingue admin (CRUD) de co-diretor (só ativar).

---

## D5 — Nome de cena único por canal, obrigatório, dado pelo cliente

- **Decision**: `UNIQUE(channel_id, lower(name))`. Nome trimado, 1–64 caracteres, não vazio. Cópia da ativa e duplicata **exigem** `name` no body; o servidor não inventa “Mesa (2)”. Cena migrada chama-se `Cena padrão`; se o nome colidir depois, o rename do utilizador falha com 409.
- **Rationale**: Clarify deixou unicidade para o plano; nomes iguais tornariam a lista inútil. Auto-sufixo é UX extra fora da spec.
- **Alternatives considered**: Ids só na UI — pior para a mesa. Sufixo automático — adiado.

Teto: **32 cenas por canal** (400 em create se exceder). Grupo pequeno; evita lixo acidental.

---

## D6 — Primeiro-vazio só na cena ativa “ainda automática”

- **Decision**: `POST /voice/join` continua a poder preencher o menor slot vazio da **cena ativa**, mas **somente** se essa cena ainda está `assigned_by = auto` (nenhum slot `owner`). Cenas criadas por cópia ou duplicata nascem com todos os slots `assigned_by = owner` (composição intencional, vazios de propósito). Depois do primeiro `PUT` de mapa numa cena, ela fica `owner` e join **não** ocupa vazios — o recém-chegado ouve/vê sem slot (FR-007).
- **Rationale**: Preserva US3 da Fase 1 no canal recém-criado / cena padrão intocada. Impede que um quarto jogador “encha” a cena “foco no mestre”.
- **Alternatives considered**: Remover auto-assign por completo — quebraria o default F1. Auto-assign sempre na ativa — violaria vazios intencionais.

Rejoin: se a conta já tem `account_id` num `scene_slot` da ativa, mantém o índice (igual F1).

---

## D7 — Sem Egress, sem desligar E2EE, sem schema de captura

- **Decision**: Nenhum endpoint, coluna, nem controlo de UI para proteção off ou gravação. Manter o teste F1 `no_e2ee_toggle` (ou equivalente) a falhar se aparecer rota nova desse tipo (SC-005, FR-009).
- **Rationale**: Spec Q1. O doc de arquitetura prevê Egress depois; implementar o interruptor “vazio” agora seria C da clarify, rejeitada.
- **Alternatives considered**: Flag `e2ee_enabled` morta — rejeitado, superfície falsa.

O formato JSON da cena (posições + contas) continua o ponto de reuso futuro com template de Egress — **não** se implementa o consumidor nesta fase.

---

## D8 — Testes: contrato Rust + quickstart ao vivo

- **Decision**: Igual F1 (research D8): `cargo test` para regras de domínio e HTTP; dois navegadores para SC-002/SC-007.
- **Rationale**: Constituição não ratificada; troca visual &lt;3s não se prova bem sem A/V real.
- **Alternatives considered**: Playwright — continua adiado.

---

## D9 — UI: lista de cenas no canal de vídeo; GridAdmin aponta para uma cena

- **Decision**: No `VoiceChannel`, painel visível a membros (lista + indicador da ativa). Admin: criar (cópia da ativa), duplicar (cena escolhida), renomear, editar mapa, apagar (inativa), ativar. Co-diretor: só ativar. Membro: só ver. `GridAdmin` existente edita a cena seleccionada (default = activa); guardar inativa não emite `grid.updated`.
- **Rationale**: Spec US1/US2. Reusa `CameraGrid` + `Index` (já evita destruir tiles em `grid.updated`).
- **Alternatives considered**: Editor separado tipo estúdio — fora de escopo.
