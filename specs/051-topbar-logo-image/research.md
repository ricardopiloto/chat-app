# Research: 051-topbar-logo-image

## R1 — Onde viver o asset

**Decision**: Copiar `imgs/logo.png` → `frontend/public/mesa-logo.png` (URL estável `/mesa-logo.png`). Manter o original em `imgs/` como fonte.

**Rationale**: Vite serve `public/` na raiz; sem pipeline de import obrigatório. Nome estável evita cache confusa com `logo.png` genérico.

**Alternatives considered**:

- `import logoUrl from '../assets/logo.png'` — também válido; public é mais simples para favicon futuro.
- Referenciar `imgs/` fora do frontend — não é servido pelo Vite.

## R2 — Mark vs wordmark

**Decision**: Substituir apenas o mark (quadrado de cor). Manter `<span class="topbar-name">Mesa</span>` (e equivalente auth). `img` com `alt=""` decorativo; o nome visível cobre a11y (ou `aria-label="Mesa"` no `.topbar-brand`).

**Rationale**: Spec assumption; a imagem não contém wordmark.

**Alternatives considered**: Só ícone sem texto — rejeitado pelo default da spec.

## R3 — CSS do mark

**Decision**: `.topbar-mark` passa a ser `img` (ou background) com `width/height` ~22px (auth pode ser maior via `.auth-mark`), `border-radius: var(--radius-md)`, `object-fit: cover`, sem `background: var(--color-accent)`.

**Rationale**: FR-004; remove o bloco sólido FR-002.

## R4 — Tema claro

**Decision**: Usar o mesmo PNG. Se contraste falhar no claro, acrescentar anel/`box-shadow` mínimo ou fundo neutro atrás do ícone — só se o quickstart falhar SC-002.

**Rationale**: Spec evita variantes; CSS mínimo se necessário.

## R5 — Auth

**Decision**: Mesmo `src` em `AuthShell` no lugar de `.topbar-mark.auth-mark`.

**Rationale**: FR-006 / US3.
