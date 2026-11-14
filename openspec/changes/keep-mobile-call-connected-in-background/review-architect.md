# Review — Arquiteto de Soluções

**Change:** keep-mobile-call-connected-in-background
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: Atenção

- Componentes envolvidos (sessão de chamada no renderer, heartbeat, sweeper no backend) estão corretos e já existem — nenhuma peça nova de infraestrutura.
- **Achado:** o design fala em "mobile web" como a condição que liga toda a política de D1-D3 ("On mobile web, use `visibilitychange`..."), mas não existe hoje, em nenhum lugar do código, um mecanismo de detecção de "mobile web" — confirmei por busca que não há `isMobile`/sniff de user-agent/`matchMedia(pointer: coarse)` em `frontend/src`. A única distinção de plataforma já existente é desktop-Electron vs. não-Electron (`window.mesaNative`), não mobile vs. desktop-browser. O mecanismo técnico proposto (`visibilitychange`/`pagehide`) também não é inerentemente móvel — um navegador de desktop minimizado ou com troca de área de trabalho dispara exatamente os mesmos eventos e sofreria do mesmo "hangup indesejado" hoje. O design não justifica por que a correção fica restrita a "mobile web" em vez de "qualquer build de navegador (não-Electron)", nem diz como o código vai decidir "isto é mobile" na prática. Recomendo decidir explicitamente: (a) a política é por plataforma (precisa de um critério de detecção definido) ou (b) a política é para qualquer sessão web, independente de mobile/desktop (mais simples, mais consistente com o facto de o mecanismo ser genérico) — e registar a escolha com motivo.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Reaproveita o heartbeat (`callSession.tsx:594`) e o sweeper de occupancy já existentes (`backend/src/api/voice.rs:167-178`, `OCCUPANT_STALE_SECS=45s` em `backend/src/domain/voice_occupancy.rs:6`) em vez de propor um mecanismo novo — correto, e consciente dos Non-Goals (sem mudança de API).
- Nenhum impacto de deploy/porta/processo.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: N/A.
- **Achado (o mais importante desta revisão):** o heartbeat é um `window.setInterval` comum (`callSession.tsx:594`, confirmado no código: `heartbeat = window.setInterval(() => report(), HEARTBEAT_MS)`), e `apply_leave` no backend (`voice.rs:153-165`) não só apaga a occupancy como desaloca o slot da grelha (`db::grid::unassign_account`) e transmite isso para todos os outros participantes (`broadcast_occupancy`/`broadcast_grid`) — sem derrubar a participação LiveKit em si. `setInterval` em separadores móveis em segundo plano é precisamente o tipo de temporizador que navegadores móveis atrasam ou suspendem (Chrome Android e iOS Safari já documentam isso). Isto significa que, no cenário exacto que esta change quer resolver — alguém troca de app por mais de 45 segundos, mantendo a intenção de continuar na chamada — o heartbeat pode parar de bater antes da pessoa voltar, o sweeper do servidor expira a occupancy, e **os outros participantes veem o lugar/slot dessa pessoa ser libertado e redistribuído enquanto a ligação LiveKit dela (código do cliente) pode ainda estar tecnicamente viva** quando a página volta a ficar visível — um desvio visível entre o roster/grelha (dirigido por occupancy) e os tiles (dirigidos por `call.participants()` do LiveKit), na mesma família do bug já corrigido noutra change desta mesma sessão (`sync-join-sound-with-participant-arrival`, que tratou exactamente uma dessincronização occupancy↔LiveKit, só que na direcção de entrada).
  - O `design.md` (D3, Risks) já reconhece "A killed hidden tab leaves temporary occupancy" e manda verificar "no duplicate seat on later explicit entry" (tasks 2.2), mas isso cobre só o caso de reentrada explícita — não cobre o caso, mais provável para esta change, de a pessoa continuar tecnicamente ligada (sessão "soft-background" preservada) enquanto o servidor já a considerou saída.
  - Recomendação: decidir explicitamente uma destas (e documentar a escolha com alternativa rejeitada, no padrão já usado): manter o heartbeat vivo mesmo em segundo plano por outro meio mais resistente a throttling (ex.: `navigator.sendBeacon` num evento de `visibilitychange`→hidden, não dependente de temporizador contínuo), aumentar a janela de tolerância especificamente para o estado "hidden mas não encerrado", ou aceitar e documentar o desvio de roster como limitação conhecida e testá-lo deliberadamente (não só o caso de reentrada duplicada).
- Manutenibilidade: fora o ponto acima, a decisão de não construir um temporizador de hangup fixo (D3, alternativa rejeitada) é sólida e evita um mecanismo paralelo frágil.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1-D3 estão entre as decisões mais bem fundamentadas revisadas nesta sessão: cada uma nomeia uma alternativa concreta e tecnicamente informada (apagar o handler, Wake Lock/áudio silencioso, timeout fixo) e explica por que foi rejeitada com uma limitação real de plataforma, não apenas preferência. Os Non-Goals ("não garantir áudio ininterrupto sob qualquer política de SO móvel") evitam prometer o que a arquitetura não pode garantir.
- Sem diagrama — aceitável; é uma máquina de estados de poucos nós, descrita em prosa suficiente.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" é traduzido com honestidade técnica rara: a proposta não promete "a chamada nunca cai no mobile", promete "não desliga deliberadamente só por ficar em segundo plano, e recupera quando possível" — alinhado com o que WebRTC/browsers móveis realmente permitem.

## Bloqueantes antes de implementar

- nenhum
