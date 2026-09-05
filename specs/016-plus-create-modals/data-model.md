# Data Model: 016-plus-create-modals

Sem entidades de domínio nem schema. Modelo de **apresentação UI**.

## `DialogSurface` (padrão partilhado)

| Parte | Classes | Tokens esperados |
|-------|---------|------------------|
| Overlay | `.dialog-backdrop` | Scrim derivado do tema (`--color-neutral-900` / texto mix) |
| Painel | `.dialog` | `--color-surface` ou `--elev`, `--radius-lg`, `--shadow-lg` |
| Título | `.dialog-title` | `--font-heading`, `--color-text` |
| Corpo | `.dialog-body` | `--color-text` (muted via opacity ou `--muted`) |
| Acções | `.dialog-actions` | Botões `.btn` existentes |

### Tema

| Estado | Fonte da verdade |
|--------|------------------|
| `data-theme="dark" \| "light"` | Preferência `mesa.theme` via `theme.ts` |
| Herança no portal | Dialog montado sob `.app` (ou tokens no `documentElement`) |

## `FormControls` (partilhados)

| Controlo | Classe | Notas |
|----------|--------|-------|
| Label | `.field > label` | Legível em claro/escuro |
| Input | `.input` | Fundo/borda/texto via tokens; focus accent |
| Erro | `.error` | Contraste em ambos os temas |

## `PlusCreateModals` (aceitação)

| Modal | Disparo | Campos (inalterados) |
|-------|---------|----------------------|
| Criar canal texto | + secção Texto | nome (+ existentes) |
| Criar canal voz | + secção Voz | nome (+ existentes) |
| Criar servidor | + rail | nome / campos existentes |

Sem novas propriedades de dados; sem novas APIs.
