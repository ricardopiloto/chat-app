# Quickstart: 076-app-version-label

## Prerequisites

- Frontend running (`npm run dev`); backend optional for auth flow.
- Know the expected product version = `version` in `frontend/package.json` (should match CHANGELOG product release after alignment, e.g. `0.5.0`).

## A — Área pública (rodapé da marca)

1. Abrir login (e convite) sem sessão.
2. Esperado: no **rodapé** do painel de marca (junto à nota self-hosted), texto pequeno com a versão (`X.Y.Z`).
3. Esperado: **não** há versão colada imediatamente abaixo do nome «Mesa» no hero.

## B — Área autenticada (sob o nome)

1. Entrar na app autenticada.
2. Esperado: na TopBar, **abaixo** de «Mesa», a mesma string de versão, tipografia menor.

## C — Mesma string

1. Comparar A e B no mesmo build.
2. Esperado: texto idêntico.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
# optional: grep package version
node -p "require('./package.json').version"
```

## Pass criteria

A–C match [spec.md](./spec.md) SC-001–SC-004 and [contracts/app-version-display.md](./contracts/app-version-display.md).
