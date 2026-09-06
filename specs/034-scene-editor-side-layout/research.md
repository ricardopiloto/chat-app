# Research: 034-scene-editor-side-layout

## R1 — Causa da altura excessiva nos slots

**Decision**: Tratar o painel como **coluna flex** com filhos **`flex: none`** (altura = conteúdo). Remover qualquer distribuição igual (`flex: 1` / `grid-template-rows: 1fr 1fr 1fr` / `justify-content: space-between` que estique a secção de slots). Hoje `.scene-editor-side` já é `flex-direction: column` + `overflow: auto`, mas as três secções não estão isoladas em wrappers — a implementação MUST torná-las explícitas e garantir que o bloco de slots **não** cresce com a altura da coluna.

**Rationale**: Spec + clarificação (stack por conteúdo). SC-001 exige bloco de slots ≤120px em painel ≥600px.

**Alternatives considered**: Scroll só em «Layout»/«Banco» com slots sticky (rejeitado — clarificação: scroll no painel inteiro); split 50/50 layout/banco no resto (rejeitado).

## R2 — Markup vs só CSS

**Decision**: Envolver as três zonas em wrappers (ex. `.scene-editor-side-block` / `--slots` / `--layout` / `--bank`) em `SceneEditor.tsx` para selectors estáveis; CSS em `mesa-theme.css`.

**Rationale**: Sem wrappers, `flex: 1` acidental em `.field` ou gaps grandes é mais difícil de auditar; wrappers documentam a intenção.

**Alternatives considered**: Só CSS em filhos soltos (mais frágil); redesign do protótipo HTML (fora de âmbito).

## R3 — Scroll

**Decision**: Manter/`overflow: auto` em `.scene-editor-side`. Em desktop (≥901px), o body do editor continua `overflow: hidden` no grid palco|lado — o scroll da coluna lateral fica **dentro** de `.scene-editor-side`. Em viewport estreita, o body já faz scroll; o bloco de slots permanece compacto no topo da coluna lateral.

**Rationale**: FR-003; edge case &lt;901px.

**Alternatives considered**: `overflow: visible` no side e scroll no body em desktop (pode partir o grid 013).

## R4 — Medição SC-001

**Decision**: Validação manual/DevTools: altura do bloco `--slots` (rótulo + select + margens) ≤120px com painel ≥600px. Sem teste visual automatizado nesta feature.

**Rationale**: Projecto sem suite de screenshot; smoke + tsc basta.

**Alternatives considered**: Playwright assert bounding box (overkill para esta entrega).
