# Research: 023-fix-blur-menu

## R1 — Root cause

**Decision**: Tratar como **clipping** do painel `.camera-blur-menu` (position absolute, `bottom: calc(100% + 8px)`) pelo ancestral `.call-ctrl-split { overflow: hidden }` introduzido em 020 para o chrome Discord. O estado `blurMenuOpen` e o clique na seta podem estar correctos; o menu renderiza mas fica invisível/cortado.

**Rationale**: Menu é filho do split; `overflow: hidden` + menu acima = clip. Stage-mode não é necessário para o bug, mas é onde o utilizador o viu.

**Alternatives considered**:
- Bug só de `pointerdown` a fechar no mesmo tick — menos provável (há `setTimeout(0)` no listener; âncora `.camera-blur-anchor` exclui o chevron).
- z-index sob o palco — possível secundário; verificar após fix de overflow.

## R2 — Fix preferido (CSS)

**Decision**:
1. Remover ou mudar `overflow: hidden` em `.call-ctrl-split` para `overflow: visible`.
2. Preservar visual de pílula: `border-radius` no wrapper + `border-radius` nos extremos dos botões filhos (primeiro/último), sem depender de clip no wrapper.
3. Se necessário, `isolation` / `z-index` no menu (`z-index` já 40) para ficar acima do palco.

**Rationale**: Menor mudança; mantém Discord chrome; sem Portal.

**Alternatives considered**:
- Portal para `document.body` / `.app` — robusto contra qualquer ancestor overflow; mais código (posição fixed + medir âncora). Usar só se CSS não bastar (ex. `.pane { overflow: hidden }` também clipa).
- Mover o menu no DOM para fora do split (irmão de `.call-controls`) — válido, mais churn em VoiceChannel.

## R3 — Verificação stage-mode

**Decision**: Após CSS, validar com `stage-mode` + `stage-channels-expanded` (DOM do reporte). Se ainda cortado, subir z-index ou Portal.

**Rationale**: SC-002 / US3.

## R4 — Sem mudança de produto 015

**Decision**: Não alterar opções, `selectBlurMode`, nem `aria-label`s; só visibilidade/camada.
