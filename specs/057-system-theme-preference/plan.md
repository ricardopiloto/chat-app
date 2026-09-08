# Implementation Plan: Tema alinhado ao sistema com override guardado

**Branch**: `057-system-theme-preference` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/057-system-theme-preference/spec.md`

## Summary

Preferência de tema em três estados (`system` | `light` | `dark`), persistida em `mesa.theme`. Por defeito (chave ausente ou `system`) a Mesa segue `prefers-color-scheme`; overrides `light`/`dark` antigos mantêm-se. Login e auth **só aplicam** o tema resolvido (sem seletor). Topbar autenticada: botão que **cicla** Sistema → Claro → Escuro. Reagir a mudanças do SO e a `storage` entre separadores. Remover `data-theme="dark"` hardcoded em `AuthShell` / `AppShell`; minimizar FOUC com boot cedo (+ script inline leve se necessário).

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend only).

**Primary Dependencies**: `frontend/src/theme/theme.ts`, `shell/TopBar.tsx`, `shell/AppShell.tsx`, `components/AuthShell.tsx`, `App.tsx`, `index.html`; `lib/localPrefs.ts`; ícones `IconSun` / `IconMoon` (+ ícone sistema se preciso).

**Storage**: `localStorage` key `mesa.theme` — values `system` | `light` | `dark` (legacy `light`/`dark` unchanged).

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Browser (desktop + mobile web); auth + authenticated shell.

**Project Type**: Web UI preference / chrome.

**Performance Goals**: Theme apply &lt; 100ms; SO / cross-tab sync &lt; 2s (SC-004/006); FOUC minimized on first paint.

**Constraints**: No theme control on login; no backend sync; no palette redesign; cycle order fixed; explicit `system` when user chooses it.

**Scale/Scope**: Theme module + TopBar cycle + auth/shell boot wiring + optional early script; ~5–8 files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Preference model + UI/storage contracts + early-boot decision. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/057-system-theme-preference/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── theme-preference.md
│   └── theme-topbar-control.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/index.html                      # optional early theme boot script (FOUC)
frontend/src/theme/theme.ts              # ThemePreference, resolve, write, listen system + storage
frontend/src/shell/TopBar.tsx            # cycle System→Light→Dark; icons/aria by preference
frontend/src/shell/AppShell.tsx          # bootTheme; no hardcoded data-theme="dark"
frontend/src/components/AuthShell.tsx    # apply resolved theme; no hardcoded dark
frontend/src/App.tsx                     # ensure bootTheme on auth + app mount
frontend/src/components/icons/…          # system-preference icon if not reusing sun/moon
frontend/src/styles/mesa-theme.css       # unchanged palettes; optional color-scheme hint
```

**Structure Decision**: Extend existing `theme.ts` API (preference vs effective theme). Keep TopBar as sole control surface. Auth/AppShell stop forcing dark and call the same resolver.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/theme-preference.md](./contracts/theme-preference.md)
- [contracts/theme-topbar-control.md](./contracts/theme-topbar-control.md)
- [quickstart.md](./quickstart.md)
