# Data Model: 072-channel-name-lock

## Channel name (persisted)

| Field | Rules (after normalize) |
|-------|-------------------------|
| `name` | Non-empty string; length ≤ **32** (Unicode scalar / string length as used by FE `.length` and Rust `chars().count()` or `len` of UTF-8 — **align FE/BE**: use character count of Unicode scalars in BE (`chars().count()`) and document that FE uses JS string length; for BMP emoji they match; surrogate pairs differ — research chose **JS `.length` / UTF-16 units on FE** and **same check on BE via UTF-16 unit count or reject chars().count()>32**. Prefer: both sides use **number of Unicode scalar values** (`[...str].length` FE / `chars().count()` BE) for consistency with “string length” product language without grapheme clusters. |

**Canonical for this feature**: count **Unicode scalar values** (code points), not grapheme clusters. FE: `[...name].length` or equivalent; BE: `name.chars().count()`.

## Normalize function (logical)

```text
input → replace each whitespace char with '-'
      → if codepoint_len > 32: take first 32 code points
      → output draft
```

## Validate function (logical)

```text
normalized empty? → invalid
normalized matches /^-+$/ ? → invalid
codepoint_len > 32? → invalid
contains whitespace? → invalid (should not happen post-normalize)
else → valid
```

## Sidebar row (presentation)

| Slot | Content |
|------|---------|
| Prefix | `#` or voice icon |
| Name | Truncated visually under lock (private) or full flex (public) |
| Lock | Private only; right-aligned; overlays name fade zone |

## State transitions

```text
typing → normalize live → draft ≤32
submit → validate → persist or error
legacy name → display as-is until rename → normalize on edit
```
