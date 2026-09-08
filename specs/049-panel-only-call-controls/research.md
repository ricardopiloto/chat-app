# Research: 049-panel-only-call-controls

## R1 — Predicado do grupo no painel

**Decision**: Alterar `showCallGroup` em `UserPanel.tsx` de `voice.live() && !onStage()` para **`voice.live()`**.

**Rationale**: Spec supersede 042/043 — na mesa o painel passa a ser o único sítio dos controlos pessoais. Remover a dependência de `viewingActiveVoiceStage` neste componente (import/uso local podem sair se deixarem de ser necessários).

**Alternatives considered**:

- Manter `!onStage` e só esconder o palco → utilizador na mesa sem controlos (rejeitado).
- Duplicar controlos no palco e no painel → rejeitado pelo pedido.

## R2 — Remoção da barra do palco

**Decision**: Remover o bloco JSX `<div class="call-controls">…</div>` (e o `Show when={live() && !editing()}` que o envolve, se ficar vazio) de `VoiceChannel.tsx`. Não substituir por uma barra “só Gravar”.

**Rationale**: FR-001; clarificação remove gravação da UI. CSS `.call-controls` pode ficar órfão (limpeza opcional no polish) — não bloqueia.

**Alternatives considered**: `display: none` via CSS sem remover JSX (deixaria lógica/handlers vivos; pior).

## R3 — Gravação (G1) suspensa na UI

**Decision**: Remover entry points de produto nesta feature:

- Botões «Gravar cena…» / «Parar gravação»
- Diálogo `Gravar cena` + `confirmGravar`
- Handlers/`startEgress`/`stopEgress` **só se** ficarem sem usos; preferir apagar código morto no mesmo ficheiro
- Sufixo de banner «— gravando via Egress…» pode permanecer defensivo ou simplificar se `recording` deixar de ser activável pela UI

**Não** remover nesta feature: rotas/API backend de egress, G2 banner E2EE / Religar E2EE.

**Rationale**: Clarificação 2026-09-06 + backlog G1. Spec Assumptions: backends podem ficar intactos.

**Alternatives considered**: Relocar Gravar noutro chrome da mesa (rejeitado na clarify).

## R4 — `viewingActiveVoiceStage`

**Decision**: Manter a função em `VoiceSession` (outros consumidores / PiP / stage-mode). Só deixar de usá-la no predicado do painel.

**Rationale**: Escopo mínimo; stage-mode do shell continua útil.

## R5 — Altura do palco

**Decision**: Sem CSS especial obrigatório — remover a barra liberta naturalmente o espaço flex do `voice-pane` / stage. Validar no quickstart SC-005; só ajustar se algum `min-height`/`flex` da barra residual impedir o ganho.

**Rationale**: US3 é consequência da remoção, não um redesign de layout.
