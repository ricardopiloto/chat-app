# Contract: Role card heading — name only

**Feature**: 073-role-card-name-only  
**Surface**: `frontend/src/pages/RolesManagePage.tsx` → `.permission-card-heading`

## Required markup (conceptual)

```html
<div class="permission-card-heading">
  {role.name}
</div>
```

## MUST NOT appear inside `.permission-card-heading`

- Text containing «posição» / position number label
- Text «(sistema)» or equivalent system label

## MUST remain elsewhere on the card / page

- Reorder ↑ / ↓ when applicable
- Link/button «Permissões»
- Delete control for non-system roles
- System roles still non-deletable via existing rules (`is_system`)

## Non-goals

- Changing role permission detail page copy
- Changing members manage role labels
- Exposing `position` in a new UI widget in this feature
