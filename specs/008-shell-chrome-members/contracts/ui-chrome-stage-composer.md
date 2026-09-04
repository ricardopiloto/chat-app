# Contract: UI chrome — botões, composer, palco colapsado

## Botões

- Selectors alvo: `.btn`, `.btn-primary`, `.btn-ghost`, botões de diálogo/call chrome.
- Visual: `border-radius: 999px` (pílula), alinhado ao protótipo v2.
- Fora de escopo: tiles de vídeo, ícones de canal/sidebar list items, avatares do rail.

## Composer

- `.composer` no canal de texto: `width: 100%` da área de conteúdo do pane; **sem** `max-width` tipo `74ch`.
- Padding lateral consistente com `.text-scroll` / `.pane-header`.

## Modo palco

| Estado | Rail | Sidebar (canais) | Main |
|--------|------|------------------|------|
| stage off | 68px | 238px (ou drawer) | 1fr |
| stage on, channels collapsed | 68px | strip (~40–56px) + «mostrar canais» | 1fr |
| stage on, channels expanded | 68px | ~238px | 1fr |

- **Proibido** no stage: `display: none` no rail.
- Sair do palco: toggle «Modo palco» / evento `mesa:stage-mode` com `stage: false`.
- Expandir canais **não** define `stageMode = false`.

## Eventos (existentes / extendidos)

- `mesa:stage-mode` `{ stage?: boolean; toggle?: boolean }` — inalterado semanticamente para on/off.
- Opcional: atributo/classe `stage-channels-expanded` no `.shell` controlada pelo shell.
