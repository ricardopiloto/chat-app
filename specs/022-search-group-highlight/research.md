# Research: 022-search-group-highlight

## R1 — Alvo DOM do highlight

**Decision**: Depois de `waitForMessageEl` / `querySelector([data-message-id=…])`, resolver `group = el.closest(".msg-group")` e aplicar/remover `msg-highlight` no **grupo**. Se `closest` falhar (markup inesperado), não destacar (tratar como falha suave / log opcional) — não cair no `.msg-block`.

**Rationale**: Spec exige contentor de grupo (avatar+meta+itens). Clarificação A: sem estilo no bloco do hit. `closest` é estável com o markup actual de `Channel.tsx`.

**Alternatives considered**:
- Destacar grupo **e** bloco — rejeitado na clarificação.
- Passar `groupId` no data-model do For — overkill; DOM já agrupa.
- Classe nova `msg-group-highlight` — possível; preferir reutilizar `msg-highlight` no grupo para menos churn, desde que CSS deixe de mirar `.msg-block.msg-highlight` no caminho de pesquisa.

## R2 — CSS

**Decision**: Mover regras de `.msg-block.msg-highlight` para `.msg-group.msg-highlight` (fundo/contorno/radius adequados ao grupo inteiro, incl. avatar). Remover ou deixar inerte o seletor no bloco se nenhum outro código o usar. Garantir contraste claro/escuro (herdar mix de accent actual).

**Rationale**: FR-005; visual deve ler-se como um cartão/unidade, não uma linha.

**Alternatives considered**: Padding negativo só no bloco — insuficiente para avatar/meta.

## R3 — Scroll vs highlight

**Decision**: Manter `el.scrollIntoView({ block: "center" })` na **mensagem** (`data-message-id`); highlight no grupo. Não centrar o grupo.

**Rationale**: FR-003 / clarificação implícita 017.

## R4 — Coexistência com 021 hover

**Decision**: Fora de âmbito. Usar nome de classe de pesquisa `msg-highlight` distinto de qualquer futuro `msg-hover` (021). Não implementar hover aqui.

**Rationale**: FR-006.
