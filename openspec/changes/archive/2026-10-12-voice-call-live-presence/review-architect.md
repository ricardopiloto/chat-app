# Review — Arquiteto de Soluções

**Change:** voice-call-live-presence
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Sem componente ou stack nova. Confirmei em `frontend/src/shell/state.tsx:87-102,161-173` que a ocupação já chega por dois caminhos (REST por servidor, no mount/reconexão; WS `voice.occupancy`, em tempo real) e os dois acabam no mesmo `applyOccupancy` — exactamente o contexto que `design.md` descreve, e exactamente onde a corrida entre os dois precisa de ser resolvida. Nenhuma decisão de stack nova é necessária.
- Confirmei em `frontend/src/voice/callSession.tsx:494-513` que `wire()` já assina `ParticipantConnected` e `TrackSubscribed` com `refresh()` — a Decisão 3 ("the stage keeps the existing LiveKit listeners") está correcta: para quem já está ligado à sala LiveKit, o palco já reage sem reentrar. O ganho real desta change está nos ecrãs que ainda não entraram na chamada (pré-entrada, barra lateral) e na corrida REST-vs-WS, não no palco de quem já está dentro.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Não introduz endpoint, porta, serviço nem evento novo — `design.md` confirma "No new backend event. `voice.occupancy` and `grid.updated` stay the events", e o Impact do `proposal.md:28` confirma que o backend já emite o necessário. Puramente uma correcção de ordenação no cliente.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança/E2EE: sem alteração — não toca em quem pode entrar nem em chaves. Performance: a Decisão 1 (um contador de geração por canal) é O(1) por actualização, sem fan-out novo. Manutenibilidade: resolve a causa (ordem de chegada) em vez de mascarar com polling, que seria mais simples de escrever mas pior de manter e mais pesado no servidor — a Non-Goal "Polling occupancy" está bem justificada.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Três decisões, cada uma com alternativa considerada e motivo de rejeição (a Decisão 1 em particular rejeita bem a alternativa mais simples — "ignore REST sempre que um evento de socket já chegou" — com um motivo concreto: uma reconexão ainda precisa do snapshot para canais que o cliente perdeu enquanto estava desligado).
- Risks/Trade-offs cobre o caso realista (câmara publica depois do evento de entrada) sem inventar um requisito de sincronia perfeita.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" (pessoa já no canal não vê quem entra sem refresh) está ligado com precisão a duas causas técnicas distintas e corrigidas separadamente: o binding reactivo que falta nalgum ecrã aberto, e a corrida REST/WS que pode apagar a actualização certa — sem misturar as duas num único remédio genérico.

## Bloqueantes antes de implementar

- nenhum
