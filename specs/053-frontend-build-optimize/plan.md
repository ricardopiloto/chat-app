# Implementation Plan: Optimização do frontend (dedupe + build)

**Branch**: `053-frontend-build-optimize` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/053-frontend-build-optimize/spec.md`

## Summary

Reduzir o **chunk de entrada** do frontend de produção para **&lt; 500 kB** (baseline ~963 kB) sem silenciar o aviso Vite, carregando o stack pesado de voz/vídeo só no **primeiro join** ou enquanto houver **chamada activa** (PiP permitido). Em paralelo, produzir um **inventário completo** de duplicação JS e **unificar agressivamente** em módulos locais (erros API, capacidades, prefs, chrome de painéis, wrappers de rota, media helpers). CSS/tema fora de âmbito.

## Technical Context

**Language/Version**: TypeScript ~5.8; SolidJS 1.9; Vite 6.

**Primary Dependencies**: `solid-js`, `@solidjs/router`, `livekit-client`, `@livekit/track-processors`, crypto (`tweetnacl` / `hash-wasm` / `@noble/hashes`).

**Storage**: Preferências em `localStorage` (tema, blur, last channel, etc.); sem schema DB.

**Testing**: `cd frontend && npm run build` (gate SC-001); `./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md); backend contract suite inalterada salvo regressão acidental.

**Target Platform**: Browser desktop + narrow; build servida em produção Mesa.

**Project Type**: Frontend SPA (Solid) no monorepo Mesa; backend fora de âmbito.

**Performance Goals**: Entry JS **&lt; 500 kB** (minified, aviso Vite); texto-only shell sem load eager de LiveKit; loading/retry ao entrar em voz.

**Constraints**: Sem redesign CSS; sem mudar contratos API; não fundir divergências intencionais; chamada activa + PiP devem continuar a funcionar.

**Scale/Scope**: Todo o `frontend/src` JS; `vite.config.ts`; inventário em `specs/053-…/inventory.md` (ou equivalente na feature dir).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + build size gate + tsc |
| Complexity Tracking | Lazy voice + helpers locais justificados abaixo |

**Gate: PASS**

### Re-check pós-Phase 1

Design limita-se a FE JS, contratos de UX/build, inventário de clusters. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/053-frontend-build-optimize/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── build-entry-budget.md
│   ├── voice-lazy-load-ux.md
│   └── dedupe-inventory.md
├── inventory.md          # preenchido na implementação (FR-001)
└── spec.md
```

### Source Code (repository root)

```text
frontend/vite.config.ts                 # manualChunks opcional (livekit/crypto)
frontend/src/App.tsx                    # thin shell; lazy voice provider/path
frontend/src/voice/                     # VoiceSession + lazy load gate
frontend/src/video/                     # liveClient, backgroundBlur (heavy)
frontend/src/lib/                       # NEW: errorMap, capabilities, storage prefs facade
frontend/src/api/client.ts              # consumers of shared error helpers
frontend/src/shell/                     # AppShell wrappers, Sidebar gates, FloatingVoicePip
frontend/src/pages/                     # Channel, VoiceChannel, Auth, Invite, …
frontend/src/components/                # RolesPanel, ChannelAclPanel, Scene*, …
frontend/src/preferences/               # unify via shared storage helper
frontend/src/theme/ / blur/             # same prefs facade
```

**Structure Decision**: (1) Split voice/LiveKit behind dynamic `import()` triggered by join / active call, with loading+retry UI. (2) Optional `manualChunks` for `livekit-client` / crypto. (3) New thin `frontend/src/lib/` (or `shared/`) for deduped helpers; migrate all inventaried call sites. (4) Inventory artifact lives under the feature dir for SC-005.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Lazy VoiceSession + PiP | FR-004/004b: entry &lt;500kB sem partir chamada activa | Eager LiveKit in App.tsx — causa o entry ~963 kB |
| Inventário + unificação agressiva | Clarificação Q3 / SC-002 | Só 3 helpers — rejeitado pelo utilizador |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/build-entry-budget.md](./contracts/build-entry-budget.md)
- [contracts/voice-lazy-load-ux.md](./contracts/voice-lazy-load-ux.md)
- [contracts/dedupe-inventory.md](./contracts/dedupe-inventory.md)
- [quickstart.md](./quickstart.md)
