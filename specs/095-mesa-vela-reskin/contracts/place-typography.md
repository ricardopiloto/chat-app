# Contract: Place typography

**Feature**: 095-mesa-vela-reskin  
**Surfaces**: Voice header title, sidebar server name, Auth brand

## PT-01 — Token

- Define `--font-place` (Fraunces + fallbacks).
- Expose via a class such as `.font-place` (or equivalent) that sets `font-family: var(--font-place)`.

## PT-02 — Allowed targets (only)

1. Voice channel title in the voice pane header  
2. Server name in the sidebar  
3. Auth brand wordmark “Mesa”

## PT-03 — Forbidden

- Do **not** assign Fraunces to `--font-heading` globally.
- Text channel labels, dialog titles, settings headings, cards → utility type (Manrope / existing heading stack without Fraunces).

## PT-04 — Fallback

- If Fraunces fails to load, text remains readable via stack fallbacks (Inter / system-ui).
