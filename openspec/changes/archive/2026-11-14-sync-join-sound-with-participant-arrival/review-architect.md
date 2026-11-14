# Review — Arquiteto de Soluções

**Change:** sync-join-sound-with-participant-arrival
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: Atenção

- Escopo é puramente frontend (SolidJS + LiveKit client), coerente com a stack existente; sem necessidade de nova linguagem/framework.
- Responsabilidades entre `callSession.tsx` (sessão/LiveKit) e `sound/triggers.ts` (efeitos) já eram separadas antes desta change, e a Tarefa 1.2 ("Move the remote arrival notification... to the call arrival event") preserva essa fronteira — `callSession.tsx` expõe um evento/sinal, `triggers.ts` continua a decidir quando tocar o som, sem o módulo de sessão passar a depender do módulo de som. Confirmei isso é consistente com o padrão já usado (`call.deafened()`, `call.live()`, `call.channelId()` já consumidos em `triggers.ts:26-33`).
- **Achado:** `wire()` (`callSession.tsx:609-625`) é a mesma função usada tanto para a sessão dona da chamada quanto para a sala view-only do popout (`watch()`, confirmado na change irmã `add-popout-call-controls`). O design.md diz que o novo handler de `ParticipantConnected` deve notificar "only when the owner call is live and not deafened", mas não menciona explicitamente que precisa de uma guarda equivalente ao `!viewer` já usado ali mesmo para áudio (`:627`, `if (track.kind === kit.Track.Kind.Audio && !viewer) attachAudio(track)`). Sem essa guarda nomeada no design, existe risco de a nova lógica ser escrita dentro de `wire()` sem distinguir dono/visualizador — mesmo que hoje `useSoundEffects()` só seja montado em `AppShell.tsx` (não no popout), tornando o risco prático baixo. Recomendo que o design registe essa guarda explicitamente, não apenas como detalhe de implementação.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Nenhuma mudança de API, protocolo WS ou backend — confirmado em `backend/src/api/voice.rs:242-276` (`join`), que continua a emitir occupancy exactamente como antes; esta change só muda qual evento do lado do cliente aciona o som.
- Occupancy continua servindo o roster da sidebar (`frontend/src/shell/state.tsx:185-198`), sem duplicar ou contradizer o uso já aceite dessa capacidade.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: N/A, sem dado sensível novo.
- Performance: troca um listener de WS (occupancy) por um listener de evento LiveKit já recebido (`ParticipantConnected`, já presente em `wire()`); não adiciona fan-out nem nova assinatura de rede.
- Manutenibilidade: a necessidade de "baseline/deduplicate by identity" (Risks, design.md) é um estado adicional pequeno e localizado, proporcional ao problema.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1/D2 seguem o padrão de decisão com alternativa rejeitada e motivo já estabelecido no projeto. D1 nomeia explicitamente o `epoch` existente ("a new remote identity in the current epoch") em vez de tratá-lo como conceito novo — bom contraste positivo com a change de reentrada, que deixou isso implícito.
- Sem diagrama — correto para uma mudança desta escala (um listener realocado).
- A Requirement modificada em `specs/frontend-v2/sound-effects/spec.md` está correctamente marcada como "MODIFIED" (não "ADDED"): confirmei que a spec já aceite (`openspec/specs/frontend-v2/sound-effects/spec.md`) hoje define a entrada como "passa a constar nos ocupantes" (occupancy) — esta change substitui conscientemente essa definição pela chegada visível no LiveKit, com justificação clara no "Why" do `proposal.md`.

## 5. Ponte entre produto e técnico

Veredito: OK

- O relato do usuário (som antes da pessoa aparecer) é traduzido directamente na causa técnica certa (dois eventos de protocolos diferentes, occupancy HTTP vs. LiveKit) e numa correcção proporcional, sem promessa vaga.

## Bloqueantes antes de implementar

- nenhum
