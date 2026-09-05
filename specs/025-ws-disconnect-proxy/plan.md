# Implementation Plan: Ruído de proxy WS ao sair da sala

**Branch**: `025-ws-disconnect-proxy` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-ws-disconnect-proxy/spec.md`

## Summary

Eliminar o erro recorrente `[vite] ws proxy error: This socket has been ended by the other party` ao **sair da sala de voz/vídeo** em desenvolvimento. Origem esperada: proxy Vite de **`/rtc` (LiveKit)** no leave (`room.disconnect`), não o `/ws` da app. Preferir **close ordenado** no cliente/leave path; filtrar logs sem melhorar o disconnect só como último recurso documentado.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9); Vite ^6.3 (dev proxy); LiveKit client ^2.15; Rust backend inalterado salvo se a investigação o exigir.

**Primary Dependencies**: `livekit-client` (`Room.disconnect`), `frontend/vite.config.ts` proxies `/ws` + `/rtc`, `VoiceChannel.tsx` `leave()` / `onCleanup`, `liveClient.ts`.

**Storage**: N/A.

**Testing**: Manual [quickstart.md](./quickstart.md) (5 leaves → 0 spam; rejoin; falha forçada); `cd frontend && npx tsc --noEmit`.

**Target Platform**: Dev SPA HTTPS `localhost:1420` com proxy para API `:8080` e LiveKit `:7880`.

**Project Type**: Web app — principalmente `frontend/` (proxy + leave); backend/LiveKit só se o close server-side for a causa.

**Performance Goals**: UI fora da chamada ≤2 s (SC-002); 0 erros de proxy atribuíveis ao leave em 5 leaves (SC-001).

**Constraints**: FR-002a — não preferir silenciar o log do proxy; FR-004 — não ocultar quedas reais; produção sem Vite pode não mostrar o sintoma.

**Scale/Scope**: Investigação + fix pontual (1–3 ficheiros típicos: `liveClient.ts`, `VoiceChannel.tsx`, eventualmente `vite.config.ts` + nota em docs).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — quickstart + `tsc` |
| Complexity Tracking | Vazio (salvo proxy custom pesado) |

**Gate: PASS**

### Re-check pós-Phase 1

Design: contratos de leave limpo + identificação `/rtc` vs `/ws`; sem entidades de domínio novas. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/025-ws-disconnect-proxy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── intentional-leave-ws.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
├── vite.config.ts              # Proxies /ws, /rtc — possível ajuste mínimo
└── src/
    ├── api/ws.ts               # App WS — tipicamente NÃO fechar no leave
    ├── video/liveClient.ts     # disconnect LiveKit
    └── pages/VoiceChannel.tsx  # leave() + onCleanup disconnect

backend/                        # Intocado salvo causa server-side
docs/                           # Nota operacional só se spam for inevitável
```

**Structure Decision**: Investigar e corrigir o caminho de **leave → LiveKit disconnect → proxy `/rtc`**. Evitar middleware proxy custom a menos que close ordenado falhe de forma demonstrável.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
