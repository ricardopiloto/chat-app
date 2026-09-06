# Contract: Tipografia, elevação e motion

## Tipografia

- App carrega Inter via `@font-face` (woff2), `font-display: swap`.
- `--font-body` e `--font-heading` referenciam Inter + fallbacks de sistema.
- Títulos/cabeçalhos usam peso ≥600; corpo 400–500 de forma consistente no shell, chat, voz, auth, settings.

## Elevação

- Todos os menus flutuantes listados no spec usam **apenas** `var(--shadow-float)` (sem `box-shadow` literal por componente).
- `[data-theme="light"]` redefine `--shadow-float` para contraste em fundo claro; tema escuro usa receita distinta.

## Motion

- Menus flutuantes usam classe/animação de entrada partilhada (~120–160 ms).
- `@media (prefers-reduced-motion: reduce)`: entrada e morph de hover da rail sem animação perceptível.
- Keyframes existentes `voice-roster-speak-aura` / e2ee pulse: **sem alteração de comportamento**.

## Non-goals

- Não mudar `--color-bg` / identidade roxa.
- Não animar speaking/e2ee sob reduced-motion nesta feature (fora de FR-009 “novas”).
