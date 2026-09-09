# Implementation Plan: Versão do produto (público no rodapé; autenticado sob o nome)

**Branch**: `076-app-version-label` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/076-app-version-label/spec.md`

**Note**: `.specify/feature.json` → `specs/076-app-version-label`. Clarifications: public version in `auth-pane-brand` footer; authenticated under TopBar name.

## Summary

Expose a single **product version** string in the FE UI: small text in the **AuthShell brand footer** (login/invite) and **directly under «Mesa»** in the TopBar brand. Inject the version at build time from `frontend/package.json` (and align that version — plus `backend/Cargo.toml` — with the product release documented in CHANGELOG, currently **0.5.0**). Shared helper so both surfaces show the same string.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Vite for build-time inject. Optional sync of Rust crate version string (display is FE-only).

**Primary Dependencies**: `AuthShell.tsx`, `TopBar.tsx`, `mesa-theme.css`, `vite.config.ts`, `frontend/package.json` (+ align `backend/Cargo.toml` version).

**Storage**: N/A — compile-time / package metadata only.

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md) public + authenticated.

**Target Platform**: Browser — auth screen + authenticated shell TopBar.

**Project Type**: Web UI + version metadata alignment.

**Performance Goals**: Static string; no network fetch for version.

**Constraints**: Same string public + auth; public NOT under hero name; no opaque git hash as primary label; small secondary typography; no click/About modal in MVP.

**Scale/Scope**: ~1 helper module, 2 UI surfaces, CSS, vite define, version bump in manifests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/076-app-version-label/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── app-version-display.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/package.json                 # product version string (align to CHANGELOG release)
backend/Cargo.toml                    # align package version with product (CHANGELOG policy)
frontend/vite.config.ts               # define __APP_VERSION__ / import.meta.env from package.json
frontend/src/lib/appVersion.ts        # NEW: export APP_VERSION display string
frontend/src/components/AuthShell.tsx # version in .auth-brand-footer
frontend/src/shell/TopBar.tsx         # version under .topbar-name
frontend/src/styles/mesa-theme.css    # .app-version / topbar + auth footer styles
```

**Structure Decision**: FE-only display; single build-time constant from `package.json`; keep Cargo.toml in sync per CHANGELOG product-version policy (not fetched from BE).

## Complexity Tracking

N/A
