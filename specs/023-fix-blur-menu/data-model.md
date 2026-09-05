# Data model: 023-fix-blur-menu

Sem entidades novas. Estado existente (015):

| Signal / pref | Role |
|---------------|------|
| `blurMenuOpen` | Menu montado quando true |
| `blurMode` | `off` \| `light` \| `strong` |
| `mesa.cameraBlur` | Persistência (inalterada) |

## UI visibility rule

Quando `blurMenuOpen === true`, o painel do menu MUST ocupar espaço visível na viewport (não clipado a 0 altura/largura por overflow de ancestrais).
