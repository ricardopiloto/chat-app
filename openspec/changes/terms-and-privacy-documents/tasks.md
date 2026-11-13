# Tasks

## 1. Legal content

- [x] 1.1 Implement build-time `VITE_LEGAL_OPERATOR_NAME`, `VITE_LEGAL_OPERATOR_CONTACT`, and `VITE_LEGAL_OPERATOR_JURISDICTION` substitution for both variants, with conspicuous unconfigured fallback strings. Keep real identity values out of git; use only fake examples in docs. Verify rendered text identifies a natural person when configured.
- [x] 1.2 Draft official `terms` and `privacy` in pt-BR and en under `frontend/src/legal/official/`, using shared identity tokens and a natural-person controller section. Verify four files against `docs/e2ee-gaps.md` without excessive promises.
- [x] 1.3 Draft the self-hosted template under `frontend/src/legal/template/`, using the same identity tokens and an explicit independently-operated, non-official disclaimer. Verify four files and visible fallback behavior when unconfigured.

## 2. Pages and paths

- [x] 2.1 Implement responsive `/terms` and `/privacy` pages selecting official versus template via the documented build variant and following the active locale. Verify anonymous viewing and live language switching.
- [x] 2.2 Wire `/terms` and `/privacy` as phase-independent destinations in `entryScreen()`, following `/__foundation`; there is no router table. Production already sends both paths to the SPA through its existing Nginx fallback, so no Nginx change is needed. Verify direct URLs in the web build and explicitly check `npm run dev` serves both paths despite the multi-entry Vite configuration.

## 3. Acceptance and homes

- [x] 3.1 Compose the `EmailRequest` checkbox label from separate translated text segments and real JSX anchors to `/terms` and `/privacy`; do not embed HTML in i18n strings. Verify both links and that submission without acceptance remains blocked.
- [x] 3.2 Add footer links in `WebPublicHome` and `MarketingHome`. Verify clicks reach the legal pages.
- [x] 3.3 Add visible `/terms` and `/privacy` links in `Auth` for both login and register modes, outside the form. Verify the frontend build.

## 4. Documentation and verification

- [x] 4.1 Document `VITE_LEGAL_OPERATOR_NAME`, `VITE_LEGAL_OPERATOR_CONTACT`, `VITE_LEGAL_OPERATOR_JURISDICTION`, and the official/template build variant in `docs/operar-instancia.md` and `docs/deploy-producao.md`, following their inline `export VAR=value` style with explicitly fake examples. Require final legal text and configured identity before `REGISTO_MODO=aberto`; mention `/terms` and `/privacy`.
- [x] 4.2 Add an Unreleased CHANGELOG entry; run `npm run build` and relevant i18n verification. Verify the build and new translation keys.
