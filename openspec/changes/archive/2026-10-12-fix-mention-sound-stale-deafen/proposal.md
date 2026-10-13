# Proposal

## Why

Bug encontrado em teste real (2026-10-12): o som de menção não tocou ao mencionarem o utilizador num canal de texto, fora da chamada de voz.

Causa raiz, confirmada por leitura do código: `setDeafened(false)` só é chamado em `joinOnce()` (`frontend/src/voice/callSession.tsx:456`, ao entrar numa chamada) — nunca em `leave()`/`teardown()`. Quem se ensurdece durante uma chamada e depois sai fica com `call.deafened() === true` indefinidamente, até à próxima vez que entrar noutra chamada. Enquanto isso, `sound/triggers.ts:17` suprime o som de menção com `if (... || call.deafened()) return;`, sem verificar se o utilizador está de facto numa chamada. O próprio spec já diz "não tocar nenhum efeito enquanto o utilizador estiver ensurdecido **na chamada**" (`openspec/specs/frontend-v2/sound-effects/spec.md`, Requirement "Supressão e limite de frequência") — a implementação actual contradiz isso ao manter a supressão fora de qualquer chamada.

## What Changes

- `leave()`/`teardown()` em `callSession.tsx` passam a repor `deafened` para `false` ao sair da chamada, tal como `joinOnce()` já faz ao entrar — o estado deixa de sobreviver para lá da chamada onde foi activado.

## Capabilities

(sem deltas de capability — `skip_specs: true`. O requisito já aceite em `openspec/specs/frontend-v2/sound-effects/spec.md` ("não tocar nenhum efeito enquanto o utilizador estiver ensurdecido na chamada") já descreve o comportamento correcto; esta change só corrige a implementação para o cumprir, sem alterar nenhum requisito.)

## Impact

- `frontend/src/voice/callSession.tsx` (`leave()`/`teardown()`).
- Sem impacto: backend, outros efeitos sonoros, o comportamento de supressão enquanto genuinamente ensurdecido numa chamada activa (inalterado).
