# Proposal

## Why

The official Parley instance cannot open public registration without readable terms of use and a privacy policy linked from the existing email acceptance checkbox. Self-hosted operators also need a clear template and remain responsible for their own instances.

## What Changes

- Publish public `/terms` and `/privacy` pages in pt-BR and en, with complete text in the repository.
- Identify the official controller as a natural person in the rendered documents; supply the name and contact at frontend build time, never in git.
- Supply self-hosted template text at the same routes with visible operator identity placeholders until configured by build-time environment variables.
- Link both documents from email acceptance and both public home footers.
- Update operator docs: do not enable `REGISTO_MODO=aberto` until final legal text and identity are configured.

## Capabilities

### New Capabilities

- `frontend-v2/legal-documents`: public legal pages, official and self-hosted variants, i18n, and registration acceptance links.

### Modified Capabilities

- `auth/email-registration`: acceptance refers to documents at stable same-instance URLs.
- `frontend-v2/web-public-home`: legal links in addition to the privacy-by-design section.

`MarketingHome` also gains links during implementation; no separate delta exists while `frontend-v2/marketing-home` is absent from the main specs.

## Impact

- Frontend: public destinations, legal text, i18n, `EmailRequest`, and homes.
- Operator docs and CHANGELOG.
- No required API change: `terms_accepted` already exists. Recording accepted text version or timestamp can be a future change.
- This is product draft text aligned with actual E2EE, metadata, and email behavior, not legal advice. Legal review remains recommended before commercial scale.
