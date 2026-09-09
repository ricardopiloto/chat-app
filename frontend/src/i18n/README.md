# i18n

Custom lightweight catalogs for Mesa UI (`pt-BR`, `en`).

## Add a locale

1. Copy `catalogs/pt-BR.ts` → `catalogs/<code>.ts` and translate values (same keys).
2. Add `<code>` to `SUPPORTED_LOCALES` in `types.ts`.
3. Import and register in `CATALOGS` inside `index.ts`.

Account menu language options are driven by `SUPPORTED_LOCALES`.
