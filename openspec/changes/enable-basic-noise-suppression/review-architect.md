# Review — Arquiteto de Soluções

**Change:** enable-basic-noise-suppression
**Data:** 2026-11-07 (revisão do código implementado)
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica
Veredito: OK

- Implementação exactamente conforme o `design.md` corrigido: `callSession.tsx` agora define `audioCaptureDefaults: { noiseSuppression: true, ...(micDevice.id ? { deviceId: micDevice.id } : {}) }` — torna explícito o que o LiveKit já aplicava por omissão. `preview.ts` agora pede `{ audio: { noiseSuppression: true, ...(chosen ? { deviceId: { exact: chosen } } : {}) } }` — este é o único efeito observável novo, confirmado.
- Nenhuma mudança na função `watch()` (popout) — correcto, confirmado nesta sessão que nunca publica microfone local.

## 2. Integração com a infraestrutura existente
Veredito: N/A

Sem infraestrutura nova.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- Escopo mantido estreito: eco/AGC/codec continuam fora, nada tocado além das duas linhas descritas. Sem risco de regressão — `noiseSuppression` é um `ConstrainBoolean` ideal, ignorado silenciosamente por navegadores sem suporte.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `tasks.md` 1.1-1.3 marcadas como concluídas, correspondendo ao código real. Item 21 do backlog confirmado existente, não duplicado.

## 5. Ponte entre produto e técnico
Veredito: OK

- Pedido do utilizador ("o simples agora, algoritmo avançado no backlog") satisfeito com precisão, sem prometer mais do que a mudança entrega.

## Bloqueantes antes de implementar
- Nenhum. A tarefa 2.1 (inspecção manual numa chamada real) continua a depender de um browser/chamada reais, mas é baixo risco dado que a constraint já está confirmada no código fonte do LiveKit e no `getUserMedia` do preview.
