# Spec Delta

## ADDED Requirements

### Requirement: Aligned server rail, sidebar, chat, and Members panel tops
The server sidebar header, chat header, and Members panel header SHALL each have a fixed total height of 64px, including the bottom border, with vertically centered content and no shrink. The server rail SHALL remain one scrollable nav without a distinct header element or container. Its 4px top padding and 48px home button SHALL place the divider between the home button and server list at the same 64px alignment line as the three headers' bottom edges. The rail SHALL retain 12px bottom padding and the existing item spacing and button styling. The alignment SHALL hold at narrow viewport widths.

#### Scenario: Desktop alignment
- **WHEN** the server rail, server sidebar, chat view, and Members panel are displayed side by side
- **THEN** the three headers are each 64px tall and their bottom edges align with the rail's divider after its home button

#### Scenario: Narrow viewport alignment
- **WHEN** the chat header uses its narrow viewport spacing
- **THEN** its total height remains 64px, matching the sidebar and Members panel headers and the server rail's divider alignment line

### Requirement: Sidebar corner accent
The server header SHALL have an 8px radius only at its top-left corner, and the scrollable channel list SHALL have an 8px radius only at its bottom-left corner. Their other corners SHALL remain square. The cut corners SHALL reveal the sidebar's `surface-container-lowest` backdrop behind their `surface-container-low` surfaces.

#### Scenario: Visible cut corners
- **WHEN** the sidebar is shown in either light or dark theme
- **THEN** only the server header's top-left and channel list's bottom-left corners reveal a contrasting backdrop, while the other edges remain flush

## MODIFIED Requirements

### Requirement: Faixa de identidade do painel do utilizador fiel ao shell
With the account menu closed, the identity row at the bottom of the shared navigation card SHALL show a 32px avatar with a 10px presence dot, a truncating 12px display name in the existing display font and `on-surface` color, a truncating 11px handle in the existing mono font and `on-surface-variant` color, and a trailing settings button with an 18px icon and 8px corners. The text SHALL leave room for that button. In the idle state the settings button SHALL be the only trailing control; it SHALL continue to open the account menu. The handle SHALL contain only `@handle`, without a presence suffix. The identity row SHALL retain the compact spacing of `mesa_shell_da_aplica_o_chat_de_texto` (about 6px horizontally and 4px vertically, with an 8px gap between avatar and text) and SHALL NOT become a 64px bar with 12px padding. The identity row SHALL retain 8px internal padding and no top border of its own; its presence-dot ring SHALL match the card's `surface-container-high`. Avatars outside this panel SHALL retain their existing sizes and rings.

The user panel SHALL be one card hosted by the shared navigation wrapper in `AppShell.tsx`, visually spanning the server rail and the active sidebar across their combined width without changing either column's width. It SHALL sit at the base of that wrapper with 8px side and bottom margins, at least 8px clearance from content above, 12px corners, a `surface-container-high` background, and `shadow-floating`. Both the server rail's scrollable list and the sidebar's scrollable list SHALL reserve bottom space based on the card's real rendered height, including its bottom offset and clearance, so no server icon or channel is obscured in idle or active-call states. A `ResizeObserver` measurement SHALL update the shared reserved height as the card changes size. During an active call, `CallControls` (mic, deafen, camera, screen share, hang up) and connection-quality state SHALL expand the same card upward, with identity at its bottom and no second panel. The upward-opening `surface-container-high` account menu SHALL remain fully visible without clipping by the card or any ancestor. Controls SHALL have soft `surface-container-highest` hover highlights and visible keyboard focus without moving, scaling, or changing size. The card SHALL move with the existing mobile navigation drawer, remain within its bounds, and maintain the same measured list clearance there. The navigation backdrop SHALL use `surface-container-lowest`, and the header and channel list SHALL retain `surface-container-low`; text and icons SHALL use `on-surface` or `on-surface-variant` as appropriate, with no new color tokens.

#### Scenario: Faixa em repouso
- **WHEN** no call is active and the account menu is closed
- **THEN** the name and handle truncate to leave space for the settings button, the name is 12px and on-surface, the handle is 11px and on-surface-variant without "Online", the avatar is 32px with a 10px presence dot, the settings button is the only trailing control with an 18px icon and 8px corners, and the row is not a 64px bar with 12px padding

#### Scenario: A barra destacada do menu de conta não se aplica em repouso
- **WHEN** the account menu is closed
- **THEN** the handle does not use the secondary color or display "• Online", which belong to the emphasized menu treatment rather than the shell identity row

#### Scenario: Outros avatares ficam iguais
- **WHEN** an avatar appears outside the shared navigation card (message, members, or menu)
- **THEN** its size and presence ring are unchanged by this panel

#### Scenario: Elevated card in both themes
- **WHEN** the navigation is shown in light or dark theme with either sidebar variant
- **THEN** the card spans the server rail and sidebar as one rounded, shadowed surface within its side and bottom margins, distinct from the header and channel list

#### Scenario: Both lists clear the measured card
- **WHEN** the server rail and channel list are scrolled to their ends, whether the card is idle or taller during a call
- **THEN** the last server icon and last channel remain fully visible above the card with at least 8px clearance, and reserved space tracks its rendered height

#### Scenario: Call controls and account menu
- **WHEN** a call is active and the account menu is opened from the expanded user panel
- **THEN** mic, deafen, camera, screen share, hang up, and connection-quality state remain in the same card above identity, and the menu opens upward fully visible without clipping by the card or its ancestors

#### Scenario: Stable control hover
- **WHEN** a user-card control is hovered or receives keyboard focus
- **THEN** it receives a soft color or background highlight or visible focus indicator without shifting, scaling, or changing size

#### Scenario: Mobile drawer clearance
- **WHEN** the combined navigation becomes the narrow-viewport drawer
- **THEN** the card moves with and remains inside the drawer, and both lists reserve its measured height so their final items remain visible in idle and active-call states
