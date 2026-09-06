# Research: 036-mic-ctrl-speaking-aura

## R1 — Fonte de «eu estou a falar»

**Decision**: Reutilizar `VoiceSession.speakingAccountIds` (LiveKit `ActiveSpeakersChanged`, identity = `account_id`) de 033. Aura no botão se `speakingAccountIds().has(props.me.id)` **e** `micOn()` (ou `voice.micOn()`).

**Rationale**: Spec assumptions; evita segundo listener; mesma histerese (~120 ms).

**Alternatives considered**: Analisar track local com AudioContext (duplicado); evento WS speaking (rejeitado em 033).

## R2 — Onde aplicar a classe

**Decision**: No botão de microfone em `VoiceChannel.tsx` (`.call-controls` → `.call-ctrl.call-ctrl-icon` do mic): `classList={{ "is-speaking": … }}` ou classe dedicada `.call-ctrl-mic.is-speaking`. **Não** alterar `aria-label` / `title`.

**Rationale**: Clarificação — aura no botão inteiro; rótulos fixos. Call-controls só existem neste painel hoje (barra «ainda na chamada» no shell não tem botão de mic).

**Alternatives considered**: Aura só no SVG interior (rejeitado); wrapper extra só para o anel (desnecessário se `::before` no botão).

## R3 — CSS partilhado vs cópia

**Decision**: Reutilizar `@keyframes voice-roster-speak-aura` (ou renomear para nome neutro `mesa-speak-aura` se o rename for barato e actualizar roster). Novo selector no botão, ex. `.call-controls .call-ctrl-icon.is-speaking` com `position: relative` + `::before` com `inset` negativo adequado ao tamanho 44–48px, `border-radius` alinhado ao botão (não `999px` forçado se o btn for pill parcial — usar o mesmo radius do `.btn`).

**Rationale**: FR-004 mesma linguagem; escala maior que o ícone 20px do roster.

**Alternatives considered**: Estilo de erro/alerta (rejeitado); segunda animação distinta (rejeitado).

## R4 — Mute

**Decision**: Se `!micOn()`, nunca aplicar `is-speaking`, mesmo que ActiveSpeakers ainda liste o local por um instante.

**Rationale**: FR-003 / alinhado a 033 R4.

**Alternatives considered**: Confiar só em ActiveSpeakers.

## R5 — Scope de barras

**Decision**: Só o botão mic em `.call-controls` do voice pane (incl. modo palco quando a barra está visível). Sem mic na connected bar → sem trabalho extra.

**Rationale**: Edge case da spec.
