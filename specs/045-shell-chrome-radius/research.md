# Research: 045-shell-chrome-radius

## R1 — Token de gutter

**Decision**: Introduzir `--shell-gutter: 8px` em `nocturne.css` (subtil, uniforme). Usar para: padding externo do `.app` (inset), `gap` do `.shell` grid, `gap` vertical entre cartões da sidebar, e folga topbar ↔ corpo.

**Rationale**: 8px deixa `--radius-lg` (22px) legível sem “dashboard generoso”; clarificação B.

**Alternatives considered**: 4px (quase-colado, cantos ainda comprimidos); 16px (generoso / C rejeitado).

## R2 — Raio dos cartões de chrome

**Decision**: Superfícies de chrome (topbar, rail, sidebar cards, pane) usam `border-radius: var(--radius-lg)` (22px, 044). Overflow `hidden` nos cartões que scrollam (nav, rail list, pane) para clip correcto.

**Rationale**: FR-002 alinhamento ao grau moderado–forte; superfícies grandes → lg, não md.

**Alternatives considered**: `--radius-md` (fraco em painéis largos); novo `--radius-xl` (YAGNI).

## R3 — Topbar inset alinhada às colunas

**Decision**: Padding horizontal (e superior) em `.app` = `--shell-gutter`. Topbar e `.shell` partilham a mesma largura de conteúdo (ambos inset pelo padding do pai). Gap vertical entre topbar e `.shell` = `--shell-gutter`. Topbar: `border-radius: var(--radius-lg)`; remover dependência de “full bleed + border-bottom afiado” como único separador (pode manter hairline interna se útil).

**Rationale**: FR-010 / clarificação A — cartão inset alinhado às colunas, não full-bleed nem faixa independente.

**Alternatives considered**: Margin só na topbar (desalinha se shell não tiver o mesmo inset); full-bleed (rejeitado).

## R4 — Três cartões na sidebar

**Decision**:

- `.sidebar`: flex column, `gap: var(--shell-gutter)`, **sem** background de coluna inteira, **sem** `border-right` full-height (o gutter do grid separa do pane).
- `.sidebar-header`, `.sidebar-nav`, `.user-panel`: cada um com `background` de superfície (`var(--panel)` / elev subtil), `border-radius: var(--radius-lg)`, `overflow: hidden` no nav; **remover** `border-top`/`border-bottom` entre eles (a folga substitui).
- Header deixa de ser “só divider”; vira cartão compacto (~52px altura preservada).

**Rationale**: FR-008 / clarificação A cartões separados.

**Alternatives considered**: Coluna una (rejeitado); só user-panel separado (híbrido rejeitado).

## R5 — Rail e pane

**Decision**:

- `.server-rail`: `border-radius: var(--radius-lg)`, background mantido, **sem** `border-right` (gap do grid); `overflow: hidden`.
- `.shell-main` / `.pane` (e `.home-empty.pane`): superfície com radius lg + background adequado (`var(--elev)` ou stage/pane actual) para o cartão ler-se no fundo do `.app`; `min-height: 0` + overflow como hoje.

**Rationale**: SC-001 seis regiões; FR-001.

## R6 — Grid / `display: contents`

**Decision**: Manter `.shell-nav { display: contents }` para rail e sidebar continuarem células do grid. Aplicar `gap: var(--shell-gutter)` em `.shell` (e variantes members-open / stage). Ajustar `grid-template-columns` se necessário para que a soma + gaps não rebente — tipicamente o `1fr` absorve.

**Rationale**: Evita refactor JSX; CSS-only.

**Alternatives considered**: Wrappers extra no AppShell (só se contents impedir gap visual — improvável).

## R7 — Stage e drawer

**Decision**:

- Stage: manter gutters; sidebar colapsada (52px) continua cartão(ões) visíveis conforme regras existentes (header/nav hidden quando collapsed — expand strip pode partilhar estilo de cartão).
- Drawer/narrow: preservar gutters reduzidos se preciso (`max(4px, …)` só se 8px partir), mas default 8px; cartões não cortam labels (FR-006).
- Members panel (se aberto): aplicar o mesmo radius/gutter por coerência mínima (não é região SC-001, mas evita afiado ao lado do pane).

**Rationale**: US3 / FR-006.

## R8 — Sombras e divisores

**Decision**: Sem `box-shadow` novos elaborados (Out of Scope). Separação = gutter + contraste de fundo do `.app` (`--color-bg`) vs cartões (`--panel` / `--elev`). Remover borders entre cartões que competem com o gap.

**Rationale**: Spec Out of Scope.

## R9 — Validação

**Decision**: Quickstart visual 6 regiões + stage + drawer + temas; `tsc --noEmit`. Sem testes de pixel automatizados.
