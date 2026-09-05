# Contrato: Tokens de tipografia

Âmbito: `frontend/src/styles/nocturne.css` (tokens) e `frontend/src/styles/mesa-theme.css` (aplicação a componentes). Família de corpo/UI (Inter) mantém-se — ver Assumptions do spec.

## Token novo: `--font-mono`

```css
:root {
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", "Consolas", "Fira Mono", monospace;
}
```

Aplicar `font-family: var(--font-mono);` a:

| Seletor | Ficheiro | Valor mostrado |
|---------|----------|-----------------|
| `.key-display` | `mesa-theme.css` | Chave de mídia E2EE (backup manual) — FR-009 |
| `.members-handle` | `mesa-theme.css` | Handle de membro | FR-010 |
| Código de convite (input/`<code>` no diálogo de convite, `Sidebar.tsx`) | `mesa-theme.css` | Código/URL de convite | FR-010 |

Qualquer outro valor técnico copiável introduzido no futuro segue a mesma regra (Assumptions do spec).

## Token alterado: hierarquia de heading

`--font-heading-weight` deixa de ser um único valor (`500`) aplicado a `h1..h6`; passa a variar por nível:

```css
h1, h2, h3 { font-family: var(--font-heading); font-weight: 650; }
h4, h5, h6 { font-family: var(--font-heading); font-weight: 500; }
```

O tracking negativo (`-0.015em`) já existente em `h1..h6` mantém-se sem alteração — a variação de peso é o que estava em falta (FR-011). Os "eyebrows" de secção (`.sidebar-section`, `h6` com `text-transform: uppercase` + tracking positivo) não mudam — já cumprem o requisito.

## Compatibilidade de tema

Nenhum destes tokens depende de cor — `--font-mono` e os pesos de heading aplicam-se identicamente em `[data-theme="light"]` e `[data-theme="dark"]` (FR-012 aplica-se a ícones; tipografia já é tema-neutra por construção).
