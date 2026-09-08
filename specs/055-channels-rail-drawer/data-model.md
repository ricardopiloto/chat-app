# Data Model: 055-channels-rail-drawer

Sem entidades de servidor. Estado de UI + preferência local.

## ChannelsListDrawerState

| Campo | Tipo | Notas |
|-------|------|-------|
| expanded | boolean | `true` = coluna completa (reflow); `false` = fechado atrás do rail + peek |
| peekHovered | boolean | opcional; pode ser só CSS `:hover` |
| desktopRailLayout | boolean | true quando shell usa rail+lista lado a lado (não narrow mobile) |

**Invariantes**:
- `expanded === false` ∧ desktop → peek visível na aresta direita do rail; rail clicável.
- `expanded === true` → sidebar ~238px; main em reflow.
- Peek activation → só `expanded = true`.
- Header «Ocultar» → `expanded = false`; «Mostrar» → `expanded = true`.

## LocalPreference

| Campo | Valor |
|-------|--------|
| key | `mesa.channelsListExpanded` (preferido) com fallback read de `mesa.stageChannelsExpanded` |
| true | lista expandida |
| false | lista colapsada (drawer fechado) |

**Migration**: Na leitura, se a chave nova ausente e a antiga existir, usar a antiga e opcionalmente escrever a nova.

## State transitions

```text
[expanded]
    -- header "Ocultar canais" --> [collapsed]
[collapsed]
    -- peek click / header "Mostrar" --> [expanded]
[collapsed]
    -- peek hover --> [collapsed + enlarge visual] (não muda expanded)
```

Sem transição collapsed← via peek click ou click-outside.
