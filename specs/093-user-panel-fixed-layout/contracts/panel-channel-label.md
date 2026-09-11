# Contract: Panel channel label (093)

**Feature**: [093-user-panel-fixed-layout](../spec.md)  
**Scope**: Display-only channel name on the user panel identity row.

## Placement

```text
… [ handle / status ]  [ CHANNEL LABEL ]  [ settings ]
```

Between the name/status cluster and Settings on the **lower** row.

## MUST

| ID | Rule |
|----|------|
| PCL-01 | If user is in a **live** voice/video call, label MUST show that call’s voice channel **display name** |
| PCL-02 | Else if an **open/selected** channel exists, label MUST show that channel’s **display name** |
| PCL-03 | Else the middle region MUST be **empty** (no required placeholder like “—”) |
| PCL-04 | Label text MUST be the channel name **only** (no mandatory `#` or type icon prefix) |
| PCL-05 | Label MUST be **read-only** — click/activate MUST NOT navigate or open chrome (FR-010 / SC-007) |
| PCL-06 | While live, browsing another channel in the main pane MUST **not** replace the call channel label |
| PCL-07 | After hangup, label MUST update to open/selected channel or empty without full reload |
| PCL-08 | Long names MAY ellipsis; MUST NOT push Settings off-panel or crush the handle below a usable minimum |

## Non-goals

- Click-to-jump to channel
- Showing server name or instance host in this slot
- Replacing `.user-panel-status` (“Online”) with the channel name
