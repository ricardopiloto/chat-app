---
name: Campfire Modernism
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#363943'
  surface-container-lowest: '#0b0e17'
  surface-container-low: '#181b24'
  surface-container: '#1c1f29'
  surface-container-high: '#272a33'
  surface-container-highest: '#32343e'
  on-surface: '#e0e2ef'
  on-surface-variant: '#dbc1ba'
  inverse-surface: '#e0e2ef'
  inverse-on-surface: '#2d303a'
  outline: '#a38b86'
  outline-variant: '#55423e'
  surface-tint: '#ffb4a1'
  primary: '#ffb4a1'
  on-primary: '#5d1805'
  primary-container: '#e07a5f'
  on-primary-container: '#5b1604'
  inverse-primary: '#9a442d'
  secondary: '#6bdc96'
  on-secondary: '#00391d'
  secondary-container: '#2ca464'
  on-secondary-container: '#003118'
  tertiary: '#d1bcff'
  on-tertiary: '#3c0090'
  tertiary-container: '#a680fd'
  on-tertiary-container: '#3b008c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#7c2e19'
  secondary-fixed: '#88f9b0'
  secondary-fixed-dim: '#6bdc96'
  on-secondary-fixed: '#00210f'
  on-secondary-fixed-variant: '#00522c'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#24005b'
  on-tertiary-fixed-variant: '#5429a6'
  background: '#10131c'
  on-background: '#e0e2ef'
  surface-variant: '#32343e'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  label-ui:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a warm, authentic, communal atmosphere that reimagines real-time digital gatherings. It departs completely from juvenile neon gaming tropes and detached, sterile corporate SaaS. The aesthetic centers on the intimacy of gathering around an illuminated physical table—bringing together tabletop roleplaying groups, craft-oriented guilds, and privacy-conscious communities.

The emotional signature balances artisanal tactile warmth with unyielding cryptographic rigor. Trust is conveyed not through clinical sterility, but through crystalline clarity: end-to-end encryption signatures, self-hosted server status, and peer verification feel like physical hallmarks struck into metal.

Visually, the system operates as a tactile-minimalist hybrid. It uses deep obsidian and ember-lit charcoal base tones, delicate sub-pixel borders, restrained campfire terracotta focal points, and deliberate monospaced verification telemetry. Interfaces feel like polished instruments crafted for endurance, camaraderie, and sustained evening sessions.

## Colors

The palette is engineered around long viewing sessions in low-light environments, prioritizing optical comfort without sacrificing punch and legibility.

### Surface System
- **Dark Mode (Default):**
  - Canvas / Foundation: `#0F1117`
  - Base Shell / Sidebars: `#161922`
  - Elevated Cards & Panes: `#1E222D`
  - Floating Overlays & Modals: `#282E3D`
  - Interactive Hover Tier: `#32394B`
- **Light Mode:**
  - Canvas: `#FDFBF7` (Warm Alabaster)
  - Base Shell / Panels: `#F4EFEB`
  - Elevated Cards: `#E8E1D9`
  - Floating Overlays: `#FFFFFF`

### Accent & Semantic Energy
- **Terracotta Firelight (`#E07A5F` dark / `#C85A3B` light):** Drives interactive primaries, call-to-action buttons, active radio triggers, and unread notification pips.
- **Cryptographic Emerald (`#48BB78` dark / `#276749` light):** Reserved strictly for security assurance, active E2EE lock status, and active user presence.
- **Surveillance Alert / Danger (`#E53E3E`):** Micro-dosed for unencrypted channel fallbacks, destructive commands, and peer disconnects.
- **Stage & Stream Violet (`#805AD5`):** Denotes active video canvas sharing, tabletop projection cameras, and RTMP feeds.

### Text & Contrast Rules
- Canvas text strictly follows warm ivory scaling: Primary text `#F7FAFC`, Secondary `#E2E8F0`, Muted UI labels `#94A3B8`, and Disabled/Dormant markers `#64748B`.
- Never use pure black (`#000000`) for fills or pure white (`#FFFFFF`) for text in dark mode; maintaining warm sub-tones prevents visual fatigue during multi-hour voice calls.

## Typography

The typography pairs humanistic warmth with technical precision. 

- **Plus Jakarta Sans** provides structural character to community banners, server titles, voice room channels, and modal headers. Its geometric terminals feel friendly and grounded.
- **Inter** handles high-density text streams, message logs, and member rosters. It ensures rapid scan-readability across message timestamps, usernames, and multi-line body text.
- **JetBrains Mono** serves as the system's trust signature. It handles cryptographic fingerprints, public keys, latency readouts, bitrate badges, and server commit hashes.

### Rules of Usage
- Use tabular figures for numeric data, ping readouts, and timestamps to eliminate UI jitter during live state changes.
- Never uppercase body copy. Uppercase styling is permitted only for micro category headers (`label-ui`) and cryptographic fingerprint strings with extended letter-spacing (`+0.05em`).

## Layout & Spacing

The structural layout utilizes a persistent 3-to-4 column app-shell architecture with rigid spatial predictability:
1. **Server/Hub Strip:** Fixed 72px rail.
2. **Channel & Tactical Navigation:** Collapsible 240px drawer.
3. **Primary Stage/Stream Area:** Fluid viewport accommodating dynamic voice grids, tabletop video boards, or scrollable message feeds.
4. **Context / Inspector Rail:** 280px drawer for member rosters, active E2EE key inspections, or session dice logs.

### Responsive Breakpoints
- **Mobile (< 768px):** Single-column canvas with a bottom navigation bar for quick channel switches. Overlays and roster lists manifest as bottom-anchored modal sheets.
- **Tablet (768px - 1024px):** Compacted 2-column view; channel drawer slides in as a frosted panel.
- **Desktop (1025px+):** Full 4-column arrangement. Content within the stream feed scales fluidly with an 8px vertical rhythm. Message groupings clamp tightly using `space-xs` (4px) between sequential messages and `space-md` (16px) between unique author clusters.

## Elevation & Depth

Depth is defined by physical layering and warm ambient occlusion rather than synthetic drop shadows.

### The Layering Stack
- **Base Level (`#0F1117`):** The ground plane on which the application rests.
- **Sidebar Level (`#161922`):** Grounded lateral planes defined by a 1px right border (`rgba(255, 255, 255, 0.05)`).
- **Surface Level (`#1E222D`):** Chat message bubbles, video tiles, and table-grid canvas containers.
- **Floating Level (`#282E3D`):** Modals, context menus, tooltips, and picture-in-picture player docks.

### Shadow Crafting
Shadows are rendered with multi-stop diffusion tinted with obsidian and umber tones rather than raw grey:
- **Floating Overlays & Context Menus:** `0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)`.
- **Active Video Stage Focus:** `0 12px 32px -4px rgba(15, 17, 23, 0.8), 0 0 0 1px rgba(224, 122, 95, 0.25)`.
- **Backdrop Treatments:** Modals and callouts leverage an 8px backdrop blur (`backdrop-filter: blur(8px)`) over an 80% opacity backing tint to preserve visual context of the video stream underneath.

## Shapes

The shape system expresses an organic yet measured geometry. 

- **Containers & Stage Tiles:** Fixed at `0.5rem` (8px) to `0.75rem` (12px), balancing screen density with tactile approachability.
- **Badges, Status Chips & Pills:** True pill forms (`9999px`) provide clear semantic separation from square video streams and blocky chat surfaces.
- **Server Icons:** Smooth squircle transforms transitioning from circular (`50%`) to soft rounded rect (`30%`) on active/hover states.

## Components

### Buttons & Interactive Controls
- **Primary Action:** Solid warm terracotta (`#E07A5F`) fill with dark contrast typography (`#0F1117`). High tactile response with subtle inset top-edge highlight (`1px inset rgba(255, 255, 255, 0.2)`).
- **Secondary Action:** Transparent base with a 1px border (`rgba(255, 255, 255, 0.12)`), transitioning to background `#1E222D` on hover.
- **Ghost/Tertiary:** No border, `#E2E8F0` text, filling with `#282E3D` on mouseover.

### Chat & Message Feed
- **Message Cards:** Compact layout without borders. On mouseover, surfaces tint to `rgba(255, 255, 255, 0.02)` with a pinned hover quick-reaction bar elevated above the top right corner.
- **System / Trust Event Cards:** Framed in a 1px border styled with low-opacity emerald (`rgba(72, 187, 120, 0.2)`) and backfilled with `#161922`.

### Video & Voice Grid Components
- **Peer Video Tile:** Aspect ratio 16:9 or 4:3 (optimized for tabletop maps). Encased in `#1E222D` with 8px radius.
- **Speaking State:** Active speakers display an animated warm amber/terracotta border pulse (`2px solid #E07A5F`) accompanied by a subtle internal edge glow (`box-shadow: inset 0 0 12px rgba(224, 122, 95, 0.3)`).
- **Mute / Deafen Indicators:** Small, pill-shaped red badges positioned at bottom-right of video frames with high-contrast glyphs.

### Cryptographic & E2EE Indicators
- **Encrypted Channel Shield:** Integrated directly in the channel header. Displays a solid pill containing a green lock icon paired with the short hash fingerprint in `JetBrains Mono`. Clicking opens the key verification popover.
- **Key Verification Popover:** High-elevation popover presenting the safety number QR matrix and 6 groups of 5-digit numbers with visual segmenting.

### Inputs & Form Fields
- **Input Fill:** Surface `#161922` paired with a default 1px border of `rgba(255, 255, 255, 0.08)`.
- **Focus State:** Transitions smoothly to a border of `#E07A5F` with an outer glow of `0 0 0 3px rgba(224, 122, 95, 0.15)`. No harsh browser outlines.
- **Chat Input Bar:** Rich multiline input containing left-aligned media upload action and right-aligned E2EE state lock and whisper triggers.