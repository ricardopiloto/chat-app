# Review — Arquiteto de Soluções

**Change:** fix-call-controls-regressions-and-cleanup
**Data:** 2026-11-17 (revisado de novo: usuário restaurou o indicador de qualidade para todos os participantes, pediu revelar dados do tile por hover/foco/toque, e adicionar indicador de "deafened" — este último com impacto real no backend)
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack coerente em toda a extensão do escopo: frontend (SolidJS, Web Audio, LiveKit events, padrão hover/focus já usado no popout) e agora também backend (Rust/Axum/SQLite) para o campo `deafened_on` — nenhuma tecnologia nova, só extensão do que já existe.
- Responsabilidades claras em D7: o backend passa a ser a fonte de verdade persistida de `deafened_on` (como já é para `mic_on`/`cam_on`/`screen_on`), o frontend só reporta e lê — segue exatamente o padrão já estabelecido, não inventa um canal novo (ex. não usa metadata do LiveKit para isso, corretamente rejeitado em D7 porque "Deafen only mutes received audio locally and has no LiveKit publication signal").
- Escalabilidade: N/A para A e B (cliente, por participante); para C, uma coluna booleana adicional numa tabela já existente (`voice_occupant`) não tem impacto de escala relevante para o porte deste projeto self-hosted.

## 2. Integração com a infraestrutura existente

Veredito: OK

- **Verifiquei pessoalmente**: a migração proposta (`ALTER TABLE voice_occupant ADD COLUMN deafened_on INTEGER NOT NULL DEFAULT 0`) segue exatamente o padrão da migração `0020_voice_occupant_screen_on.sql` já existente no repositório (`ALTER TABLE voice_occupant ADD COLUMN screen_on INTEGER NOT NULL DEFAULT 0`) — é aditiva, com default seguro, sem backfill necessário. Confirmei também que `VoiceOccupant`/`OccupantView` (`backend/src/domain/voice_occupancy.rs`) e `VoiceMediaBody` (`backend/src/api/voice.rs:95`, hoje com `mic_on: Option<bool>`, `cam_on: Option<bool>`, `screen_on: Option<bool>`) têm exatamente a forma que o `design.md` assume.
- Nenhum processo, porta ou serviço novo. Nenhum impacto em `infra/docker-compose.yml`.
- Compatibilidade entre versões: D7 define corretamente que clientes/servidores antigos recebem/enviam um campo ausente tratado como `false` — é o mesmo princípio de rollout aditivo que este projeto já usa (confirmado pelo padrão da migração anterior).

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança (verificado, sem achado)**: conferi `backend/src/api/voice.rs:369-390` (`patch_media`) — o PATCH já é escopado por sessão (`AuthUser(account)` → `db::voice_occupancy::find_by_account(&state.pool, account.id)`), ou seja, ninguém pode alterar o `deafened_on` de outra pessoa; só a sua própria linha. D7 dizer que o deafen "pode ser atualizado independentemente das permissões de mídia, incluindo para listeners" é seguro porque isso só dispensa o `require_speak` (que hoje só se aplica a `mic_on`/`cam_on`/`screen_on` = true), não o escopo por conta. Não há risco de impersonação aqui.
- **Achado (Atenção)**: D6 (revelar dados do tile por hover/foco/toque) tem um ângulo de acessibilidade que o `design.md` só cobre parcialmente. Ele garante que um usuário de teclado consegue alcançar os controles via `tabindex`/ordem de foco, mas não menciona leitores de tela que navegam por gestos (ex. VoiceOver "swipe", não exclusivamente Tab) — esses podem nunca "focar" no sentido que dispara o hover/focus visual, dependendo de como a visibilidade é implementada (`opacity`/`pointer-events` vs. algo que também afeta a árvore de acessibilidade). Recomendação: ao implementar, confirmar que o conteúdo da legenda (nome, estado, etc.) continua exposto à árvore de acessibilidade mesmo quando visualmente oculto (ex. não usar `display:none`/`visibility:hidden`, que removem do DOM de acessibilidade — usar só `opacity`/`pointer-events` como o padrão do popout já faz, o que é o correto, mas vale confirmar isso explicitamente no design em vez de ficar implícito).
- Manutenibilidade: reaproveitar o padrão hover/focus já existente no popout (D6) em vez de inventar um novo mecanismo é a escolha certa — reduz a superfície de manutenção.
- O risco de perder visibilidade "num piscar de olhos" de quem está mudo/deafened numa grade cheia (já listado no `design.md`) é uma troca honesta pedida explicitamente pelo usuário — correto não tentar mitigar silenciosamente contra o que foi pedido.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1–D7 seguem o padrão já estabelecido, com alternativa rejeitada e motivo em cada uma. D7 em particular é exemplar: cita os arquivos exatos, o nome exato dos campos, a migração de precedência real, e já antecipa compatibilidade com clientes/servidores antigos — nível de detalhe equivalente ao melhor já visto nesta leva de changes.
- Sem diagrama — aceitável: o fluxo de dados (cliente reporta → backend persiste → outros clientes leem) já é o mesmo padrão textual usado para `mic_on`/`cam_on`/`screen_on`, sem necessidade de um novo diagrama.

## 5. Ponte entre produto e técnico

Veredito: OK

- As três mudanças de escopo pedidas pelo usuário nesta rodada (manter posição do indicador de qualidade, revelar por hover/toque, mostrar "deafened") foram todas traduzidas em decisões técnicas verificáveis, incluindo a parte que o usuário não necessariamente esperava (o toque em backend para "deafened") — isso foi corretamente surfaced antes da implementação, não descoberto tarde.
- A decisão de toque em mobile (tap para revelar/alternar) reflete a escolha explícita do usuário em vez de uma suposição.

## Bloqueantes antes de implementar
- nenhum
