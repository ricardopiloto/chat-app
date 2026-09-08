# Data Model: 057-system-theme-preference

No server entities. Local preference + derived effective theme.

## ThemePreference

| Field | Type | Notes |
|-------|------|--------|
| value | `system` \| `light` \| `dark` \| null | `null` = never set (behaves like system for resolution; cycle UI shows Sistema) |
| storageKey | string | `mesa.theme` |

**Persistence**:
- User selects Claro/Escuro/Sistema → write that string (`system` included).
- Load must **not** write solely because resolution followed the OS.

## EffectiveTheme

| Field | Type | Notes |
|-------|------|--------|
| value | `light` \| `dark` | Applied to `html` and `.app` as `data-theme` |

**Resolution**:

```text
if preference ∈ {light, dark} → effective = preference
else (system | null) → effective = prefers-color-scheme light ? light : dark
```

## State transitions (preference)

```text
[null / system]
    --cycle--> [light]   (persist light)
[light]
    --cycle--> [dark]    (persist dark)
[dark]
    --cycle--> [system]  (persist system)
[system]
    --cycle--> [light]   (persist light)

[system | null] + OS scheme change → effective updates; preference unchanged
[light|dark] + OS scheme change → no effective change
[any tab] write mesa.theme → other tabs re-resolve + apply
```

## Validation

- Invalid stored string → treat as `null`.
- Legacy `light`/`dark` without ever having `system` remain valid overrides.
- Effective theme is always exactly `light` or `dark`.
