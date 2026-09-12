# Feature Specification: User Display Name

**Feature Branch**: `099-user-display-name`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Vamos criar uma opção no menu de configurações do usuário para ele criar um \"display name\", que será o nome exibido (mas não é possível alterar o username). Caso o usuário esteja utilizando do display name, no user-panel nós vamos mudar o nome exibido pelo displayname, o único lugar que ele vai poder ver o nome de usuário será em [account-menu-handle / «Ligado como»]."

**Problem**: Users currently only have an immutable **username (handle)** as their visible identity on the user panel. They need a separate **display name** they can set and change for everyday presentation, without being allowed to change the username.

**Goal**: Let the signed-in user set an optional **display name** from their user settings/account menu. When set, that name is the **public presentation name** (user panel for self; members, chat, voice/presence labels for others). The **username** remains immutable and, for the signed-in user’s own chrome, is shown in the account menu under **«Ligado como» / signed-in-as** (`account-menu-handle`)—not as the user-panel primary name.

## Clarifications

### Session 2026-09-11

- Q: Where does the display name appear for others? → A: **Public (Discord-style)** — members, chat, voice, etc. see the display name; username remains for login + own «Ligado como».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set a display name in user settings (Priority: P1)

As a signed-in user, I want to create or edit a **display name** in my user settings/account menu so I can choose how my name appears, without changing my username.

**Why this priority**: Core capability; without a place to set the name, nothing else works.

**Independent Test**: Open user settings/account menu → set display name → save → reopen and confirm it persisted; confirm there is no control to change username.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I open the user settings/account menu (the same user-facing account area where profile options live), **Then** I can enter or edit a **display name**.
2. **Given** I save a valid display name, **When** I leave and return later (same session or after re-login), **Then** my display name is still the value I saved.
3. **Given** I am in that settings/account UI, **When** I look for a way to change my **username**, **Then** I cannot change it (username is read-only / not editable).
4. **Given** I clear the display name (or leave it empty) and save, **When** the profile updates, **Then** the product treats me as having **no** display name (falls back to username for display rules below).

---

### User Story 2 - User panel shows display name (Priority: P1)

As a signed-in user with a display name set, I want the **user panel** primary name to show my **display name** so the bar reflects the name I chose.

**Why this priority**: Explicit product requirement for the main self-identity chrome.

**Independent Test**: Set display name → confirm user-panel primary label shows display name; clear display name → confirm it shows username again.

**Acceptance Scenarios**:

1. **Given** I have a non-empty display name, **When** I look at the user panel identity (primary name line), **Then** that line shows my **display name** (not the username).
2. **Given** I have no display name (empty/cleared), **When** I look at the user panel primary name, **Then** it shows my **username** (current behavior).
3. **Given** my display name is long, **When** space is tight, **Then** truncation/ellipsis may apply but a recognizable portion of the display name remains (same readability expectations as today’s handle on the panel).

---

### User Story 3 - Own username only under «Ligado como» (Priority: P1)

As a signed-in user who uses a display name, I want to still see my **username** in the account menu under **«Ligado como» / signed-in-as** (`account-menu-handle`), and not as the user-panel primary label, so I can confirm which account I am on.

**Why this priority**: Explicit placement for the immutable username in self-chrome.

**Independent Test**: With display name set, open account menu → «Ligado como» shows username; user panel still shows display name.

**Acceptance Scenarios**:

1. **Given** I have a display name set, **When** I open the account menu, **Then** the `account-menu-handle` / signed-in-as block shows my **username** (e.g. «Ligado como» + handle).
2. **Given** I have a display name set, **When** I look at the user panel primary name, **Then** I do **not** see the username there—I see the display name.
3. **Given** I have no display name, **When** I open the account menu, **Then** signed-in-as still shows my username (unchanged).

---

### User Story 4 - Others see the display name where member names appear (Priority: P2)

As another participant in a server/call/chat, when a member has set a display name, I want to see that **display name** in the usual places that show a person’s name, so the name they chose is what the table sees.

**Why this priority**: Confirmed public scope; completes identity presentation beyond self chrome.

**Independent Test**: User A sets display name; User B checks member list, message author, and voice/presence label for A and sees display name (not username).

**Acceptance Scenarios**:

1. **Given** A has a non-empty display name, **When** B views A in member-facing name surfaces (member list, chat authorship, voice/presence labels), **Then** B sees A’s **display name**, not A’s username.
2. **Given** A has no display name, **When** B looks at A on those surfaces, **Then** B sees A’s **username** as today.
3. **Given** A has a display name, **When** A opens their own account menu, **Then** «Ligado como» still shows A’s **username** (self-only username chrome unchanged).

---

### Edge Cases

- Empty / whitespace-only display name → treat as unset; fall back to username on user panel **and** for peers.
- Very long display name → allow truncation with ellipsis on compact surfaces; full value editable in settings.
- Display name equal to another user’s display name → allowed (display names need not be unique); usernames remain unique login identifiers.
- Special characters / emoji → allowed within a reasonable length limit defined at planning (product: readable label, not a second login id).
- i18n: signed-in-as label stays localized («Ligado como» / English equivalent); username and display name strings themselves are not translated.
- Welcome / system messages that name a member SHOULD use the same public display rule (display name when set).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create, edit, and clear an optional **display name** from the signed-in **user settings / account menu** (user-facing account configuration, not server settings).
- **FR-002**: Users MUST **not** be able to change their **username** through this feature (or any new control introduced here).
- **FR-003**: When a non-empty display name is set, the **user panel** primary identity name MUST show the **display name**.
- **FR-004**: When no display name is set, the user panel primary identity name MUST show the **username** (existing behavior).
- **FR-005**: For the signed-in user’s own account menu, the **signed-in-as / `account-menu-handle`** block MUST show the **username**, including when a display name is set.
- **FR-006**: With a display name set, the user panel primary name MUST NOT show the username (username for self is reserved to signed-in-as in this chrome).
- **FR-007**: Display name MUST persist across sessions for that account until changed or cleared.
- **FR-008**: When a non-empty display name is set, **other participants** MUST see that display name wherever the product shows that user’s name (member list, chat authorship, voice/presence labels, and similar member-facing surfaces), falling back to **username** when unset.
- **FR-009**: Display names are **not** required to be unique across accounts.
- **FR-010**: Mentions / @-addressing MAY continue to resolve by **username** for unambiguous targeting; the **visible** label next to a mentioned person SHOULD follow the public display-name rule when a display name is set (planning may refine autocomplete copy).

### Key Entities

- **Username (handle)**: Immutable login/account identifier; unique; shown to self under signed-in-as.
- **Display name**: Optional, user-editable **public** presentation name; when set, used on the user panel for self and on member-facing surfaces for others.
- **User panel primary identity**: The main name line on the bottom user bar for the signed-in user.
- **Signed-in-as block**: Account menu region (`account-menu-handle`) showing «Ligado como» / equivalent + username.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can set a display name and see it on the user panel within one settings save (no reload ritual beyond normal UI update)—verified in a single-browser pass.
- **SC-002**: With display name set, **100%** of checks show: user panel = display name; account-menu signed-in-as = username.
- **SC-003**: Clearing the display name restores username on the user panel in the same session.
- **SC-004**: Attempting to change username via this feature is impossible (no editable username field)—verified by UI review.
- **SC-005**: After re-login, the saved display name still applies (persistence check).
- **SC-006**: In a two-browser check, after A sets a display name, B sees A’s display name on at least member list and chat authorship (or equivalent voice label if in call)—**not** A’s username—within one refresh of membership/chat UI.

## Assumptions

- “Username” = existing account **handle**; “display name” = new optional presentation field.
- Editing happens in the **user account/settings menu** reachable from the user panel (alongside existing profile options such as profile photo), not in server admin settings.
- Empty display name means “use username for display” (self and peers).
- Display name is **public** (Discord-style): peers see it on member-facing name surfaces; username remains login id + own signed-in-as.
- Mentions / @-autocomplete may still key off username for addressing; visible labels follow display name when set (FR-010).
- Length limits and validation messages are planning details; product requires a readable, non-empty-when-set label.
