# Design

## Context

`EmailRequest` requires `terms_accepted` without linking documents. Operator docs already caution against open registration without final texts. The official instance uses `home.html` and `MarketingHome`; the main app uses `index.html`.

User decisions: provide official and self-hosted text, keep complete documents in the repo at `/terms` and `/privacy`, and identify the official controller as a natural person in rendered text.

## Goals / Non-Goals

**Goals:** public legal pages in pt-BR and en; official natural-person name and contact in rendered documents; a self-hosted template with visible placeholders; links in email acceptance and both homes.

**Non-Goals:** external legal opinion or LGPD certification; browser administration UI for legal text (future instance-settings work); backend text-hash versioning; changing E2EE or metadata behavior.

## Decisions

### D1 — Versioned Markdown and Solid pages

Keep legal bodies in `frontend/src/legal/official/{terms,privacy}.{pt-BR,en}.md` and equivalent `template/` files, rendered by a lightweight page with safe Markdown typography. This keeps prose readable in Git diffs instead of a monolithic i18n catalog. External URLs alone contradict the decision to keep text in the repo.

### D2 — Routing and official/template selection

The existing `home.html` versus `index.html` split consists of two Vite build entries and is unrelated to `/terms` and `/privacy`. Both legal URLs use the main SPA bundle (`index.html`). Production needs no new infrastructure: `docs/deploy-producao.md` configures exact `location = /` for `home.html`, while every other path, including legal URLs, uses `location / { try_files $uri /index.html; }`. Inside the SPA, `entryScreen()` resolves legal paths independently of session phase, as it already does for `/__foundation`; there is no declarative route table. Links from `MarketingHome` navigate normally through that same Nginx fallback. Explicitly verify the local multi-entry Vite dev server handles both direct URLs.

Select official Markdown only when `VITE_LEGAL_DOCUMENT_VARIANT=official` is set at frontend build time; default to the self-hosted template. This selection is independent of `data-home` and `OFFICIAL_ORIGIN`.

### D3 — Operator identity placeholders

Both official and self-hosted documents commit the same `{{LEGAL_OPERATOR_NAME}}`, `{{LEGAL_OPERATOR_CONTACT}}`, and `{{LEGAL_OPERATOR_JURISDICTION}}` tokens, never real controller identity. The rendering page substitutes `import.meta.env.VITE_LEGAL_OPERATOR_NAME`, `import.meta.env.VITE_LEGAL_OPERATOR_CONTACT`, and `import.meta.env.VITE_LEGAL_OPERATOR_JURISDICTION` at build time. This follows the environment-variable convention already used for self-host configuration (`BIND`, `LIVEKIT_*`, `EMAIL_*`, `REGISTO_MODO`), applied to the frontend build. If any value is absent, show an obvious fallback such as `[OPERATOR NAME NOT CONFIGURED — set VITE_LEGAL_OPERATOR_NAME]`; an unconfigured deployment must not appear finished. Official values are set locally on its deploy machine during build and never committed, including in `.env.example`. Examples must be plainly fake, such as `Jane Doe` and `legal@example.com`.

Keep separate official and template Markdown only where substance differs, chiefly the self-hosted disclaimer that the instance is independently operated and is not the official Parley service.

### D4 — Links in acceptance label

The i18n system interpolates only plain-text `{placeholder}` values. Compose the label from translated text segments and real JSX anchors: `emailRegistration.termsPrefix`, a `/terms` anchor with `termsLink`, `termsMiddle`, a `/privacy` anchor with `privacyLink`, and `termsSuffix`. Do not embed HTML in translated strings. Same-tab navigation with browser history is acceptable here.

### D5 — Tone and limits

Ground privacy text in `docs/e2ee-gaps.md` and actual metadata, email, and encrypted attachment behavior. State that participants can share received content. Terms cover acceptable use, official versus self-hosted operation, absence of a commercial SLA at this stage, and AGPL-3.0 software licensing versus the official hosted service.

## Risks / Trade-offs

- The text is a product draft rather than a legal opinion; operator docs recommend legal review when scale warrants it.
- A deployment can expose unconfigured identity values; conspicuous fallback text and the operator checklist make this visible.
- The natural person's identity becomes public in rendered official pages, as requested, while remaining outside the public repository.
