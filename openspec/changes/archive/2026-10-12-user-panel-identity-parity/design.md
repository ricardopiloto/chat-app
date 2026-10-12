# Design

## Context

See proposal.md for why the resting strip was compared with the wrong mockup. The shell markup to match is the block just before `</aside>` in `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html`: footer `bg-surface-container-lowest p-2`, identity row `px-1.5 py-1`, name `font-headline-sm text-body-sm` (Plus Jakarta Sans, 12 px, weight 400), handle `font-label-code-sm text-label-code-sm text-on-surface-variant` (JetBrains Mono, 11 px, weight 500), avatar `w-8 h-8`, presence `w-2.5 h-2.5 ring-2 ring-surface-container-lowest`, tune `p-1.5 rounded` with a 18 px icon.

`UserPanel.tsx` today uses `text-body-md` on a `strong` (14 px, bold), `text-secondary` on the handle, the default avatar (40 px), `px-3 py-3 gap-3`, and a 36 px circular tune button with a 20 px icon. The wrapper is `border-t border-outline-variant bg-surface-container`. That row measures 240×64 px.

## Goals / Non-Goals

**Goals:**

- Make the resting identity row match the shell mockup with tokens that already exist.
- Keep the presence-dot change local to this row.

**Non-Goals:**

- Restyling call controls, the account menu, or the logout dialog.
- Copying the highlighted bar from `mesa_menu_de_conta_popover_modal_de_sair` (green handle, "• Online", settings button filled).
- Changing avatar size or presence ring anywhere else.
- Treating Lucide vs Material Symbols glyph shape as a miss.

## Decisions

1. **Name and handle stay in `UserPanel.tsx`, with existing utilities.** Name: `font-display text-body-sm text-on-surface leading-tight` on an element that is not `strong`, so the weight stays 400. Handle: `font-code text-label-code-sm text-on-surface-variant`, text `@handle` only. Alternative considered: keep `text-secondary` from the 1.3.0 fix. Rejected because that color belongs to the other mockup.

2. **Avatar uses the existing `sm` size (32 px).** The presence dot is overridden only under this row (10 px, ring colored `surface-container-lowest`). Alternative considered: edit `.presence` globally. Rejected because members, messages and menus share it.

3. **The wrapper loses the top border and the `surface-container` fill.** It becomes `bg-surface-container-lowest p-2`, and the identity row becomes `justify-between px-1.5 py-1` with `gap-2` between avatar and text. The tune button becomes `rounded` (8 px), padding 6 px, icon 18 px, color `on-surface-variant`. Call controls keep their own classes; this change does not rebuild them as the mockup's rounded chip.

## Risks / Trade-offs

- [Call controls sit in the same wrapper] → Their button styles stay. Only the shared background and the identity-row border change. If the live-call footer then looks uneven, that is a later change, not this one.
- [A 400-weight display name looks lighter than the current bold 14 px] → That is the shell mockup. Do not re-bold it to "look stronger".

## Migration Plan

UI only. Rollback is reverting `UserPanel.tsx` and the local presence override.

## Open Questions

None.
