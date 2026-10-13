# Review — Arquiteto de Soluções

**Change:** fix-mention-sound-stale-deafen
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: N/A — correcção de um estado em memória (sinal SolidJS) no cliente já existente, sem componente novo.

## 2. Integração com a infraestrutura existente

Veredito: N/A — sem backend, sem rede, sem persistência.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- A causa é uma fuga de estado clássica: um sinal (`deafened`) reposto só num dos dois pontos do seu ciclo de vida (entrada) e não no outro (saída). Confirmei em `callSession.tsx:169-190` que `teardown()` já é o sítio onde todo o resto do estado por chamada é reposto (`setMicState`, `setCamState`, `setScreenState`, `setStartedAt`, `setE2eeOn`, `setAudioBlocked`, `setBlurError`) — `deafened` ficou de fora por omissão, não por desenho. Acrescentá-lo ali é consistente com o padrão já estabelecido no próprio ficheiro, não uma excepção nova.
- Sem impacto em segurança/E2EE/performance.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Uma decisão (repor em `teardown()` em vez de só em `leave()`), com alternativa considerada e motivo concreto (os outros caminhos de saída — erro de ligação, `onPageHide`, `onCleanup` — só passam por `teardown()`, não por `leave()`).

## 5. Ponte entre produto e técnico

Veredito: OK

- O sintoma relatado ("som de menção não tocou") está ligado com precisão à causa técnica (sinal `deafened` preso a `true` fora de qualquer chamada), e a correcção não extrapola para nada além do necessário — nota explicitamente como Non-Goal não reabrir se ensurdecer deveria suprimir menções (isso já está decidido no spec, "na chamada").

## Bloqueantes antes de implementar

- nenhum
