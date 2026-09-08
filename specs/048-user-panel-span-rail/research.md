# Research: 048-user-panel-span-rail

## R1 — Cartão-base contínuo (painel sob rail + sidebar)

**Decision**: Tornar `.shell-nav` um **grid item real** (remover `display: contents`) que ocupa a(s) coluna(s) esquerda(s) do `.shell`. Layout interno:

```text
.shell-nav
  display: grid
  grid-template-columns: 68px 238px   (stage: 68px 52px / 68px 238px expanded)
  grid-template-rows: minmax(0, 1fr) auto
  gap: var(--shell-gutter)
  ServerRail     → row 1 / col 1
  aside.sidebar  → row 1 / col 2  (header + nav only; sem UserPanel)
  .user-panel    → row 2 / col 1 / -1
```

Mover `<UserPanel>` no JSX para **irmão** de `ServerRail` e `aside.sidebar` (ainda dentro de `.shell-nav`), não filho de `.sidebar`.

**Rationale**: Um único cartão (clarificação A); gutter natural via `gap` entre row 1 e o painel; rail encolhe porque só ocupa row 1.

**Alternatives considered**:

- Negative margin / absolute panel sob a rail (frágil, overlap, scroll bugs).
- Dois cartões na base (rejeitado na clarificação).
- Manter `display: contents` + `grid-column` no panel (panel não é filho directo do `.shell` hoje).

## R2 — Colunas do `.shell` após `shell-nav` real

**Decision**: Reduzir `.shell` para duas (ou três com membros) colunas principais:

| Mode | Columns |
|------|---------|
| Default | `auto 1fr` (nav width = 68 + gutter + 238) |
| Members | `auto 1fr 260px` |
| Stage collapsed | nav internal `68px 52px`; shell still `auto 1fr` |
| Stage expanded | nav internal `68px 238px` |

Usar `width`/`grid-template-columns` internos no `.shell-nav` alinhados aos breakpoints já usados (68 / 238 / 52). Opcionalmente `grid-template-columns: 68px 238px` fixos no nav e `width: max-content` / `min-width: 0` no shell first track.

**Rationale**: `display: contents` fazia rail e sidebar tracks separados; com nav real, um track `auto` evita duplicar 68+238 no parent e no child.

**Alternatives considered**: Manter `68px 238px 1fr` no shell e `grid-column: 1 / 3` no nav (também válido; escolher a variante que menos quebra media queries existentes — auditar regras `[data-narrow]` / drawer no implement).

## R3 — Stage mode

**Decision**: Em stage, actualizar só as **colunas internas** do `.shell-nav` (52px vs 238px); o `user-panel` continua `grid-column: 1 / -1`. Esconder header/nav como hoje; painel permanece visível na base.

**Rationale**: FR-006 / edge cases.

## R4 — Borda fina em todo o chrome

**Decision**: Aplicar em `.app`:

```css
.app {
  border: 1px solid var(--color-divider); /* ou token dedicado */
  border-radius: var(--radius-lg);
  /* overflow: hidden opcional se filhos pintarem fora dos cantos */
}
```

Manter `padding: var(--shell-gutter)` existente — a borda envolve o chrome inset (topbar + shell) como um quadro.

Tema claro: `--color-divider` já definido. Sem box-shadow / glow.

**Rationale**: Clarificações — contorno de todo o chrome + cantos no ritmo dos cartões (`--radius-lg`).

**Alternatives considered**: Wrapper extra em `AppShell` (desnecessário); borda só em `.shell` (rejeitado — topbar fora); borda em cada cartão (rejeitado).

## R5 — Relação com 045

**Decision**: Preservar `--shell-gutter`, `--radius-lg` nos cartões listados em 045. Actualizar contrato 048 a **estender** 045: `.user-panel` continua cartão `--radius-lg`; agora full-span na nav; `.server-rail` já não desce até ao fundo do nav.

**Rationale**: Sem regressão de cantos/gutters.

## R6 — Controlos de chamada no painel largo

**Decision**: Sem redesign; `UserPanel.tsx` intacto funcionalmente. CSS existente (`flex`, `min-width: 0`) deve bastar; validar wrap/overflow no quickstart quando calls visíveis.

**Rationale**: Out of scope redesign; SC-003.
