# Review — Desenvolvedor Fullstack

**Change:** keep-mobile-call-connected-in-background
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- `proposal.md` (Impact) já admite "occupancy timeout behavior may need verification, not necessarily an API change" — correcto em não prometer uma mudança de backend sem medir primeiro.
- **Achado (números concretos que sustentam o achado do Arquiteto):** confirmei `HEARTBEAT_MS = 20_000` (`callSession.tsx:45`) contra `OCCUPANT_STALE_SECS = 45` (`backend/src/domain/voice_occupancy.rs:6`) — o cliente só tem margem para perder pouco mais de dois batimentos antes do servidor expirar o lugar. `heartbeat` é um `window.setInterval` comum (`:594`), exactamente o tipo de temporizador que navegadores móveis atrasam ou suspendem em segundo plano. Isto significa que, na prática, qualquer troca de app com duração realista (mais de ~45s, que é o cenário relatado pelo usuário) tem boa chance de já ter expirado a occupancy no servidor antes da pessoa voltar — mesmo que o D2 (reconexão no retorno) funcione perfeitamente do lado do LiveKit. A tarefa 2.2 só verifica "no duplicate occupant on later explicit entry", não testa este caso (sessão tecnicamente viva, occupancy já expirada, pessoa ainda não voltou a interagir).
- Recomendação para `tasks.md`: dar à tarefa 2.2 um resultado de decisão explícito — se a medição confirmar que 45s é insuficiente para o cenário real, a tarefa deveria obrigar a uma mudança de backend (aumentar `OCCUPANT_STALE_SECS` especificamente para este caso, ou introduzir um estado "backgrounded" distinto de "idle"/"stale" de verdade), em vez de terminar em "verify" sem um caminho de acção definido.

## 2. Desenvolvimento do frontend

Veredito: OK

- Boa notícia de viabilidade: os sinais que D2 pede para mostrar ("reconnecting/failure state") já existem — `setStatus("reconnecting")` já é usado pelo handler `Reconnecting` do LiveKit em `wire()`, e `setProblem`/`setNotice` já existem para estados de erro. Não é necessário UI nova, só reutilizar o que já está lá.
- Nenhum handler de `visibilitychange` concorrente nesta área: busquei em todo `frontend/src` e só há usos não relacionados (`Composer.tsx:87-93` para indicador de "digitando", `triggers.ts:19` para supressão de som) — sem risco de conflito com a nova política de D1.
- Confirmei que D2 (mostrar o fluxo de consentimento existente quando o documento foi descartado/recarregado) é consistente com a Requirement já aceite "Recarregar a página enquanto a rota já aponta para um canal de voz" (`openspec/specs/frontend-v2/voice-session/spec.md`) — reaproveita o modal já especificado, não inventa um segundo fluxo de confirmação.

## 3. Deploy e operação

Veredito: OK

- Nenhuma configuração nova. O sweeper já roda em produção (`spawn_stale_occupancy_sweeper`, intervalo de 20s) — observável pelos logs `tracing::warn!` já existentes se a varredura falhar.

## 4. Qualidade de código

Veredito: Atenção

- Testes manuais em dispositivo real (tarefas 3.1/3.2) são a escolha certa aqui — comportamento de suspensão de timer/mídia em segundo plano é dependente de SO/browser e não é razoável simular num script determinístico, ao contrário de changes anteriores revisadas nesta sessão.
- **Achado:** a tarefa 3.1 pede testar "app switching and return" de forma genérica, sem fixar a duração do teste como variável central. Dado o achado da dimensão 1 (janela de ~45s), a tarefa deveria testar explicitamente pelo menos três durações: curta (bem abaixo de 45s, deve manter occupancy), próxima do limite (perto de 45s), e longa (bem acima, onde a expiração do servidor é esperada e o comportamento de recuperação visível precisa de ser correcto mesmo assim). Sem isso, um teste manual "rápido" pode passar sem nunca exercitar o caso que esta change existe para resolver.
- Organização: cabe em `callSession.tsx`; nenhum refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1-D3 na ordem certa (política de retenção → recuperação → verificação de abandono real).

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Confirmo com números concretos o achado do Arquiteto sobre o desvio occupancy↔LiveKit: `HEARTBEAT_MS=20_000` vs. `OCCUPANT_STALE_SECS=45` deixa pouquíssima margem a throttling de temporizador em segundo plano, que é comum em browsers móveis. Isto não é um risco hipotético — com estes números, é o caminho mais provável de falha para o cenário principal que a change pretende corrigir. Vale decidir antes da implementação se a tarefa 2.2 inclui ou não ajustar `OCCUPANT_STALE_SECS`/criar um estado de graça distinto, em vez de deixar essa decisão para quando a verificação já estiver em curso.
