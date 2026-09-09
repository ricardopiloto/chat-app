# Data Model: 074-i18n-en-ptbr

Client-side only for MVP. No new server tables.

## Entities

### AppLocale

| Value | Meaning |
|-------|---------|
| `pt-BR` | Portuguese (Brazil) — product source locale |
| `en` | English (generic product) |

**Rules**: Only these values appear in the selector. Future locales append to the supported set.

### LocalePreference

| Field | Meaning |
|-------|---------|
| `locale` | `AppLocale` stored under local prefs key (e.g. `mesa.locale`) |
| `source` | Conceptual: `stored` \| `detected` (not necessarily persisted) |

**Rules**:

- If stored → always wins over detection.
- If absent → detect from browser/system, do **not** write until user explicitly chooses (optional: write on first detect — prefer **not** writing until Account menu change so detection can track browser until first explicit choice). **Product rule**: first explicit Account menu selection persists; until then each load may re-detect unless we snapshot detection once per session. **Chosen**: on first resolve without stored value, **persist detected locale** so F5 is stable (SC-002) even before Account menu use — equivalent to “soft preference from detection”. Document in contract.

### MessageCatalog

| Field | Meaning |
|-------|---------|
| `locale` | `AppLocale` |
| `messages` | Nested record of string templates (supports `{name}` interpolation) |

**Rules**: `en` and `pt-BR` share the same key tree. Missing key → fallback to `pt-BR` → key path.

### SystemRoleLabel

| Field | Meaning |
|-------|---------|
| `roleId` / `is_system` | Identifies system role |
| `displayName` | `t("roles.system.*")` when system; else raw `role.name` |

## Relationships

```text
Browser languages ──detect──► AppLocale (if no stored pref)
AccountMenu setLocale ──persist──► LocalePreference (local)
LocalePreference ──drives──► MessageCatalog lookup (t)
t() ──labels──► UI chrome
role.is_system ──► SystemRoleLabel via t()
```

## State transitions

1. **Cold start, no `mesa.locale`**: detect → set active locale → **persist** detected value (stable F5).
2. **User picks language in Account menu**: set active + overwrite `mesa.locale`.
3. **Clear site data**: back to detection.

## Validation

- Reject unknown locale strings when reading prefs → fall back to detect.
- Selector offers exactly `{pt-BR, en}`.
