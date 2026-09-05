# Data model: 020-call-control-icons

Sem entidades de persistência. Modelo de **apresentação** da barra de chamada.

## CallControlChrome (UI)

| Campo | Valores | Notas |
|-------|---------|--------|
| Mic visible label | none | Só ícone on/off |
| Mic accessible + tooltip | `Microfone ligado` \| `Microfone desligado` | `aria-label` ≡ `title` |
| Cam visible label | none | Só ícone on/off |
| Cam accessible + tooltip | `Câmara ligada` \| `Câmara desligada` | `aria-label` ≡ `title` |
| Cam split chrome | unified Discord-like | Contentor + divider + chevron |
| Leave visible | hangup icon + «Sair» | Clarificação A |
| Leave style | danger / red fill | Não `btn-primary` |
| Leave tooltip | none required | FR-009 |

## State (unchanged from 015 / voice)

| Signal / pref | Role |
|---------------|------|
| `micOn` / `camOn` | Toggle icons + labels |
| `blurMode` | Chevron shape / `data-blur` |
| `blurMenuOpen` | Menu open |
| `mesa.cameraBlur` | Unchanged |

## Validation rules (UI)

- Mic/cam MUST NOT render the strings «Microfone» / «Câmara» as visible text.
- Leave MUST render «Sair» and hangup icon.
- Split MUST remain two focusable buttons (toggle ≠ menu).
