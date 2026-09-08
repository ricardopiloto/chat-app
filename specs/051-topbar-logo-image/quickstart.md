# Quickstart: 051-topbar-logo-image

## Prerequisites

- `frontend/public/mesa-logo.png` present (copied from `imgs/logo.png`)
- `npm run dev` (HMR)

## Setup

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Shell autenticada

1. Login → topbar.
2. **Expect**: logo image in brand; text «Mesa»; no solid accent-only mark.

### B — Temas

1. Alternar claro/escuro.
2. **Expect**: logo reconhecível em ambos.

### C — Auth

1. Logout / ecrã de login.
2. **Expect**: mesma imagem no painel de marca.

### D — Narrow

1. Viewport ~375px.
2. **Expect**: logo visível; acções da topbar utilizáveis.

## Done when

- A–D OK + `tsc --noEmit` limpo.
