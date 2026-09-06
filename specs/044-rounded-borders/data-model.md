# Data Model: 044-rounded-borders

Sem persistência nem entidades de domínio de backend. Modelo = **escala de raio do design system**.

## Entities

### Radius scale (sistema)

| Field | Type | Baseline | Target (044) | Notes |
|-------|------|----------|--------------|-------|
| `sm` | length px | 4 | 8 | Detalhes / cantos assimétricos pequenos |
| `md` | length px | 8 | 14 | Botões caixa, inputs, menus compactos |
| `lg` | length px | 14 | 22 | Painéis, diálogos, cartões |
| `pill` | length px | 999 | 999 | Pílulas intencionais — imutável |
| `circle` | keyword | `50%` | `50%` | Avatars / ícones redondos — imutável |

Exposto como CSS custom properties: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`.

### Surface kind

| Kind | Radius rule |
|------|-------------|
| `box` | Usa sm / md / lg conforme tamanho/papel |
| `pill` | `--radius-pill` ou `999px` |
| `circle` | `50%` |
| `asymmetric-box` | Zeros preservados; lados redondos sobem com sm/md/lg |

### Theme binding

| Field | Rule |
|-------|------|
| `light` / `dark` | Mesmos valores de raio (FR-004); tokens não são tema-dependentes |

## Relationships

```text
nocturne.css (--radius-*) ──consumed by──► mesa-theme.css + componentes tokenizados
Surface box ──maps──► sm|md|lg
Surface pill|circle ──exempt──► bump 044
```

## State transitions

N/A (estático). “Estado” = versão do design token no CSS carregado.

## Validation

- `pill` e `circle` nunca recebem o bump de caixa.
- `md < lg` e `sm ≤ md` após o bump (hierarquia da escala).
- Caixas alinhadas: literais orphan 6/8/10px no tema Mesa devem mapear para tokens (ver research R3).
