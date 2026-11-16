# Tasks

## 1. Header height standardization

- [x] 1.1 Give the Sidebar server header a fixed 64px border-inclusive height with centered content and no flex shrink; verify its measured height with and without header actions.
- [x] 1.2 Give `.ch-head` the same fixed, nonshrinking 64px height and change the narrow media rule to horizontal padding only; verify aligned bottom edges beside the Sidebar at desktop and narrow widths.
- [x] 1.3 Give the Members panel header the same fixed, nonshrinking 64px height with centered content and horizontal padding only; verify its bottom edge aligns with the Sidebar and chat headers.
- [x] 1.4 Keep ServerRail as one scrollable nav with 4px top padding and 12px bottom padding, retaining its existing item spacing and button styling; verify the divider after the 48px home button aligns with the Sidebar, chat, and Members panel headers' 64px bottom edges.

## 2. Rounded corners and backdrop

- [x] 2.1 Apply an 8px radius only to the header's top-left and channel list's bottom-left corners; set the aside backdrop to `surface-container-lowest` and the two foreground surfaces to `surface-container-low`. Verify all other corners and edges remain square and flush.
- [x] 2.2 Inspect the two corner cuts and sidebar fallback/content contrast in light and dark themes; verify the revealed backdrop is visible without reducing legibility elsewhere.

## 3. Floating user card

- [x] 3.1 Move `UserPanel` out of `Sidebar.tsx` into `AppShell.tsx`'s relative shared rail/sidebar wrapper and position it absolutely across both columns with 8px side/bottom margins, 12px corners, `surface-container-high`, and `shadow-floating`; verify both sidebar variants keep their widths and the card remains one surface with identity at the bottom, only settings when idle, and call controls plus connection quality when active.
- [x] 3.2 Observe the card's rendered height with `ResizeObserver`, publish it as a shared wrapper CSS property, and reserve its height plus bottom offset and at least 8px clearance in both `ServerRail.tsx` and `Sidebar.tsx` scrollable lists, with a CSS fallback before the first measurement; verify no server icon or channel is hidden in idle and active-call states on desktop or in the mobile drawer, without a visible jump when the card grows.
- [x] 3.3 Keep the account menu opening upward outside the rounded card and any clipping ancestor; verify it is fully visible in idle and active-call states on desktop and in the mobile drawer.
- [x] 3.4 Apply soft `surface-container-highest` hover highlights and visible keyboard focus to the account trigger and call controls without translation, scaling, or size changes; verify card, lists, text, presence ring, and controls remain distinguishable in both light and dark themes.

## 4. Spec validation

- [x] 4.1 Run `openspec validate fix-sidebar-header-alignment-and-user-card --strict` after implementation and verify it reports no errors.
