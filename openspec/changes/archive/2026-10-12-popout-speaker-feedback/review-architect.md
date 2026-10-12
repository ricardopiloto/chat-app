# Review — Arquiteto de Soluções

**Change:** popout-speaker-feedback
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Correcção puramente de frontend, sem componente novo. Confirmei em `frontend/src/voice/callSession.tsx` que `watch()` já define `viewer = true` para a ligação do popout, e que `wire()` (mesma closure) já tem acesso a essa variável — a Decisão 1 de `design.md` ("quando este renderer é o popout, saltar `attachAudio`") é implementável reaproveitando este sinal já existente, sem precisar de um flag novo nem de detectar o popout por outra via (ex. `location.pathname`, usado noutro sítio do mesmo ficheiro para um propósito diferente).

## 2. Integração com a infraestrutura existente

Veredito: N/A — não toca no servidor LiveKit, no token, nem em nenhuma configuração de infra; é só o cliente a decidir se reproduz ou não uma faixa já recebida.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança/E2EE: sem alteração — a faixa continua a chegar cifrada como já chegava, só deixa de ser reproduzida numa janela que nunca devia tê-la posto a tocar. Performance: nenhum impacto (menos trabalho, não mais). Manutenibilidade: a correcção fica isolada ao ponto exacto da causa (`TrackSubscribed` em `wire()`), sem introduzir um conceito novo.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Duas decisões, cada uma com alternativa considerada e motivo de rejeição (a Decisão 1 explica bem por que filtrar por identidade, em vez de por tipo de faixa, deixaria o eco a acontecer só para os outros participantes).

## 5. Ponte entre produto e técnico

Veredito: OK

- O sintoma (eco da própria voz no popout) está ligado com precisão à causa técnica (a janela de visualização trata o microfone da janela principal como áudio remoto) — sem ambiguidade sobre o que corrigir.

## Bloqueantes antes de implementar

- nenhum
