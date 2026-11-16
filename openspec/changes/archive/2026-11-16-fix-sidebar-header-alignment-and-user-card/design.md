# Design

## Context

The sidebar root, server header, and channel list currently share `surface-container-low` (`frontend/src/shell/Sidebar.tsx:158-173`). The sidebar header's 28px buttons plus 12px vertical padding and 1px border yield about 53px (`Sidebar.tsx:19,160`); the chat header's 40px buttons plus the same padding and border yield about 65px (`frontend/src/chat.css:8,13`). At 720px and below, chat header padding becomes 10px vertically (`chat.css:428-430`), while the sidebar has no corresponding rule. The user panel currently uses a full-width `surface-container-lowest` strip (`frontend/src/shell/UserPanel.tsx:17`). Its call controls are rendered inside that strip (`UserPanel.tsx:18`), and its account menu opens upward from an absolute element (`frontend/src/shell/AccountMenu.tsx:55`).

Existing tokens supply the required palette and depth: dark `surface-container-lowest` / `low` / `high` are `#0b0e17` / `#181b24` / `#272a33`, and light values are `#ffffff` / `#f4efeb` / `#e8e1d9` (`frontend/src/tokens.css:5,22`). These give visible differences between card and list in both themes. `--radius-md` is 12px (`tokens.css:14`) and is already mapped to `rounded-md` (`frontend/tailwind.config.ts:14`), used in `Sidebar.tsx:19`. `shadow-floating` is already used by the account popover (`AccountMenu.tsx:55`).

## Goals / Non-Goals

**Goals:** fix a 12px header misalignment; add a deliberate rounded-corner accent reusing the existing palette; make the account panel read as an elevated card.

**Non-Goals:** new color tokens; changes to sidebar width or overall column layout; changes to the account menu's own content.

## Decisions

### D1. Align all four shell columns at 64px

Set the sidebar header, `.ch-head`, and Members panel header (`frontend/src/shell/MembersPanel.tsx`) to a 64px fixed total height including the 1px bottom border, center their contents vertically, and prevent shrink in their flex columns. Remove height-driving vertical padding; keep horizontal padding. At `chat.css:429`, change only the horizontal padding to 14px, preserving the same height at the narrow breakpoint. This aligns all three persistent headers in the same layout and fits the chat header's existing 40px controls without reducing their hit target.

The server rail (`frontend/src/shell/ServerRail.tsx`) shares that alignment line through its divider between the home button and server list. Keep a single scrollable nav with 4px top padding so the 48px home button ends at the 64px line, followed by the divider with the existing gap. Keep 12px bottom padding, the existing spacing between items, and each button's styling and behavior. The rail has no distinct header element or container.

### D2. Use two 8px corner cuts over the existing palette

Apply an 8px radius only to the server header's top-left corner and the channel list's bottom-left corner. Put `surface-container-lowest` on the aside root, and explicitly retain `surface-container-low` on the header and list. No other radius, inset, border, or shadow is added to those surfaces. In dark mode, the revealed backdrop is darker than the list; in light mode it is lighter. Both cuts remain visible with existing tokens. Keep fallback and other sidebar content legible against the changed root tone.

### D3. Span the combined navigation with one elevated user card

Move the existing `UserPanel`-equivalent card out of `Sidebar.tsx` and render it in `AppShell.tsx` as a sibling of `ServerRail` and the active `Sidebar` or `SettingsSidebar`. Make their shared flex wrapper (`AppShell.tsx:50-61`) `position: relative` and position the card absolutely at `left: 0; right: 0; bottom: 0`. Its width then follows the combined rail and sidebar, including whichever sidebar variant is active, without changing either column's width or hardcoding their combined width. Give the card 8px side and bottom margins, at least 8px clear space above it, 12px corners, `surface-container-high`, and `shadow-floating`. Keep `surface-container-lowest` behind the navigation and `surface-container-low` on the header and channel list.

Measure the card's actual rendered height with a `ResizeObserver` on its element and write it to `--user-card-height` on the shared wrapper. Consume that property as bottom padding in both independently scrollable lists: the `ServerRail.tsx` nav and the `Sidebar.tsx` channel list. Include the card's bottom offset and at least 8px clearance in the reserved space so the last server icon and channel can scroll fully above the card, even when a call makes it taller. Preserve the rail's existing 12px bottom padding from D1. Follow the repo's observer lifecycle patterns: `ChannelPage.tsx:275-280` observes a content element and disconnects on cleanup; `GridView.tsx:29-42` reads `contentRect`, rebinds when its element changes, and disconnects on cleanup. Handle any sidebar variant's scrollable content in the same shared-card layout.

Keep the compact identity row at the card's bottom: a 32px avatar with a 10px presence dot whose ring matches `surface-container-high`, a truncating 12px display name in the existing display font and `on-surface`, and a truncating 11px `@handle` in the existing mono font and `on-surface-variant`. Leave room for the trailing settings button, which is the only idle-state control and still opens the account menu. During an active call, grow this same card upward for `CallControls` (mic, deafen, camera, screen share, hang up) and connection-quality state; keep identity below them and create no second panel.

The account menu opens upward and remains fully visible. Keep overflow visible on the card and every ancestor between it and the viewport, or use an equivalent positioning strategy that avoids clipping by the card's rounding or the wrapper chain. Keep `surface-container-high` on the account menu. Use `surface-container-highest` for soft control hover highlights and visible keyboard focus; buttons must not translate, scale, or change size on interaction. The existing mobile drawer uses this same `AppShell.tsx` wrapper (`mobile:fixed mobile:bottom-0 mobile:left-0 mobile:top-14`), so the card moves with the drawer and stays inside its bounds; both lists' reserved space continues to track its measured height there.

**Alternative rejected:** keep the card confined to the Sidebar's own column (the previous D3). The product owner wants one surface that reads as part of the whole navigation, including the server rail, rather than just the channel list.

## Risks / Trade-offs

- [The root backdrop change affects fallback or exposed sidebar areas] → check all areas that rely on the root background in both themes and keep text and control contrast intact.
- [Rounded card or an ancestor clips the account popover] → keep the complete positioning chain unclipped, or position the menu outside it, and verify the menu opens fully above the card, including during an active call.
- [Card and control surfaces blend in one theme] → inspect light and dark token combinations and verify hover feedback against the card's new tone.
- [ResizeObserver updates list padding a frame after a call changes card height] → update both lists through the same wrapper property and, where possible, synchronize the first measurement with the reactive call-state update so no visible content jump occurs.
