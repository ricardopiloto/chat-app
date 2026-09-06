# Quickstart: 036-mic-ctrl-speaking-aura

Validação da aura de «a falar» no botão de microfone dos call-controls. Requer [033](../033-voice-speaking-indicator/) na instância.

## Prerequisites

- Backend + frontend + LiveKit; entrar num canal de voz com mic ligado.
- Lista aninhada 033 a funcionar (opcional para comparar lado a lado).

## Automated

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Manual — User Story 1

1. Na chamada, mic ligado, olhar call-controls.
2. Falar → aura no **botão inteiro** de mic em ≤1 s.
3. Parar → aura some em ≤2 s.
4. Mic ligado em silêncio → sem aura.

## Manual — User Story 2

1. Mic desligado → falar/ruído → **sem** aura.
2. Com aura activa → mute → aura para depressa.

## Manual — User Story 3

1. Com lista visível (própria linha) + call-controls: auras reconhecivelmente a mesma família.
2. Tema claro e escuro: aura legível.
3. Inspeccionar `aria-label`/`title`: só «Microfone ligado» / «Microfone desligado».

## Fora

Aura na câmera; barra sem botão de mic.
