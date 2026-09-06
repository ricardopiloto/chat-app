# Research: 028-voice-call-roster

## R1 — Fonte de verdade da ocupação

**Decision**: Tabela SQLite `voice_occupant` (uma linha por conta na mesa) + `channel.voice_session_started_at`. Snapshot REST + evento WS `voice.occupancy`. **Não** usar slots da grade como ocupação. **Não** consultar a sala LiveKit no backend nesta entrega.

**Rationale**: A grade persiste o slot depois de Sair (hoje não há leave no servidor). Observadores em canal de texto **não** estão na sala LiveKit, logo não vêem tracks remotas. O spec 002 descreve `presence.update` (online + canal) mas **não está implementado** e mistura «online na instância» com mesa — a lista desta feature é só mesa + mídia.

**Alternatives considered**: Só `grid.updated` — slots órfãos e sem mic/câmera. Poll LiveKit RoomService — dep de admin API e chaves extra. Só estado no cliente — a coluna dos outros mente.

## R2 — Início/fim da sessão de chamada

**Decision**: Ao passar de **0 → 1** ocupante, gravar `voice_session_started_at = now()`. Ao passar de **1 → 0**, pôr `NULL`. O cronómetro = `now - voice_session_started_at`. **Não** usar `MIN(joined_at)` dos ocupantes actuais (se A entra, B entra, A sai, o tempo da sessão deve continuar desde A).

**Rationale**: Clarificação B — o relógio é da mesa, não de quem transmite nem do último que restou.

**Alternatives considered**: Relógio só no cliente (diverge entre observadores). `MIN(joined_at)` (quebra o caso A sai, B fica).

## R3 — Sessão LiveKit fora da rota de voz

**Decision**: Subir `joinLiveRoom` / disconnect para um contexto no `App`/`AppShell` (`VoiceSession`). `VoiceChannel` **não** faz `disconnect` no `onCleanup` da rota. Navegar para texto mantém a sala. **Sair** (barra ou botão) chama `POST .../voice/leave` + `disconnect`. Clicar noutro canal de voz: leave do actual + join do novo (uma mesa por conta; unique `account_id` em `voice_occupant`).

**Rationale**: FR-014 / US5. Hoje `VoiceChannel` desliga no unmount (~L506–522) — isso parte «ficar na mesa no `#geral`».

**Alternatives considered**: Renderizar `VoiceChannel` oculto (DOM pesado, palco falso). Segunda ligação LiveKit (proibido pelo spec — uma mesa).

## R4 — Mic / câmera na lista

**Decision**: O cliente reporta `PATCH /api/channels/{id}/voice/media` `{ mic_on, cam_on }` após join e em cada toggle. A lista aninhada mostra ocupantes com `mic_on OR cam_on`. Default no join: o que o cliente realmente publicou (hoje o join captura A/V ligados).

**Rationale**: Clarificação C. Só o dono da track sabe o estado local; o servidor replica para os outros.

**Alternatives considered**: Inferir via LiveKit no backend (sem RoomService). Lista 100% no cliente LiveKit (falha para quem está em texto).

## R5 — Abandono sem Sair (aba morta)

**Decision**: `POST leave` em `onDisconnected` do LiveKit e em `pagehide`. Heartbeat `PATCH` (ou POST dedicado) ~20 s; se `last_seen` &gt; 45 s, o servidor remove o ocupante e pode fechar a sessão (0 ocupantes). TestApp pode desligar o expiry ou usar timestamps injectados.

**Rationale**: Sem isto o cronómetro corre para sempre após crash. Webhooks LiveKit são overkill para uma instância SQLite.

**Alternatives considered**: Só `beforeunload` (não fiável). Sem expiry (rejeitado pelo spec de sessão).

## R6 — Chrome «ainda na mesa»

**Decision**: Barra persistente no `AppShell` (fora do painel da mesa): nome do canal, cronómetro da **sessão** (mesmo valor que a coluna), acções **Voltar à mesa** e **Sair**. Não é o chip «Disponível» do fundo da coluna (fora de âmbito).

**Rationale**: FR-014 — não transmitir sem saber. Discord usa a barra verde; Mesa usa a sessão de canal, não tempo pessoal.

**Alternatives considered**: Só lista aninhada (fácil esquecer Sair). Modal bloqueante (pior UX).

## R7 — Grade no leave

**Decision**: `POST leave` (e move) **liberta** o slot da grade desse `account_id` e emite `grid.updated`, para a mesa não mostrar quem já saiu da chamada.

**Rationale**: Hoje o join preenche o slot e o leave cliente não limpa a base. A ocupação nova seria contraditória com a grade.

**Alternatives considered**: Deixar slots órfãos (status quo) — rejeitado.

## R8 — Evento WS

**Decision**: Evento novo `voice.occupancy` com **snapshot por canal** (`channel_id`, `call_started_at`, `occupants[]`). Não implementar o `presence.update` genérico (online/offline) nesta feature.

**Rationale**: A coluna precisa de um merge simples; snapshot evita estado partido. `presence.update` do 002 misturaria «online» (fora de âmbito).

**Alternatives considered**: Estender `presence.update` com `mic_on` (carga semântica errada). Diff-only patches (mais bugs).
