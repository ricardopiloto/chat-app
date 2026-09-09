# Implementation Plan: Multi-idioma EN + PT-BR (0.6.0)

**Branch**: `074-i18n-en-ptbr` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/074-i18n-en-ptbr/spec.md`

**Milestone**: Release **0.6.0** capability (i18n foundation). Version bump / tag / release notes are operational follow-up when shipping.

**Note**: `.specify/feature.json` → `specs/074-i18n-en-ptbr`. Clarifications: auth auto-detect; change in Account menu; 100% product UI strings; local-only preference; system role labels translated; custom content untouched.

## Summary

Make Mesa UI multi-locale with **`pt-BR`** and **`en`**: lightweight FE i18n catalog + reactive locale signal, browser/system detection on first visit, persistence via existing local prefs, language control in **AccountMenu**, and migrate **all product chrome strings** (including day labels / notif when / system role «Dono») off hardcoded PT. User-generated content stays as stored. No account-sync API in this phase.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend). Backend API messages: map common errors in FE catalog where practical; no full BE i18n required for MVP.

**Primary Dependencies**: New `frontend/src/i18n/*`; `frontend/src/lib/localPrefs.ts`; `AccountMenu.tsx` / `UserPanel.tsx`; widespread `pages/` + `shell/` + `components/` string call sites; `daySeparators.ts`, `notifFormat.ts`, empty-server jokes, system role display.

**Storage**: `localStorage` via `localPrefs` (e.g. `mesa.locale` = `pt-BR` | `en`). No DB migration.

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && npx tsc --noEmit`. Optional unit tests for `detectLocale` / `t()` fallback.

**Target Platform**: Browser (auth + authenticated shell).

**Project Type**: Frontend i18n foundation + full UI string migration.

**Performance Goals**: Dict in-memory; locale switch O(subscribers) via Solid reactivity; no network fetch for catalogs in MVP (bundle both locales).

**Constraints**: Only EN + pt-BR in selector; no phantom locales; no translate of messages/channel names/custom roles; no unlock/logout on language change; auth has auto-detect (no required language picker on auth); missing key → fallback to pt-BR then key string.

**Scale/Scope**: Large FE touch surface (full UI). Structure work as: (1) i18n core + AccountMenu, (2) systematic string extraction by area, (3) date/relative + system roles, (4) polish inventory. Backend optional error mapping only.

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

UI contract + locale model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/074-i18n-en-ptbr/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── i18n-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/i18n/
  types.ts              # AppLocale = "pt-BR" | "en"
  detect.ts             # navigator → AppLocale
  preference.ts         # read/write mesa.locale
  catalogs/
    pt-BR.ts            # nested or flat message catalog (source)
    en.ts               # English catalog (same keys)
  index.ts              # t(), useI18n, setLocale, LocaleProvider
frontend/src/components/AccountMenu.tsx   # language control
frontend/src/pages/Auth.tsx               # consumes t(); no required picker
frontend/src/shell/** , pages/** , …      # replace hardcoded UI strings
frontend/src/lib/daySeparators.ts         # locale-aware labels
frontend/src/lib/notifFormat.ts           # locale-aware when labels
frontend/src/preferences/emptyServerJokes.ts  # per-locale jokes or keys
```

**Structure Decision**: **Custom lightweight i18n** (no new npm dependency): TypeScript catalogs + Solid context/signal, matching `localPrefs` / theme preference patterns. Add a third locale later by adding a catalog file + registering in `SUPPORTED_LOCALES`.

## Complexity Tracking

N/A
