# Review — Arquiteto de Soluções

**Change:** add-connection-quality-indicator
**Data:** 2026-11-14
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Usa um sinal que o LiveKit client já fornece (`RoomEvent.ConnectionQualityChanged`, `Participant.connectionQuality`) sem nenhuma dependência nova. `callSession.tsx:609-653` (`wire()`) já é o lugar certo e já assina vários outros `RoomEvent`s — esta é uma extensão directa, não um padrão novo.
- Responsabilidades claras: `callSession.tsx` guarda o sinal reactivo, `tiles.tsx` só o apresenta. Escalabilidade correctamente marcada N/A — é um indicador local, por utilizador, sem fan-out.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- Confirmado: nenhuma mudança de backend, API ou protocolo LiveKit. O `Impact` do `proposal.md` está correcto ao não listar nada além de frontend.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: N/A, dado não sensível.
- Performance: um handler de evento adicional, sem custo perceptível.
- Manutenibilidade: D1 restringe conscientemente o escopo a "só o participante local" e rejeita mostrar a qualidade em todas as tiles — boa disciplina que evita ruído numa grelha já densa, com a porta aberta para expandir depois se houver necessidade real (alternativa rejeitada registada, não descartada sem razão).
- Ponto de atenção já antecipado correctamente pelos próprios autores: D1 e a tarefa 2.2 já identificam que o popout corre uma sessão viewer separada e exigem explicitamente que o chip não apareça ligado a essa ligação — e, na prática, isto nem chega a ser um risco real: o participante local já é excluído do `snapshot()` do popout (`callSession.tsx:106-127`, confirmado em changes anteriores desta leva), então não há tile local nenhuma no popout para o chip aparecer indevidamente. A verificação da tarefa 2.2 continua correcta como salvaguarda, só that o risco de base é menor do que o texto sugere.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1/D2 seguem o padrão de alternativa-rejeitada com motivo técnico (mostrar em todas as tiles; mostrar ping/jitter numérico) em vez de preferência estética.
- A nova capacidade `frontend-v2/voice-connection-quality` segue o precedente já estabelecido nesta mesma leva por `per-participant-volume-boost` (`frontend-v2/voice-participant-volume`): uma funcionalidade de chamada local e independente ganha a sua própria capacidade em vez de inchar `frontend-v2/voice-session` indefinidamente — consistente, não é uma decisão isolada.
- Sem diagrama — correcto, fluxo de um único evento para um único signal.

## 5. Ponte entre produto e técnico

Veredito: OK

- Esta é a tradução produto→técnico mais honesta desta leva: em vez de prometer "ping e jitter", a proposta nomeia exactamente o que o LiveKit oferece (um enum ordinal de 5 estados) e recusa explicitamente inventar precisão que a plataforma não tem (`proposal.md`, "do not invent ping, jitter, or latency values from this enum"). Isso evita uma promessa de produto que a arquitetura escolhida não poderia cumprir.

## Bloqueantes antes de implementar

- nenhum
