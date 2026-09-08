# Contract: Topbar / auth Mesa logo

**Feature**: 051-topbar-logo-image  
**Surfaces**: `.topbar-brand`, `.auth-brand-row`

## Required presentation

| Surface | Mark | Wordmark |
|---------|------|----------|
| Authenticated topbar | `<img>` (or equivalent) sourced from served logo asset | Visible «Mesa» |
| Auth brand row | Same asset | Visible «Mesa» |

## Forbidden

- Solid-color-only `.topbar-mark` without the logo image (pre-051 accent square as sole brand).
- Distorted stretching of the logo.
- Removing all accessible/visible product naming.

## Asset

| Item | Value |
|------|--------|
| Repo source | `imgs/logo.png` |
| App URL | `/mesa-logo.png` (after copy to `frontend/public/`) |

## Acceptance probes

1. Topbar: `document.querySelector('.topbar-brand img.topbar-mark')` non-null; `src` resolves 200.
2. Auth: `.auth-brand-row img.topbar-mark` (or `.auth-mark`) non-null.
3. `.topbar-name` text includes `Mesa`.
