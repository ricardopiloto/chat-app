# Contract: Place vs utility typography

**Feature**: 089-mesa-a-vela-reskin  
**Related**: FR-003, FR-004, SC-002

## PT-01 — Token

- Introduce `--font-place` (Fraunces stack). Do **not** assign Fraunces to global `--font-heading`.

## PT-02 — Allowed place contexts (only)

1. Voice channel title in voice pane header  
2. Sidebar server name  
3. Auth brand wordmark  

Implementation: explicit class or scoped selector (e.g. `.font-place`) on those nodes.

## PT-03 — Utility (Manrope)

- Default UI, text channel names (e.g. `#geral`), dialog titles, settings headings, buttons, labels → Manrope (via `--font-body` / non-place headings).
- Inter remains in the fallback stack and self-hosted files stay.

## PT-04 — Acceptance

Reviewers must identify Fraunces **only** on the three place contexts—not on dialog titles or text channel names by accident.
