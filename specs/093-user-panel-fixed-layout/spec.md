# Feature Specification: User Panel Always Stacked with Channel Label

**Feature Branch**: `093-user-panel-fixed-layout`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Vamos ajustar o layout do user panel para ficar permanentemente no estilo que ele assume quando há uma chamada em andamento. As regras de exibição de ícone continuam a valer, porém, a movimentação (da parte de baixo para linha superior) não existirá mais, os ícones ficarão sempre na linha superior, com exceção do ícone de configuração. No espaço vazio entre o nome do usuário/status e o ícone de configuração, nós vamos exibir o canal atual aonde o usuário está, se ele não estiver em nenhum canal, nós vamos deixar vazio."

**Related**: [084-user-panel-stack](../084-user-panel-stack/) (dynamic overflow stacking — superseded for layout mode), [078-user-panel-discord](../078-user-panel-discord/), call controls on panel ([080](../080-call-controls-restore/)–[082](../082-screen-share/)).

## Clarifications

### Session 2026-09-11

- Q: Que canal mostrar no painel (em chamada vs a ver outro canal)? → A: **Voz da chamada** se live; senão o canal **aberto/seleccionado** (Option C).
- Q: O nome do canal no painel é clicável? → A: **Só leitura** — sem acção de clique (Option A).
- Q: Formato do nome do canal no painel? → A: **Só o nome** do canal (sem prefixo `#` / ícone de tipo obrigatório) (Option A).
- Q: Linha superior sem ícones? → A: **Colapsar** a linha superior quando não há controlos visíveis (Option B); não reservar faixa vazia alta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Panel always uses the two-row call layout (Priority: P1)

As a Mesa user, I want the bottom user panel to **always** use the two-row layout that today appears when I am in a call (controls on an upper row; identity on the lower row), so the bar does not jump between one-row and stacked layouts as icons appear or disappear.

**Why this priority**: Core layout change; removes the dynamic “move icons up when crowded” behavior from 084.

**Independent Test**: Observe the user panel while idle (out of call) and while in a call; confirm the two-row structure is present in both cases, with Settings on the identity row.

**Acceptance Scenarios**:

1. **Given** I am signed in and **not** in a voice/video call, **When** I look at the user panel, **Then** control icons that are visible for the idle state sit on the **upper** row (centered as in the current stacked style) when any exist; if none exist, the upper row is collapsed; the **lower** row shows identity (avatar, handle, status) plus Settings on the right.
2. **Given** I am in a call with several controls (mic, deafen, camera, leave, screen share as applicable), **When** I look at the user panel, **Then** those controls remain on the **upper** row and Settings stays on the **lower** identity row — same structure as idle, only which icons appear may change.
3. **Given** icons are shown or hidden according to existing visibility rules (e.g. leave/screen share only in call), **When** the set of visible icons changes, **Then** icons do **not** migrate between the lower and upper rows; only visibility on the upper row changes (Settings never moves to the upper row).

---

### User Story 2 - Current channel label between name and Settings (Priority: P1)

As a Mesa user, I want to see **which channel I am in** in the space between my name/status and the Settings icon, so I can confirm context without scanning the sidebar; if I am not in a channel, that space stays empty.

**Why this priority**: New information on the identity row; primary use of the freed horizontal space.

**Independent Test**: Open a text or voice channel (not in call) → label shows that channel; join a voice call then browse another channel → label still shows the **voice call** channel; leave call / no channel → empty.

**Acceptance Scenarios**:

1. **Given** I am **not** in a voice call and I have a current channel open (text or voice), **When** I look at the identity row, **Then** that open/selected channel’s **display name only** (no required type prefix) appears between the name/status cluster and Settings.
2. **Given** I am **in** a voice/video call, **When** I look at the identity row (even if I am viewing a different channel in the main area), **Then** the label shows the **voice channel of the live call**, not a different open text/voice channel.
3. **Given** I am not in a call and not in any channel (no open/selected channel), **When** I look at the identity row, **Then** that middle area is **empty** (no channel name, no mandatory “—” placeholder).
4. **Given** a long channel name, **When** space is limited, **Then** the label may truncate with ellipsis while Settings and the handle remain usable; the channel label MUST NOT push Settings off the panel or crush the handle below a recognizable minimum.
5. **Given** I switch open channels while **not** in a call, **When** the main view updates, **Then** the panel label updates to the newly selected channel without a page refresh.
7. **Given** the channel label is visible, **When** I activate/click it, **Then** nothing navigates or opens—it remains informational only (identity and Settings still work as today).

---

### User Story 3 - Icon rules and account entry unchanged (Priority: P2)

As a Mesa user, I want existing icon show/hide rules and account/settings entry to keep working after the permanent layout change, so stacking and the channel label do not break call or account flows.

**Why this priority**: Guardrails around existing panel behavior.

**Independent Test**: Idle vs in-call icon sets match today’s rules; Settings and identity still open account options.

**Acceptance Scenarios**:

1. **Given** idle vs in-call states, **When** I compare which control icons appear, **Then** visibility matches current product rules (only placement is fixed to the upper row except Settings).
2. **Given** Settings is shown, **When** I activate it, **Then** the same account/settings path works as today.
3. **Given** I activate the identity region, **When** the account menu is available, **Then** it opens as today.

---

### Edge Cases

- No visible upper-row icons: **collapse** the upper row (do not reserve a tall empty band); lower identity + Settings (+ channel label when present) still show. When icons are visible, they remain on the upper row only (except Settings). Do not revert to the old single-row Discord crush layout that mixed controls beside the name.- Very long handle + long channel name: prioritize readable handle and reachable Settings; channel label truncates first if needed.
- Narrow sidebar: taller two-row panel continues to **reflow** content above (push/shrink channel list)—must not overlay the list (same shell rule as 084).
- Rapid channel switches / hangup: label updates promptly; no stale voice-channel name after leaving a call; while live, browsing another channel MUST NOT replace the voice-call label.
- Reduced motion: layout is structural, not a required animation.
- Listen-only / disabled controls: disabled appearance preserved on the upper row.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The user panel MUST use the **stacked** layout language of the in-call style: when control icons are visible, they appear on an **upper** row; the identity cluster and Settings remain on the **lower** row. When **no** upper-row controls are visible, the upper row MUST **collapse** (no reserved empty tall strip)—identity + Settings (+ channel label) still show without migrating controls beside the name.
- **FR-002**: Control icons MUST NOT move between the lower and upper rows based on overflow or call state; only **which** icons are visible may change per existing rules.
- **FR-003**: The Settings control MUST remain on the **lower** identity row (right side), never on the upper control row.
- **FR-004**: Existing icon **visibility** rules (when mic, deafen, camera, leave, screen share, etc. appear) MUST remain in force; this feature changes placement permanence, not those rules.
- **FR-005**: Between the name/status cluster and Settings, the panel MUST show a channel **display name only** (no mandatory `#` / type icon prefix) when applicable: if the user is **in a live voice/video call**, show the **call’s voice channel** name; otherwise show the **open/selected** channel name; if neither applies, that region MUST be empty.
- **FR-006**: The channel label MUST update when the live call channel or the open/selected channel (per FR-005) changes—including reverting after hangup.
- **FR-007**: Identity activation and Settings MUST continue to provide the same account entry paths as today.
- **FR-008**: When the two-row panel is taller than a former single-row bar, surrounding chrome MUST **reflow** (content above cedes space); the panel MUST NOT overlay the channel list.
- **FR-009**: The product MUST stop using overflow-based layout switching (name-width / icon-count triggers that moved icons between rows) as the driver of panel structure—structure is always stacked as above.
- **FR-010**: The channel label MUST be display-only: activating/clicking it MUST NOT navigate or open UI chrome (identity and Settings remain the account entry paths).
- **FR-011**: An empty upper control row MUST **collapse** rather than reserve the full in-call upper-row height.

### Key Entities

- **User panel**: Bottom bar with identity, optional channel label, Settings, and upper-row controls.
- **Current channel (label source)**: If live in a voice/video call → that call’s voice channel; else → the open/selected channel in the app; else → absent (empty label).
- **Control icon set**: Mic, deafen, camera, leave, screen share, and any other panel actions subject to existing visibility rules (excluding Settings).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In **5/5** reviews (idle and in-call), visible control icons (except Settings) appear only on the upper row when present; Settings stays on the lower row; icons never migrate mid-session between rows; when no upper icons, the upper band is collapsed (not a tall empty gap).
- **SC-008**: With zero upper-row icons, reviewers do not see a reserved empty upper strip in **100%** of checks (FR-011).

- **SC-002**: With an applicable channel (open/selected when idle, or voice-call channel when live), **100%** of quickstart checks show that channel’s name between name/status and Settings.
- **SC-003**: With no applicable channel (not live and no open/selected channel), **100%** of checks show an empty middle region (no invented placeholder required).
- **SC-004**: Switching open channels while idle, and hangup after a call, update the label correctly in **100%** of trials without full app reload; while live, browsing another channel leaves the **voice-call** label in **100%** of checks.
- **SC-005**: Icon visibility for idle vs in-call still matches prior product rules in a side-by-side checklist (placement-only change).
- **SC-007**: Activating the channel label does not navigate or open UI chrome in **100%** of checks (FR-010).

## Assumptions

- “Current channel” for the label follows clarify Option C: **voice channel of the live call** when in a call; otherwise the **open/selected** channel; empty if neither.
- Upper-row icon alignment remains centered (same visual language as today’s stacked-in-call style).
- Channel label is display-only (not clickable); text is the channel **display name only** (no mandatory type prefix); truncation with ellipsis is allowed.
- This feature **supersedes** 084’s dynamic stack/unstack for controlling row placement; reflow-when-taller and Settings-on-identity-row from 084 remain as constraints.
- No new account or permission model; display-only layout + channel name surfacing.
