# Design

## Context

Ver `proposal.md`. `teardown()` (`frontend/src/voice/callSession.tsx:169-190`) já repõe todo o estado de UI por chamada ao sair — `setMicState(false)`, `setCamState(false)`, `setScreenState(false)`, `setStartedAt(null)`, `setE2eeOn(false)`, `setAudioBlocked(false)`, `setBlurError(false)` — mas não `deafened`. `deafened` só é reposto em `joinOnce()` (ao entrar numa chamada nova), nunca ao sair. `teardown()` é chamado por todos os caminhos de saída (`leave()`, erros de ligação, `onPageHide`, `onCleanup` final), por isso é o sítio certo para a correcção cobrir todos eles de uma vez, em vez de só `leave()`.

## Goals / Non-Goals

**Goals:**
- `call.deafened()` nunca fica `true` fora de uma chamada activa.
- O comportamento dentro de uma chamada activa (ensurdecer suprime todos os efeitos) fica inalterado.

**Non-Goals:**
- Rever se ensurdecer deveria mesmo suprimir o som de menção (é o que o spec já pede, "na chamada" — fora de questão aqui); só a fuga de estado para fora da chamada está em causa.

## Decisions

### 1. Repor em `teardown()`, não só em `leave()`
Alternativa considerada: repor só em `leave()`. Rejeitada porque `teardown()` também corre nos caminhos de erro de ligação (`:367`, `:530`) e no `onPageHide`/`onCleanup` finais — reposto só em `leave()` deixaria `deafened` preso a `true` se a chamada cair por erro ou se a janela fechar enquanto ensurdecido.

## Risks / Trade-offs

- Nenhum identificado — mudança aditiva de uma linha, no mesmo padrão das outras reposições já existentes em `teardown()`.

## Migration Plan

Nenhuma — estado só em memória (signal do SolidJS), sem persistência nem migração.
