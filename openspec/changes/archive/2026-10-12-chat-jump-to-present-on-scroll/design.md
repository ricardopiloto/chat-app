# Design

## Context

Ver `proposal.md` — Why. Pontos de código:

- `frontend/src/chat/ChannelPage.tsx:77-78`: `pinned` (estou no fundo da lista) e `away` (contagem de mensagens novas chegadas enquanto não estava no fundo).
- `frontend/src/chat/ChannelPage.tsx:106`: `nearBottom()` — decide `pinned` a partir da posição real do scroll, não de mensagens.
- `frontend/src/chat/ChannelPage.tsx:119-124` (`onScroll`): actualiza `pinned` a cada evento de scroll do próprio utilizador; já funciona correctamente hoje, não precisa de mudança.
- `frontend/src/chat/ChannelPage.tsx:315-317`: `<Show when={!pinned() && away() > 0}><button class="ch-jump" onClick={jump}>{t("txt.jump")}<Badge tone="primary" mono>{away()}</Badge><Icon name="arrow_downward"/></button></Show>` — é só esta condição que muda.
- `frontend/src/i18n/catalogs/chat.*.ts:64` (`jump: "Saltar para o presente"`/`"Jump to present"`): o texto já é genérico, não pressupõe uma contagem — não precisa de novo texto.

## Goals / Non-Goals

**Goals:**
- A pill aparece sempre que `!pinned()`, com ou sem mensagens novas.
- Quando há mensagens novas (`away() > 0`), a contagem continua visível no mesmo badge de hoje.

**Non-Goals:**
- Mudar como `pinned`/`away`/`nearBottom` são calculados — já estão correctos para o seu próprio propósito.
- Qualquer nova UI além de mostrar/ocultar a contagem dentro da pill já existente.

## Decisions

### 1. Só a condição do `<Show>` externo muda; o badge ganha a sua própria condição interna

Em vez de `<Show when={!pinned() && away() > 0}>`, passa a `<Show when={!pinned()}>`, e dentro do botão o badge passa a `<Show when={away() > 0}><Badge tone="primary" mono>{away()}</Badge></Show>`. Isto preserva exactamente o comportamento actual quando há mensagens novas (pill com contagem) e adiciona o caso que faltava (pill sem contagem, só por estar desviado do fundo).

Alternativa descartada: introduzir um terceiro sinal (ex. `scrolledAway`) distinto de `pinned`, calculado de forma diferente. Rejeitada — `pinned()`/`nearBottom()` já representam exactamente "estou perto do fundo ou não"; não há necessidade de um conceito novo.

## Risks / Trade-offs

- [Com a pill agora a aparecer ao simplesmente rolar um pouco para cima, mesmo sem mensagens novas, pode parecer mais "ruidosa" para quem rola ocasionalmente perto do fundo] → Mitigação: aceite — é exactamente o comportamento pedido pelo requisito original (`parity-checklist.md` TXT-14) e pelo utilizador; `NEAR_BOTTOM_PX` (limiar de "perto do fundo" em `ChannelPage.tsx`) já existe para evitar que pequenas variações de scroll perto do fundo contem como "desviado" — inalterado por esta change.

## Migration Plan

Mudança de uma linha de condição + um `Show` novo em torno do badge. Sem dependência de outra change em curso.
