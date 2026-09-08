# Contract: Build entry budget

**Feature**: 053-frontend-build-optimize  
**Surface**: `npm run build` (Vite production)

## Gate (normative)

| Check | Rule |
|-------|------|
| Entry chunk size | O asset JS de **entrada** reportado pelo Vite MUST ser **&lt; 500 kB** (tal como o Vite mede para o aviso de chunk size) |
| Warning | O aviso `Some chunks are larger than 500 kB` MUST **não** aplicar-se ao **entry** |
| Forbidden | Aumentar `build.chunkSizeWarningLimit` para “passar” sem reduzir o entry |

## Baseline

| Metric | Value |
|--------|-------|
| Entry (pre-feature) | ~962.84 kB (~277.26 kB gzip) |

## Allowed strategies

- Dynamic `import()` do stack voz/vídeo
- `manualChunks` para vendors pesados (ex. `livekit-client`)
- Lazy de rotas/páginas se reduzir o entry

## Out of scope

- CSS bundle size / tema split
- Backend binary size
