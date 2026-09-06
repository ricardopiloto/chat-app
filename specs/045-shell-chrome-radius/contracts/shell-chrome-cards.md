# Contract: Cartões de chrome da shell (045)

## Tokens

| Token | Valor | Uso |
|-------|-------|-----|
| `--shell-gutter` | `8px` | Inset `.app`, gap `.shell`, gap cartões sidebar, gap topbar↔shell |
| `--radius-lg` | `22px` (044) | `border-radius` de todos os cartões de chrome listados |

Temas claro/escuro **MUST NOT** redefinir estes tokens de forma diferente entre si.

## Cartões obrigatórios (cantos visíveis)

Cada um **MUST** ter `border-radius: var(--radius-lg)` e fundo de superfície distinto do fundo da app:

1. `.topbar` — inset (não full-bleed à viewport)
2. `.server-rail`
3. `.sidebar-header` (incl. `.sidebar-header-static`)
4. `.sidebar-nav`
5. `.user-panel`
6. `.pane` / `.home-empty` (pane principal)

## Gutters

- Entre cartões vizinhos e face ao fundo: **`--shell-gutter`** (subtil, uniforme).
- **MUST NOT** depender só de `border` entre blocos colados a 0px para “mostrar” o raio.
- Divisores `border-top`/`border-right` entre cartões da sidebar / rail **SHOULD** ser removidos quando o gutter os substitui.

## Sidebar stack

- `.sidebar` **MUST** empilhar os três cartões com `gap: var(--shell-gutter)`.
- `.sidebar` **MUST NOT** pintar um fundo full-bleed que una visualmente os três num único rectângulo.

## Topbar

- **MUST** partilhar o inset horizontal do conteúdo com `.shell` (padding do `.app` ou equivalente).
- **MUST NOT** colar-se às bordas esquerda/direita/superior da janela sem folga.

## Non-goals

- Novas sombras elaboradas / elevação Discord-nitro.
- Alterar tokens `--radius-sm|md` de controlos interiores (044).
- Converter avatars/`50%`/pills.
- Refactor funcional de navegação ou VoiceSession.
