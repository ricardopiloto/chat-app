# Data Model: 064-day-sep-full-width

Sem entidades de persistência. Modelo de **layout** sobre 061.

## Layout regions

| Region | Role | Width / vertical |
|--------|------|------------------|
| **`.text-scroll`** | Scrollport do histórico | Referência de largura (conteúdo **dentro** do padding lateral) e de **topo** para o sticky |
| **Padding lateral habitual** | Margem interna do painel (hoje ~24px) | Limite externo das dash lines; não edge-bleed |
| **`.day-sep` (inline)** | Separador linha + rótulo | Largura = 100% da área de conteúdo do scroll (após padding) |
| **Coluna de mensagens** | `.text-measure` / `.msg-group` | Continua `max-width` de leitura (ex. 74ch); independente das lines |
| **`.day-sep-sticky`** | Chip do dia em vista | Flush ao **topo** do scrollport; sem dash full-width |

## Timeline items (unchanged from 061)

| Kind | Fields | Notes |
|------|--------|-------|
| `day-separator` | `dayKey`, `label` | Same rules; only DOM/CSS placement changes |
| `msg-group` | sender + messages | Same grouping; stay in narrow column |

## Validation rules (layout)

1. Inline lines MUST NOT be descendants of the 74ch-constrained box (or MUST break out equivalently without horizontal scroll).
2. Sticky MUST NOT introduce perceptible vertical gap below the top edge of the scroll area when visible.
3. Message reading width MUST NOT be forced to full scroll width by this feature.

## State transitions

Nenhuma nova. Sticky show/hide continua 061.
