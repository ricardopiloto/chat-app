# Data Model: 051-topbar-logo-image

Sem entidades de domínio. Asset de marca:

## BrandLogo

| Field | Meaning |
|-------|---------|
| Source path | `imgs/logo.png` (repo) |
| Served path | `/mesa-logo.png` (frontend public) |
| Role | Icon mark next to wordmark «Mesa» |
| Surfaces | Authenticated topbar; auth brand pane |

## UI composition

```text
.topbar-brand
  img.topbar-mark  → /mesa-logo.png
  span.topbar-name → "Mesa"

.auth-brand-row
  img.topbar-mark.auth-mark → same
  span.topbar-name.auth-brand-name → "Mesa"
```

## Validation

- Mark is image content (not solid accent fill only).
- Aspect ratio preserved (`object-fit`).
- Accessible product name remains «Mesa».
