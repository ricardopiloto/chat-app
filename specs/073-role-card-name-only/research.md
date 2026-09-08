# Research: 073-role-card-name-only

## 1. What to remove from the heading

**Decision**: In `RolesManagePage.tsx`, keep rendering `{role.name}` inside `.permission-card-heading`; delete the muted `<span>posição {role.position}</span>` and the `<Show when={role.is_system}>…(sistema)</Show>` siblings.

**Rationale**: Spec FR-001–003; current DOM concatenates name + posição + sistema.

**Alternatives considered**:
- Move posição elsewhere on the card — out of scope (assumptions: order + arrows suffice).
- Keep «(sistema)» as a badge outside the heading — not requested; leave system protection on delete button only.

## 2. Scope boundary

**Decision**: Touch only the roles manage list heading. Do not change `RolePermissionsPage` («Perfil de sistema — …») or members locked-role UI.

**Rationale**: Spec edge cases / assumptions.

## 3. CSS

**Decision**: Prefer no CSS change. If `.permission-card-heading` flex/gap looks odd with a single child, tighten gap only if needed.

**Rationale**: YAGNI until visual check.
