# Proposal

## Why

The server header uses 12px vertical padding around 28px buttons (`frontend/src/shell/Sidebar.tsx:19,160`), while the adjacent chat header uses the same padding around 40px buttons (`frontend/src/chat.css:8,13`), leaving their bottom edges about 12px apart. The Members panel header (`frontend/src/shell/MembersPanel.tsx`) also uses content-driven height, so the three persistent headers do not align. The server rail (`frontend/src/shell/ServerRail.tsx`) has no header element, and its divider does not meet the shared 64px alignment line. The sidebar also lacks the intended corner accent (`Sidebar.tsx:158-173`), and its full-width, flush user strip (`frontend/src/shell/UserPanel.tsx:17`) does not read as a distinct account card.

## What Changes

- Give the sidebar, chat, and Members panel headers a fixed 64px total height, including their bottom borders, with centered content and no flex shrink; keep that height at the chat header's narrow breakpoint (`frontend/src/chat.css:428-430`).
- Keep the server rail as one scrollable nav and set its top padding to 4px so the divider between the 48px home button and server list aligns with the other headers' 64px bottom edge. Retain 12px bottom padding and the existing spacing and button styling.
- Round only the server header's top-left and channel list's bottom-left corners by 8px. Use the existing `surface-container-lowest` tone behind `surface-container-low` header and list surfaces so the cuts are visible.
- Move the user card from the Sidebar's own flow into the shared `AppShell.tsx` wrapper for the server rail and active sidebar, spanning both columns with 8px side and bottom margins, 12px corners, `surface-container-high`, and `shadow-floating`. Measure its changing height and reserve space in both scrollable lists so icons and channels remain visible. Keep only the settings button in the idle identity row; active-call controls and connection quality expand the same card upward. Preserve stable hover and focus feedback and an unclipped upward account menu, including in the mobile drawer.

## Capabilities

### Modified Capabilities

- `frontend-v2/app-shell`: align persistent shell headers and refine sidebar and user-panel presentation.

## Impact

- `frontend/src/shell/AppShell.tsx` becomes the shared card host; `frontend/src/shell/Sidebar.tsx` stops rendering the card and reserves channel-list space; `frontend/src/shell/ServerRail.tsx` reserves server-list space; `frontend/src/shell/UserPanel.tsx` remains the card component. Header and interaction styling also involves `frontend/src/shell/MembersPanel.tsx`, `frontend/src/chat.css`, and possibly `frontend/src/voice/CallControls.tsx` or its existing CSS. No backend, localization, width, or token changes.
