# Contract: Channel collapse deferred (078)

**Feature**: [078-user-panel-discord](../spec.md)  
**Scope**: Shell channel list visibility. Parks [055](../../055-channels-rail-drawer/) redesign.

## MUST

| ID | Rule |
|----|------|
| CC-01 | No “hide channels” / collapse control in the live sidebar UI |
| CC-02 | Channel list always presents in normal expanded width/position |
| CC-03 | Shell MUST NOT apply a product `channels-collapsed` experience (peek drawer behind rail) |
| CC-04 | Legacy `mesa.channelsListExpanded` (or equivalent) MUST NOT restore a collapsed list |
| CC-05 | Collapse/drawer redesign is out of scope; document as backlog only |

## MAY

- Clear the legacy preference key when convenient
- Delete unused collapse CSS/i18n strings in the same delivery

## Non-goals

- Implementing a new hide/peek interaction
- Keeping a hidden feature flag that re-enables 055 drawer
