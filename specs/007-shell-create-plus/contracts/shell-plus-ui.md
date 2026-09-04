# Contract: Shell «+» UI + single-scene voice chrome

## Server rail

- `ServerRail` exposes a create control: glyph `+`, `aria-label="Criar servidor"` (or equivalent).
- Layout: scrollable server icons **above**; create control **pinned to bottom** of the rail viewport (always visible when rail is visible).
- Click opens create-server dialog (does **not** select a server).

## Channel column

- MUST NOT render buttons labeled «Criar servidor» or «Criar canal».
- With a server selected, always show section labels **Texto** and **Voz e vídeo**.
- Owner only: each section label has a trailing «+» with distinct accessible names (e.g. «Criar canal de texto», «Criar canal de voz e vídeo»).
- «+» opens create-channel dialog with **type fixed** (no type control in the form).
- Non-owner: section labels without «+».
- Invite / footer / delete context menus: unchanged except delete respects last-of-type.

## Voice channel chrome (single scene)

- MUST NOT render multi-scene management UI (`SceneList` / labels «Cenas» / Cena nova / Duplicar / Activar / Apagar / Copiar quadro / scene picker).
- Owner MUST still have **Editar cena** opening the editor for the **active** scene only.
- Composition/grid, call controls, Gravar/E2EE, bank: unchanged.
- Backend scene multi-APIs MAY remain; SPA MUST NOT call create/duplicate/activate/delete for scenes in this feature’s UI paths.

## CSS

- Theme file MUST parse (no orphan braces).
- Styles for rail sticky-plus and section-row «+» included in Mesa theme.
