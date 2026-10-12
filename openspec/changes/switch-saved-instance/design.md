# Design

## Context

See proposal.md for why. `clearInstance` already drops the saved URL and the session token, and `Gate` shows `InstanceConnect` when `baseUrl` is empty. The account menu and the unlock screen already call it after logout. `Auth.tsx` (login and register on the same screen) does not.

## Goals / Non-Goals

**Goals:**

- A native sign-in screen with a saved instance can return to the address screen.
- The same forget-and-return path the account menu already uses.

**Non-Goals:**

- Showing instance selection in the browser build.
- Keeping more than one instance.
- Changing how the address is validated. The existing screen, including the HTTPS assumption from `https-instance-and-invite-link` if that change is applied first, stays the screen the person returns to.

## Decisions

1. **The sign-in screen calls `clearInstance`.** There is no session on that screen, so it does not need logout. `subscribeInstance` already flips the gate back to `InstanceConnect`. Alternative considered: a second address field on the login form. Rejected because the address screen already validates `/health`.

2. **The account menu and unlock stay as they are.** They already log out and then clear the instance. This change does not move that action.

## Risks / Trade-offs

- [The person returns to the address screen and must type the host again] → That is the point of switching. The previous address is not offered as a silent default.

## Migration Plan

No stored migration. An instance already saved keeps working until the person chooses to switch.

## Open Questions

None.
