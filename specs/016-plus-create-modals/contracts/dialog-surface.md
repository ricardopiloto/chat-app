# Contrato: Superfície do Dialog partilhado

Âmbito: `frontend/src/components/Dialog.tsx` + CSS `.dialog*`.

## Comportamento

1. `open === true` → renderizar overlay + painel; `false` → não montar.
2. Clique no backdrop (não no painel) → `onClose`.
3. Título acessível (`aria-label` / `.dialog-title`).
4. Acções opcionais em `.dialog-actions` (botões do design system).

## Tema e montagem

1. O conteúdo do diálogo MUST herdar o **tema actual** do shell (claro/escuro).
2. Com o diálogo aberto, alterar o tema na topbar MUST actualizar cores do overlay/painel/texto **sem fechar** o diálogo.
3. Implementação: Portal montado sob `.app` (preferido) e/ou espelhamento de `data-theme` no documento — ver [research.md](../research.md).

## Visual

1. Painel alinhado a superfícies Mesa (`--color-surface` / tokens do `.app`), não fundo browser-default.
2. Raios e sombra coerentes com `--radius-lg` / `--shadow-lg`.
3. Tipografia do título coerente com headings do shell.

## Fora deste contrato

- Novos campos de formulário.
- Mudança de endpoints de criação.
