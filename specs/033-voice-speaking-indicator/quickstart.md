# Quickstart: 033-voice-speaking-indicator

Validar ícones mic/falante e aura de «a falar» na lista aninhada.

## Prerequisites

- Backend + frontend; LiveKit; duas contas no mesmo servidor e canal de voz.
- [028](../028-voice-call-roster/) roster + [030](../030-voice-roster-avatars/) avatares.

## Automated

```bash
cd frontend && npx tsc --noEmit
```

## Manual — Ícones (US2)

1. A e B entram na chamada com mic ou cam on (aparecem na lista).
2. **Esperado**: cada linha tem ícone de microfone e ícone de saída (auscultadores/falante), além de avatar/handle.

## Manual — Aura entre participantes (US1)

1. A e B na **mesma** chamada; A com mic ligado fala.
2. **Esperado**: B vê aura nos ícones de mic e saída de A em ≤1 s; mesmo estilo nos dois ícones.
3. A pára → aura cessa em ≤2 s.
4. A muta o mic e «fala» → **sem** aura.

## Manual — Eu próprio (US3)

1. Como A, olha a própria linha na lista enquanto falas com mic on.
2. **Esperado**: aura na tua linha; mute → sem aura.

## Manual — Fora da chamada (FR-010)

1. C (ou A após Sair) em canal de texto vê a lista aninhada com B a transmitir.
2. **Esperado**: ícones visíveis se B está na lista; **sem** aura de fala.

## Manual — Temas

1. Alternar tema claro/escuro.
2. **Esperado**: ícones e aura legíveis (SC-005).
