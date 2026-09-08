# Research: 055-channels-rail-drawer

## R1 — Generalizar estado além do palco

**Decision**: Tratar «lista de canais expandida» como preferência de shell **independente** do `stage-mode`. O toggle «Ocultar / Mostrar canais» aparece no cabeçalho da sidebar em desktop (rail+lista), em palco e fora. Manter classes CSS: preferir `.shell.channels-collapsed` (ou reutilizar `stage-channels-expanded` invertido com naming claro) aplicável **sem** exigir `.stage-mode`.

**Rationale**: Clarificação Q1 + FR-001a.

**Alternatives considered**:
- Só no `stage-mode` — rejeitado pelo utilizador (Q1 = B).
- Novo modo «focus» separado — overkill.

## R2 — Persistência da chave localStorage

**Decision**: Continuar a usar `mesa.stageChannelsExpanded` **ou** renomear para `mesa.channelsListExpanded` com **read fallback** da chave antiga na primeira leitura (FR-008 / SC-004). Valor `true` = drawer aberto (coluna completa); `false` = fechado (peek).

**Rationale**: Evita resetar preferências de utilizadores existentes.

**Alternatives considered**: Nova chave sem migração (quebra SC-004); duas prefs (confuso).

## R3 — Layout fechado: atrás do rail + peek à direita

**Decision**:
- `.shell-nav` fechado: `grid-template-columns: 68px var(--channels-peek, 10px)` (ajustar finura).
- Sidebar (`aside.sidebar`) com `overflow: hidden`; conteúdo da lista não interactivo quando fechado excepto a faixa.
- **Z-index**: Server Rail acima do corpo do drawer; peek visível na junção rail→main (aresta direita do rail / coluna estreita da sidebar).
- Peek = hit target (botão/área) na coluna estreita ou pseudo-elemento na borda direita do rail que chama **apenas** `expand` (open), não toggle close.

**Rationale**: Q3 = A; FR-002/002a/006.

**Alternatives considered**: Peek à esquerda da app; overlay sobre ícones do rail — rejeitados.

## R4 — Abrir = reflow; fechar só no header

**Decision**: Aberto → `grid-template-columns: 68px 238px` (valores actuais). Fechar → só `onToggle` / «Ocultar canais» no header. Clique na peek **nunca** fecha. Sem `click-outside` listener para fechar.

**Rationale**: Q2 = B; Q4 = A; FR-004/005/007a.

**Alternatives considered**: Toggle na faixa; click-outside — rejeitados.

## R5 — Hover enlarge

**Decision**: Em `:hover` / `:focus-visible` da peek, aumentar largura da faixa (ex. 10px → 18–22px) e/ou contraste/sombra leve. Com `prefers-reduced-motion: reduce`, omitir transição de largura; manter mudança de contraste/outline para affordance (FR-008).

**Rationale**: Spec exige enlarge **percebido**; pixels exactos no implement.

**Alternatives considered**: Só mudança de cor sem enlarge — insuficiente vs briefing.

## R6 — Mobile / narrow

**Decision**: Em breakpoints onde `.shell-nav` não é rail+lista lado a lado, **não** aplicar o padrão peek-behind-rail; manter drawer hamburger actual (`drawer-open`).

**Rationale**: FR-009.

## R7 — Relação com stage-mode

**Decision**: `stage-mode` continua a controlar chrome de voz/palco. Collapsed channels **pode** coexistir com stage. Remover regra CSS que só mostra `.sidebar-stage-expand` dentro de `.stage-mode` (tornar o botão sempre visível em desktop).

**Rationale**: Q5 = A; produto actual esconde o botão fora do palco.
