# Contract: Header blur select (081)

**Feature**: [081-panel-cam-header-blur](../spec.md)  
**Scope**: Voice pane `.pane-header` while live. Reuses blur preference store.

## MUST

| ID | Rule |
|----|------|
| HB-01 | While live on the voice pane, header MUST show a select with exactly three options: none, light blur, strong blur |
| HB-02 | Changing the select MUST persist the product blur preference |
| HB-03 | When camera is on, changing the select MUST apply (or clear) blur on local video when supported |
| HB-04 | When camera is off, changing the select MUST still update preference for later apply |
| HB-05 | Blur MUST NOT be controlled from the user-panel camera button |

## Non-goals

- Popup/chevron blur menu on the panel
- Blur controls on pre-join (removed)
