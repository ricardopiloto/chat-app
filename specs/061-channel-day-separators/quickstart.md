# Quickstart: 061-channel-day-separators

## Prerequisites

- Frontend `npm run dev` + backend com canais de texto e mensagens datadas.
- Conta com acesso a um canal de texto.
- Ideal: mensagens em pelo menos dois dias civis locais (ou ajustar o relógio do SO / usar histórico antigo).

## A — Dois dias consecutivos

1. Abrir canal com mensagens em D1 e D2 (D2 depois de D1).
2. **Expect**: um separador inline no início do bloco de D1 e um no início de D2 (rótulos conforme [day-label-format.md](./contracts/day-label-format.md)); nenhum separador entre mensagens do mesmo dia.

## B — Dia intermédio vazio

1. Histórico com mensagens em D1 e D3, zero em D2.
2. **Expect**: separadores só para D1 e D3; **nenhum** rótulo de D2.

## C — Canal vazio / um único dia

1. Canal sem mensagens → **nenhum** inline nem sticky.
2. Canal só com mensagens de um dia → **um** inline no topo do bloco; sticky só após scroll que esconda esse inline.

## D — Hoje / Ontem

1. Mensagens de hoje e de ontem (fuso local).
2. **Expect**: rótulos `Hoje` e `Ontem` (não a data completa nesses dois dias).

## E — Sticky anti-duplicação

1. Canal com ≥2 dias; scroll até o meio de um bloco de dia (inline desse dia fora do topo).
2. **Expect**: sticky no topo com o rótulo desse dia.
3. Scroll de volta até o inline desse dia ficar visível no topo.
4. **Expect**: sticky **oculto** (sem dois rótulos iguais empilhados).
5. Atravessar fronteira para o dia seguinte → sticky actualiza (ou oculta se o inline novo estiver no topo).

## F — Paginação / novas mensagens

1. Carregar histórico mais antigo que introduz um dia novo com mensagens.
2. **Expect**: aparece o inline desse dia; dias sem mensagens continuam sem linha.
3. Enviar mensagem nova no dia actual → timeline actualiza sem reload.

## Validation commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

No backend tests required for this feature.
