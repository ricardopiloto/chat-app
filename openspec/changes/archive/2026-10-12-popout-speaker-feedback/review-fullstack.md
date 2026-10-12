# Review — Desenvolvedor Fullstack

**Change:** popout-speaker-feedback
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend

Veredito: N/A — sem endpoint, token ou evento novo; `design.md` confirma "Client-only. No token or server change."

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei em `frontend/src/voice/callSession.tsx:84` o flag `viewer` (já comentado como "This renderer is the view-only popout, not the call that owns the seat."), definido `true` dentro de `watch()` (`:304`) e lido na mesma closure por `wire()`. O `TrackSubscribed` handler (`:511-513`) já é exactamente `if (track.kind === kit.Track.Kind.Audio) attachAudio(track);` — a Tarefa 1.1 é um guard de uma condição (`&& !viewer`), sem estado novo nem nova forma de detectar o popout.
- Confirmei que `CallPopoutWindow.tsx` existe e é quem chama `call.watch(props.watch)` (`:632`), fechando o caminho ponta-a-ponta entre a janela de popout real e o `viewer` que a Tarefa 1.1 vai usar.
- A grade (câmara/partilha de ecrã) não é tocada por este guard, porque ele filtra só `kit.Track.Kind.Audio` — consistente com "A grade do popout continua a mostrar câmara e partilha de ecrã" em `tasks.md:5`.

## 3. Deploy e operação

Veredito: N/A — sem porta, serviço, variável de ambiente ou script de build novo.

## 4. Qualidade de código

Veredito: OK

- Tarefa única, mas com critério de verificação concreto e cobrindo os três ângulos que importam (eco desaparece, áudio dos outros continua a tocar uma única vez na janela principal, fechar o popout não corta esse áudio). Dado que é comportamento de reprodução de áudio em WebRTC, verificação manual com dois clientes é o caminho realista — não há lacuna de teste automatizado que fizesse sentido pedir aqui.
- Mudança cabe inteiramente dentro de `callSession.tsx`, sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Sem tensão com decisão existente. Nenhuma limitação técnica nova a reportar ao Arquiteto — o mecanismo de detecção (`viewer`) já existia antes desta change, só não era usado para este fim.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
