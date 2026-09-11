# Quickstart: 090-revert-mesa-vela

Validate that Mesa à Vela product outcomes are gone and pre-089 identity + header are back, without regressing 082–088.

## Prerequisites

- Backend + frontend running.
- Contracts: [identity-restore](./contracts/identity-restore.md), [voice-header-restore](./contracts/voice-header-restore.md), [surface-rollback](./contracts/surface-rollback.md).
- Hard-refresh after implement so fonts/CSS reload.

## Automated smoke

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0. Confirm `frontend/public/fonts/` has Inter only (no Manrope/Fraunces).

## Manual scenarios

### 1. Identity light + dark (US1 / SC-001)

1. Shell + voice + text in dark, then light.
2. **Expect**: blurple-led accent, cool greys—not amber/parchment/jade steady state.
3. Primary button / focus / seg inherit restored accent.

### 2. Voice header (US2 / SC-002)

1. Open voice channel.
2. **Expect**: Editar cena (if allowed) and blur visible without `⋯`.
3. Blur + scene edit still function; Grade ↔ Composition OK.

### 3. Place / seats / composer (US3)

1. Voice title, server name, Auth brand → Inter-led (no Fraunces place face).
2. Grade cameras → no 089 seat-tone skins; video OK; screen tiles still full-frame (085).
3. Text composer → pre-089 chrome; send works.

### 4. Regression (FR-007 / SC-004–SC-005)

1. Screen share start/stop clears tile; user-panel controls usable; theme toggle; speaking still indicated.
2. Unload leave / clear ended screen behaviors from 087–088 still OK if exercised.

## Pass criteria

Matches [spec.md](./spec.md) SC-001–SC-006.
