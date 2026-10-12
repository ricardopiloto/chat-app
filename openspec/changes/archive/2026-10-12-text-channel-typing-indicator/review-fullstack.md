# Review — Desenvolvedor Fullstack

**Change:** text-channel-typing-indicator
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: OK

- Implementável com o que já existe: `require_write_text` e o check de silenciamento (padrão já usado em `backend/src/api/messages.rs` por volta das linhas 119-130 para `POST /channels/{id}/messages`) cobrem exatamente a autorização descrita em `design.md` Decisão 1 e `tasks.md` 1.1. `send_to_channel_viewers` (`backend/src/api/messages.rs:57-76`) já faz o filtro "só leitores" pedido. Nenhuma lacuna de arquitetura para codar isto.
- `RateLimiter::check(key, limit, window)` (`backend/src/rate_limit.rs`) é genérico e aceita qualquer chave — serve direto para "limite de frequência por conta/canal" (tasks.md 1.2) sem precisar de infraestrutura nova.
- Sem migração de banco, coerente (nenhuma tabela nova necessária para estado efémero).
- Ponto a especificar antes de codar: tasks.md 1.1 pede quadros "com tamanho... limitados", mas o handler atual (`backend/src/api/mod.rs:242-267`, `WebSocketUpgrade`) não configura hoje um limite de tamanho de mensagem no nível do axum/tungstenite — o `DefaultBodyLimit` visto no arquivo é para corpos HTTP, não para frames WS. Isso é perfeitamente implementável (validar o `len()` do texto recebido antes/durante o `serde_json::from_str`, ou chamar `.max_message_size(...)` na configuração do upgrade), mas `tasks.md` deveria dizer explicitamente qual das duas abordagens usar, para não ficar a critério de quem implementar.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Viável com SolidJS: expor um `send` tipado em `RealtimeConnection` (hoje só tem `close()`, em `frontend/src/api/realtime.ts`) e consumi-lo via `ShellState` é uma extensão pequena e natural do padrão existente (o próprio comentário do arquivo hoje documenta "the client never publishes" — vai deixar de ser verdade, mas tecnicamente é uma mudança pequena: adicionar `send(data: string)` ao objeto retornado por `connectRealtime`).
- **Lacuna de testabilidade.** `frontend/package.json` não tem nenhum runner de teste com DOM/componentes ou timers controláveis (`vitest`, `@testing-library`, `jsdom` — nenhum nas `devDependencies`). O padrão real de teste do frontend é `node --experimental-strip-types scripts/*.test.mjs` com `node:assert`, testando módulos de lógica pura (ex.: `frontend/scripts/invite-handoff.test.mjs` testa `src/crypto/handoffGate.ts`/`inviteSeed.ts`, sem renderizar nada e sem fake timers). O projeto já resolve isso para outras features extraindo a lógica para módulos puros em `frontend/src/chat/logic/` (`autocomplete.ts`, `mentions.ts`, `people.ts`, etc.) que são testáveis isoladamente.
  `tasks.md` 2.2 ("verificar com relógio controlado que a inactividade pára o anúncio") e 2.3 ("verificar em teste que eventos de outro canal, sem nome ou expirados não aparecem") descrevem testes automatizados, mas não dizem onde essa lógica de heartbeat/expiração/resolução de nomes deve morar para ser testável com as ferramentas que o repositório realmente tem. Se ficar embutida direto em `Composer`/`ChannelPage` (componentes Solid), não há como escrever esse teste sem um runner de DOM que não existe — na prática isso tende a virar verificação manual, mesmo rotulado "teste" em `tasks.md`.
  Recomendação: `tasks.md` 2.2/2.3 deveriam explicitar a extração da lógica (heartbeat de envio, expiração de entradas recebidas, filtragem por canal/nome) para um módulo puro (ex. `chat/logic/typing.ts`, recebendo um relógio injetável), no mesmo padrão dos módulos já citados — isso é o que torna "verificar com relógio controlado" exequível com `node --experimental-strip-types`.
- A parte visual (3.1: "um, dois e três ou mais membros em larguras normais e estreitas") não tem ferramenta de teste visual/responsivo no projeto (sem Playwright/Cypress) — mas isso já está corretamente rebaixado a verificação manual em 3.2 ("verificar manualmente com duas sessões"), então não é uma lacuna, é consistente com o que o projeto realmente consegue automatizar hoje.

## 3. Deploy e operação

Veredito: OK

- Nenhuma porta, variável de ambiente, ou serviço novo — tudo passa pelo mesmo `/ws` já coberto por `docs/deploy-producao.md`/`docs/operar-instancia.md`. Nada a adicionar nesses documentos.
- Observabilidade: nenhuma task menciona log para quadros inválidos/rejeitados. O padrão existente usa `tracing::error!`/`tracing::warn!` em pontos equivalentes (ex. `ws::replay_pending_handoffs` e `broadcast_presence_for_account` em `backend/src/ws/mod.rs` e `backend/src/api/mod.rs` logam falhas silenciosamente via `else`/`continue` sem tracing, então nem é um padrão forte hoje). Não é bloqueante, mas vale considerar `tracing::debug!`/`warn!` nos casos de quadro inválido/limite excedido (tasks.md 1.1), já que quem vai depurar isto em produção é a mesma pessoa que implementa.

## 4. Qualidade de código

Veredito: Atenção

- Backend: tasks.md 1.1/1.2 pedem "teste de contrato", que é exatamente o padrão já usado em `backend/tests/contract/` (ex. `channel_mute.rs`, `channel_overwrites.rs`, `messages.rs`) — bem especificado e implementável sem ambiguidade.
- Frontend: ver a lacuna de testabilidade da dimensão 2 — é o mesmo achado, repetido aqui porque afeta diretamente "qualidade de código" (cobertura real vs. cobertura nominal em `tasks.md`).
- Resiliência: desconexão/reconexão está coberta de forma consistente com o resto do app — design.md diz "nenhum quadro é enfileirado para reenvio" e "desconexão... limpa a lista local", o que evita estado zumbi sem exigir lógica de retry nova. Compatível com o comportamento de reconexão já existente em `connectRealtime` (backoff + `onResync`).

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente as decisões de `design.md` (mesmas funções de autorização, mesmo formato de evento `{channel_id, account_id, active}`, mesmo ponto de inserção visual em `.ch-foot`) — não reabre nem contradiz nada já decidido.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Confirmo, da perspectiva de quem vai implementar e operar isto, o achado já registrado em `review-architect.md` (dimensão 3): `send_to_channel_viewers` roda `channel_access` (5 consultas sequenciais ao SQLite) para cada membro do servidor a cada chamada. Como `typing.updated` é disparado por heartbeat (repetido a cada poucos segundos por cada pessoa digitando, não uma vez por mensagem), uma sessão de RPG com várias pessoas digitando ao mesmo tempo pode gerar rajadas perceptíveis de consultas concorrentes no mesmo pool SQLite, bem mais frequentes que o padrão de `message.new`. Não é bloqueante para o porte esperado (grupos pequenos de RPG), mas é uma decisão que vale registrar conscientemente em `design.md` (aceitar o custo, ou cachear a lista de leitores do canal por um TTL curto) antes de descobrir o efeito em produção.
