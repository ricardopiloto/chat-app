# Proposal

## Why

Pedido do utilizador (2026-10-12, revisto no mesmo dia): o som de entrada em chamada deve tocar para todos que entram numa chamada de voz/vídeo — tanto quem chega quanto quem já estava lá. Primeira versão deste pedido tinha ficado restrita a "só a primeira pessoa, quando inicia uma chamada vazia"; o utilizador corrigiu para o caso geral.

O comportamento actual é deliberado, não um bug: `openspec/specs/frontend-v2/sound-effects/spec.md`, Requirement "Som de chegada a uma chamada em andamento", Scenario "A minha própria entrada", diz explicitamente "nenhum som de chegada toca... por causa da sua própria entrada". A decisão original (`D1`/`D2` em `openspec/changes/archive/2026-10-02-frontend-v2-sound-effects/design.md`) tratou isto como "quem está na chamada ouve quem chega" — a própria entrada nunca contava como chegada, porque `arrivals()` exclui sempre `me` da lista. Esta change substitui essa parte do requisito: quem entra passa a ouvir o som da sua própria entrada, sempre — a chamada estando vazia ou já ocupada.

## What Changes

- Ao entrar com sucesso num canal de voz/vídeo, o utilizador que acabou de entrar ouve o efeito de chegada, quer a chamada estivesse vazia quer já tivesse gente.
- Quem já estava na chamada continua a ouvir o efeito quando outra pessoa entra (comportamento já existente, inalterado).
- Um reajuste técnico da própria chamada que não é uma entrada do ponto de vista do utilizador — a reconexão automática quando o E2EE do canal muda a meio da chamada (`onE2eeChanged`, que chama `join()` de novo internamente) — não toca o som; não é uma entrada nova, é a mesma pessoa a continuar na mesma chamada.

## Capabilities

### Modified Capabilities

- `frontend-v2/sound-effects`: o som de chegada passa a tocar sempre para quem entra numa chamada (chamada vazia ou já ocupada), além de continuar a tocar para quem já lá estava.

## Impact

- `frontend/src/voice/callSession.tsx` (`joinOnce`, `join`, `onE2eeChanged`).
- Sem impacto: backend, o outro efeito sonoro (menção).
