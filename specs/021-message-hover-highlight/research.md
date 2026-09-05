# Research: 021-message-hover-highlight

## 1. Onde aplicar o destaque

**Decision**: CSS em `.msg-block:hover` e `.msg-block:focus-within` (os mesmos gatilhos que já mostram `.msg-delete`). Sem JS. Avatar (`.msg-avatar`) e meta (`.msg-meta`) ficam **fora** do bloco → pairar aí não destaca nada (clarificação A).

**Rationale**: A unidade de «Apagar» é `.msg-block` (texto + anexos + pré-visualizações + botão). Selectors nativos cobrem uma mensagem de cada vez e limpam ao sair. `tabindex={0}` no bloco já existe (011/017).

**Alternatives considered**:
- Destacar `.msg-group` — rejeitado (FR-002 / clarificação).
- Classe JS `onMouseEnter` — desnecessário; pior para scroll/corridas.
- Highlight em `.text-scroll` — rejeitado (FR-002).

## 2. Distinção vs salto da pesquisa (017)

**Decision**: Hover/foco usa superfície `--hover` (overlay de chrome Mesa, sem anel accent). `.msg-highlight` mantém accent ~22% + `box-shadow` inset. Especificidade: ambas podem aplicar-se; o salto continua mais marcado. Transição curta no hover; `prefers-reduced-motion: reduce` → `transition: none` (como 017).

**Rationale**: Spec — hover = «ponteiro aqui», pesquisa = «resultado do salto». `--hover` já é o token de apontar no shell; não copiar o anel 017.

**Alternatives considered**:
- Mesmo estilo que `.msg-highlight` — rejeitado (FR-005).
- Só contorno no hover — menos «conjunto inteiro» que um fundo no bloco.

## 3. Cobrir o bloco completo (anexos)

**Decision**: Fundo e `border-radius` no **próprio** `.msg-block` (já envolve body + attachments + LinkPreviews). Ajustar padding vertical/horizontal do bloco se o fundo ficar colado ao texto (espelhar o `padding-left` usado em `.msg-highlight` só o necessário para o hover não cortar o conteúdo). Não envolver o avatar.

**Rationale**: SC-002 — unidade completa, não só `.msg-body`.

**Alternatives considered**: Destacar só `p.msg-body` — falha anexos-only.

## 4. Teclado / toque

**Decision**: `:focus-within` no bloco (inclui foco em «Apagar»). Sem hover permanente em ecrãs tácteis; foco mostra o alvo quando aplicável.

**Rationale**: FR-004 / US3; paridade com delete.

**Alternatives considered**: `:focus-visible` só no bloco — falharia quando o foco está no botão «Apagar» (filho).
