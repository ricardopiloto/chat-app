# Contract: User panel fixed stacked layout (093)

**Feature**: [093-user-panel-fixed-layout](../spec.md)  
**Scope**: Frontend shell `UserPanel` + CSS. No HTTP API.  
**Supersedes (layout mode)**: Dynamic stack/unstack from [084](../../084-user-panel-stack/contracts/user-panel-stack.md). **Keeps**: Settings on identity row; shell-nav reflow when panel is taller.

## Layout — always (when upper controls visible)

```text
              [ leave? mic deafen cam screen? ]     ← centered upper row
[ identity: avatar+dot | handle / online ] [ channel name? ] [ settings ]
```

## Layout — no upper controls visible

```text
[ identity: avatar+dot | handle / online ] [ channel name? ] [ settings ]
```

(No reserved empty upper strip.)

## MUST

| ID | Rule |
|----|------|
| UPF-01 | Panel MUST use stacked two-row structure whenever any upper-row control is visible; MUST NOT switch to single-row Discord crush layout based on overflow/name width |
| UPF-02 | Call/action controls (leave, mic, deafen, cam, screen, … except Settings) MUST render only on the **upper** row when visible |
| UPF-03 | **Settings** MUST remain on the **lower** row with identity; MUST NOT move to the upper row |
| UPF-04 | When **no** upper-row controls are visible, the upper row MUST **collapse** (FR-011) |
| UPF-05 | Existing icon **visibility** rules MUST remain; only placement permanence changes |
| UPF-06 | Increasing panel height MUST **reflow** `.shell-nav`; absolute overlay over the channel list is forbidden |
| UPF-07 | Account menu via identity and via Settings MUST keep working |
| UPF-08 | Overflow measure / hysteresis that toggled stacked vs single-row (084) MUST be removed or inert |

## Non-goals

- Backend / LiveKit / occupancy API changes
- Redesign of which call actions exist
- Making the channel label a navigation control (see [panel-channel-label.md](./panel-channel-label.md))
