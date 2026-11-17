# Review — Desenvolvedor Fullstack

**Change:** fix-call-controls-regressions-and-cleanup
**Data:** 2026-11-17 (revisado de novo: qualidade de conexão restaurada para todos os participantes, revelação por hover/foco/toque adicionada, indicador de "deafened" adicionado com impacto em backend)
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: OK

- **Confirmado no código real**: `backend/src/db/voice_occupancy.rs:131-136`, `update_media(pool, account_id, channel_id, mic_on: Option<bool>, cam_on: Option<bool>, ...)` já recebe os flags como parâmetros posicionais `Option<bool>` — adicionar um quarto parâmetro `deafened_on: Option<bool>` é uma extensão direta e consistente com a assinatura já existente, exatamente como D7 descreve.
- **Confirmado**: `backend/src/api/voice.rs:369-390` (`patch_media`) já escopa o PATCH por `AuthUser(account)` + `find_by_account(&state.pool, account.id)` — a decisão de D7 de permitir deafen "independentemente das permissões de mídia" é segura porque só dispensa o `require_speak` (hoje só exigido quando `mic_on`/`cam_on`/`screen_on` = true), nunca o escopo por conta autenticada.
- Migração: confirmei que `backend/migrations/0020_voice_occupant_screen_on.sql` é exatamente `ALTER TABLE voice_occupant ADD COLUMN screen_on INTEGER NOT NULL DEFAULT 0;` — a nova migração proposta segue esse padrão ao pé da letra, sem necessidade de backfill.
- Testes de contrato: `backend/tests/contract/voice_occupancy.rs` já usa `#[tokio::test]` em múltiplos casos — adicionar os casos descritos na task 2c.1 (default false, PATCH true/false, listener PATCH, compat com campo antigo) cabe no padrão já existente do arquivo, sem precisar de infraestrutura de teste nova.

## 2. Desenvolvimento do frontend

Veredito: OK

- **Achado positivo concreto**: confirmei `frontend/src/voice/CallControls.tsx:72` — `<Icon name={call.deafened() ? "headset_off" : "headset_mic"} />` já é o ícone usado no botão de deafen local. A sugestão do `design.md` de reaproveitar `headset_off` no tile de outros participantes é exatamente consistente com o ícone já em uso, não introduz um novo vocabulário visual.
- Confirmei `frontend/src/api/types.ts:302-313` — `MediaFlags` e `Occupant` têm hoje exatamente os três campos (`mic_on`, `cam_on`, `screen_on`) que o `design.md` assume; estender ambos com `deafened_on` é mecânico.
- Confirmei `frontend/src/voice/people.ts:17-27` — `TileData` já é montado campo a campo a partir do occupant (`camera: p.camera, micOn: p.micOn, listener: p.listener`); adicionar `deafened` ali segue o mesmo padrão linha a linha, sem refactor.
- Hover/toque (D6): viável reaproveitando o padrão já existente do popout (`hovering`/`focusWithin`/`visible`). Verifiquei quem usa `<Tile onClick=...>` hoje — `GridView.tsx`, `CompositionView.tsx` e `FloatingPlayer.tsx` não passam `onClick` a nenhuma instância de `Tile` atualmente, embora o componente aceite essa prop. Ou seja, não há conflito real hoje entre "primeiro toque revela" e "toque seleciona o tile" — mas, como a prop existe e pode ser usada por uma view futura (ou já estar planejada), vale deixar escrito no `design.md`/código qual toque tem precedência (revelar vs. selecionar) para quando `onClick` for de fato usado, em vez de deixar essa decisão implícita até o dia em que colidir.

## 3. Deploy e operação

Veredito: OK

- Sem porta, variável de ambiente ou serviço novo. A migração é aditiva e roda com o mecanismo de migração já existente do projeto (mesma esteira usada por `0020`).
- Nada de monitoramento novo necessário — o campo é só mais um booleano de occupancy, do mesmo tipo que já existe hoje.

## 4. Qualidade de código

Veredito: Atenção

- **Achado (já visto noutra change desta leva, mesma categoria)**: a task 1.1 continua a agrupar três sub-correções de áudio num único item de verificação — mantenho a mesma recomendação já registrada antes do escopo crescer: documentar explicitamente qual sub-causa reproduziu na prática.
- **Achado novo**: a task 2b.3 pede checar "hover-capable desktop, keyboard-only, touch-only, and hybrid devices" — isso é bastante abrangente para uma verificação manual; recomendo que quem implementar trate isso como uma checklist explícita (não um "testar e ver”) dado o número de combinações de dispositivo/tamanho de tile already enumerados nas tasks 2b.1–2b.3.
- Testes automatizados: a parte de backend (2c.1) tem verificação objetiva via testes de contrato Rust — boa cobertura. A parte de frontend (volume, hover/toque, deafened na UI) depende inteiramente de verificação manual, consistente com o que já se viu nas changes anteriores desta sessão para UI de chamada.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente D1–D7 na ordem certa, sem reabrir nenhuma decisão já tomada.
- Nenhuma limitação técnica nova encontrada na implementação real que não estivesse já antecipada — os achados acima são de precisão de verificação e risco de regressão de UX (onClick de tile), não de viabilidade.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- nenhuma nova — o achado de acessibilidade do hover/foco (dimensão 3 da revisão do Arquiteto) já está registrado; do lado de implementação, o único cuidado adicional é não deixar o "tap-to-reveal" conflitar com qualquer `onClick` de seleção de tile já usado hoje por outras views.
