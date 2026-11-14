# Review — Arquiteto de Soluções

**Change:** update-call-and-notification-sounds
**Data:** 2026-11-14
**Veredito geral:** Bloqueado

## 1. Definição da arquitetura técnica

Veredito: OK

- Feature puramente de frontend (áudio + Vite asset pipeline), sem dependência nova em runtime, estendendo `frontend/src/sound/effects.ts`/`triggers.ts` com um terceiro efeito nomeado (`callLeave`) sobre a mesma arquitetura já usada para `mention`/`callJoin`. Coerente com a stack descoberta (`README.md`: SolidJS/Vite).
- Escalabilidade: N/A, efeito local por cliente, sem fan-out.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- Reaproveita o fluxo manual já documentado em `assets/audio/README.md` ("Place the files here manually", cópia automática via Vite para `frontend/public/audio/`) — consistente com o padrão já estabelecido, não introduz pipeline novo.
- A task 1.1 introduz `ffprobe` como ferramenta de verificação de duração. Não encontrei nenhum uso prévio de `ffprobe`/`ffmpeg` em `frontend/scripts/*.mjs`, `package.json`, ou documentação — é uma ferramenta nova, ainda que só para um passo de verificação manual pontual (não entra no build nem em CI, que hoje só tem `desktop-release.yml`). Recomendo declarar isto explicitamente em `design.md` (Context ou Risks) como dependência de ferramenta externa do ambiente de quem prepara os áudios, não do build — para não ficar implícito só na task.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Bloqueante

- **A Decisão 3 do `design.md` contradiz, no mesmo ciclo, uma decisão já implementada e presente na árvore de trabalho.** A change `sync-join-sound-with-participant-arrival` (todas as tasks `[x]`, confirmado directamente no código) removeu deliberadamente a deteção de chegada por diferença de listas de ocupância HTTP em `frontend/src/sound/triggers.ts`, porque "the arrival sound plays before a newly joining participant appears in the call UI... [because] the sound follows HTTP occupancy... while tiles follow LiveKit participants" (`sync-join-sound-with-participant-arrival/proposal.md`). O comentário que ficou no próprio ficheiro é explícito: `triggers.ts:23-24`, *"Remote call-join sounds are emitted from callSession on LiveKit ParticipantConnected ... not from HTTP occupancy."*
- A Decisão 3 desta change propõe exactamente o mecanismo inverso para a saída: *"Detectar saídas remotas por diferença entre listas consecutivas de ocupantes do mesmo canal"* (`design.md`, Decisão 3). O mesmo atraso entre ocupância HTTP e o LiveKit real que motivou a correcção da entrada aplica-se simetricamente à saída — implementar isto como está reintroduziria, para o som de saída, exactamente o desfasamento que a change irmã acabou de eliminar para o som de entrada.
- `frontend/src/voice/callSession.tsx` já tem a peça certa pronta e ao lado: um handler `E.ParticipantDisconnected` (linha 797) hoje só agregado a um `onChange` genérico, mesmo bloco onde `E.ParticipantConnected` (linha 777) já usa o padrão `seenRemotes`/`announceArrivals`/`alive()`/`viewer`/`deafened()`/`status()` para a entrada, já testado e aprovado pela change irmã. O caminho simétrico e consistente é ligar `callLeave` a `ParticipantDisconnected` nesse mesmo sítio, não reconstruir a deteção por ocupância em `triggers.ts`.
- Isto também invalida parcialmente o enunciado de `tasks.md` 3.1 ("Adicionar detecção de saídas remotas baseada em listas consecutivas de ocupantes... ligar o gatilho em `frontend/src/sound/triggers.ts`") e precisa de reescrita antes de implementar — não é um detalhe de código, é a arquitectura da feature central desta change.
- Os cenários do spec delta ("Saídas em rajada", "Reconexão sem saída real", "Chamada alheia", "Chamada alheia") continuam válidos como comportamento esperado — só o mecanismo de deteção por trás deles precisa de mudar, não o contrato observável.
- A detecção da saída própria (parte final da Decisão 3, "no comando voluntário que encerra a sessão") não tem este problema — é independente de ocupância e pode manter-se como está.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- `design.md` não menciona `sync-join-sound-with-participant-arrival` em nenhum momento, apesar de ambas tocarem os mesmos dois ficheiros (`triggers.ts`, `callSession.tsx`) para o par simétrico entrada/saída, na mesma leva de changes não arquivadas. O próprio projecto já tem o padrão de nomear e sequenciar changes sobrepostas explicitamente (`close-button-behavior-preference/design.md`, secção "Risks/Trade-offs": "Overlapping lifecycle edits... Sequence or coordinate both edits"); esta change deveria fazer o mesmo, tratando a change irmã como contexto fundacional (já implementada) em vez de reabrir a pergunta "ocupância vs. evento LiveKit" de forma independente e sem a citar.
- As restantes decisões (1, 2, 4) têm racional claro e específico, consistente com o padrão de `design.md` das outras changes desta leva.
- Sem diagrama — correcto, fluxo simples o suficiente para prosa.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido de produto (três avisos curtos e coerentes, incluindo saída, com pré-escuta) está bem traduzido nos Goals e no spec delta, sem prometer nada que a plataforma não suporte.

## Bloqueantes antes de implementar

- Reescrever a Decisão 3 do `design.md` (e a task 3.1 correspondente) para detectar saída remota via `E.ParticipantDisconnected` em `frontend/src/voice/callSession.tsx`, espelhando o padrão `seenRemotes`/`ParticipantConnected` já implementado e validado por `sync-join-sound-with-participant-arrival`, em vez de diferença de listas de ocupância em `frontend/src/sound/triggers.ts`. Os cenários do spec delta podem manter-se; só o mecanismo muda.
- Referenciar explicitamente `sync-join-sound-with-participant-arrival` no `design.md` como contexto/dependência (já implementada), para que a decisão de arquitectura para saída seja tomada à luz do que já foi decidido e corrigido para a entrada.
