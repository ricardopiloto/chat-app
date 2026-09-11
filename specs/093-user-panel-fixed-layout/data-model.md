# Data Model: 093 User Panel Fixed Layout

**Feature**: [spec.md](./spec.md)  
**Scope**: Presentation-only. No persistence or API entities.

## Entities (UI)

### UserPanelLayout

| Field | Type | Notes |
|-------|------|-------|
| mode | `"stacked"` | Always stacked after 093; no `"single"` mode |
| upperRowVisible | boolean | `true` when ≥1 upper-row control is visible |
| channelLabel | `string \| null` | Display name to show; `null`/empty → omit |

### ChannelLabelSource (derived)

| Priority | Condition | Value |
|----------|-----------|--------|
| 1 | `voice.live() === true` | Voice call channel display name (`VoiceSession.channelName`) |
| 2 | Else, open/selected channel exists | That channel’s `name` |
| 3 | Else | Absent (empty middle region) |

### UserPanelControlVisibility (unchanged product rules)

| Control | Typical visibility (current product) |
|---------|--------------------------------------|
| Leave | When `voice.live()` |
| Mic | Panel control (existing rules; often always shown) |
| Deafen | Existing rules |
| Camera | Existing rules |
| Screen share | When live and Grade view mode (existing) |
| Settings | Always on lower row |

093 does **not** change these rules—only placement permanence and empty-row collapse.

## Relationships

```text
VoiceSession.live + channelName ──┐
                                   ├──► ChannelLabelSource ──► UserPanelLayout.channelLabel
Sidebar open channel name ─────────┘

UserPanelControlVisibility ──► upperRowVisible ──► collapse or show calls row
```

## Validation / invariants

- Settings never appears in the upper control row.
- Channel label is never a navigation target.
- Label text has no mandatory type prefix.
- While live, browsing another route channel must not replace the call channel label.
- After hangup, label reverts to open/selected channel or empty.
- Taller panel reflows shell-nav; no overlay.

## State transitions

```text
[idle, no channel]  label=""  upper=per icon rules
       │ open channel
       ▼
[idle, channel X]   label=X
       │ join call on voice V
       ▼
[live on V]         label=V   (even if viewing text T)
       │ hangup while viewing T
       ▼
[idle, channel T]   label=T
```

No server-side state machine.
