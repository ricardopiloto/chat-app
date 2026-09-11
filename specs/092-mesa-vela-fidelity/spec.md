# Feature Specification: Mesa à Vela — Prototype Fidelity Reskin

**Feature Branch**: `092-mesa-vela-fidelity`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: As a frontend developer and UI/UX designer, analyze `docs/design-ref/mesa-ui-prototype.html` and `docs/layout-review-01.md` and create a spec to **replicate exactly the same design** as the new prototype across the whole application; include backend adjustments only if required for the new layout. **Keep** from current design the user-panel behavior that **moves call controls upward** while the user is in a call (stacked controls / reflow).

**Visual source of truth**: [docs/design-ref/mesa-ui-prototype.html](../../docs/design-ref/mesa-ui-prototype.html)  
**Token / system mapping PRD**: [docs/layout-review-01.md](../../docs/layout-review-01.md)  
**Related prior work**: abandoned apply ([089](../089-mesa-a-vela-reskin/)), revert ([090](../090-revert-mesa-vela/)); **preserve** [084-user-panel-stack](../084-user-panel-stack/).

---

## Clarifying what this feature is (and is not)

| Stakeholder intent | Implication |
|--------------------|-------------|
| Replicate the prototype design “exactly” | Product UI must **match the prototype’s visual language and chrome decisions** (amber/jade parchment, Fraunces/Manrope roles, rail/sidebar/voice/text/auth treatments, voice-header `⋯`) as judged by side-by-side review—not a loose “inspired by” pass |
| Respect Mesa’s design system | Implement via **Nocturne + Mesa tokens** and self-hosted fonts (PRD §0)—**not** dumping prototype CSS or loading Google Fonts CDN |
| Affects the whole application | Shell, voice, text, auth, and uncovered screens (settings/members/dialogs/toasts) must look coherent under the new identity |
| Keep current user-panel call stacking | **Do not regress** [084](../084-user-panel-stack/): when in-call controls would crush the handle, controls move to a **centered upper row** and the taller panel **reflows** the channel list upward |
| Backend only if needed | Prefer **frontend-only** identity/chrome work; backend changes only when a prototype-visible product state has **no existing data path** |

---

## What we keep from the current product (explicit)

These behaviors and structures **MUST remain** after the reskin:

1. **User panel stack (084)** — When a single row would leave the display name below the minimum readable width (typically while connected to a call with many icons), call/action controls move to a **centered upper row**; Settings stays on the identity row; taller panel **pushes** `.shell-nav` / channel list upward (no overlay). Idle few-icon layout may stay single-row.
2. **Information architecture** — Server rail + sidebar + main pane + optional members panel nesting stays; no Discord IA rewrite; no relocating stage into a new shell track.
3. **Non-visual feature outcomes** already shipped (screen share, unified Grade, spotlight layout, unload leave, clear ended screen tile, etc.) — visual restyle only unless a FR below says otherwise.
4. **Theme toggle mechanism** — Existing light/dark `data-theme` control remains; values are recalculated to the prototype palette.
5. **Danger semantics** — True danger/alert red stays danger (not recolored to amber).

---

## Gap analysis — current product vs prototype / PRD

### Identity & tokens

| Area | Current (post-090) | Prototype / desired |
|------|--------------------|---------------------|
| Primary accent | Blurple | Ember/amber seeds (`#D98A3D` / `#F0A452`; light deeper) |
| Surfaces / text | Cool nocturne greys | Parchment/ink candlelit table (dark `#14121A` / `#EDE6DC`; light `#F8F2E6` / `#241C14`) + rail/outer depth from prototype |
| Security / E2EE | Lavender accent-2 / primary wash | Jade (`#5CB394` / light `#2C8A69`) for E2EE and related security cues |
| Typography | Inter only | Fraunces = place; Manrope = UI; Inter may remain self-hosted fallback |
| Font loading | Self-hosted Inter | Same pattern for Fraunces + Manrope **woff2**; **no** Google Fonts CDN |
| Camera seats | Generic tiles | Five seat tones (ember/plum/slate/wine/umber), nameplate, `--radius-token` ~20px frames |
| Speaking | Accent aura | Amber ember-ring pulse; **static** under reduced motion |

### Shell & chrome

| Surface | Current | Prototype |
|---------|---------|-----------|
| Server rail | Blurple-era active/unread | Ember active pill, parchment active marker, jade voice occupancy dot |
| Sidebar sections | Uppercase tracked labels | Weight 700 + ember icon; not shared uppercase |
| Active text channel | Accent wash | Ember wash + ember edge marker |
| Active voice channel row | Product styles | Jade wash / jade border emphasis when in that channel (prototype) |
| Nested roster | Existing | Mini tokens; speaking ring on avatar; mic on/off color cues |
| User panel chrome | Discord-like; **stack behavior keep** | Restyle to parchment card / controls; **stack behavior preserved** |

### Voice / text / auth

| Surface | Current | Prototype |
|---------|---------|-----------|
| Voice header | Editar cena + blur free-standing | Default: title, Composição/Grade, Members, `⋯`, E2EE; blur + Editar cena **inside `⋯`** |
| Grade / Composition | 082–086 behavior | Seat visuals only; screen-share fit/spotlight rules stay |
| Text composer | Rectangular wrap | Pill bar + circular send |
| Messages | Current | Avatar token treatment, day separator restyle |
| Auth | Two-column | Tokens + Fraunces brand; structure unchanged |

### Backend / data

Prototype is static HTML. Product already exposes occupancy, speaking, `screen_on`, E2EE state, themes. **Default: no new APIs or migrations.** If during plan/implement a prototype indicator cannot be fed by existing data, add the **minimal** backend field/event—and only then.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Whole app matches Mesa à Vela prototype identity (Priority: P1)

As a Mesa user, I want every primary surface (shell, voice, text, auth) in light and dark to look like the approved candlelit Mesa à Vela prototype—not the old blurple look—so the product feels intentional and consistent.

**Why this priority**: Core fidelity ask.

**Independent Test**: Side-by-side (or sequential) compare prototype screens vs product for palette, type roles, rail/sidebar/voice/text/auth; toggle themes.

**Acceptance Scenarios**:

1. **Given** dark theme, **When** I view shell + main panes, **Then** surfaces/text/accent match prototype dark seeds (amber primary, warm parchment text, deep panels)—not blurple as primary accent.
2. **Given** light theme, **When** I view the same, **Then** light parchment/ink/deeper amber/jade apply without a lasting blurple steady state.
3. **Given** shared controls (primary actions, focus, segmented controls), **When** I use them, **Then** they inherit the amber ramp consistently with readable focus on amber buttons.

---

### User Story 2 - Place typography and voice chrome match the prototype (Priority: P1)

As a user, I want Fraunces only on place names (voice title, server name, Auth brand), Manrope elsewhere, and the voice header uncluttered with blur and scene edit under `⋯`, matching the prototype.

**Why this priority**: Explicit prototype chrome + type decisions.

**Independent Test**: Check three Fraunces contexts; confirm `#geral` / dialog titles are not Fraunces; open voice header and `⋯`.

**Acceptance Scenarios**:

1. **Given** voice channel, sidebar server name, Auth brand, **When** I view them, **Then** they use Fraunces (place face).
2. **Given** text channel names and dialog/settings headings, **When** I view them, **Then** they do **not** use Fraunces solely because headings were globally swapped.
3. **Given** a voice channel, **When** the header is at rest, **Then** visible set matches prototype: title/occupancy, Composição/Grade, Members, `⋯`, E2EE—not free-standing Editar cena or blur.
4. **Given** I open `⋯`, **When** I use blur and Editar cena (when allowed), **Then** both still work.

---

### User Story 3 - Seats, speaking, chat, and user-panel stack (Priority: P1)

As a caller and chatter, I want camera seats and speaking rings to match the prototype, chat composer/messages restyled, and—when I am in a call with many controls—the **existing** user-panel stack behavior still lifts controls up without crushing my name.

**Why this priority**: Completes visible fidelity while protecting 084.

**Independent Test**: Grade seats + speaking (motion / reduced-motion); text composer; enter call with many icons → stacked upper row + reflow.

**Acceptance Scenarios**:

1. **Given** cameras in Grade/Composition, **When** seats are shown, **Then** prototype seat tones / nameplate / token radius appear on **camera** seats; screen tiles still show the full shared frame (no face-crop seat styling on screens).
2. **Given** a speaking participant, **When** motion is allowed, **Then** an amber speaking treatment is visible; under `prefers-reduced-motion: reduce`, speaking remains indicated without pulse.
3. **Given** a text channel, **When** I view messages and composer, **Then** avatar/day-separator/pill composer + circular send match the prototype intent.
4. **Given** I am in a call with enough panel icons that the name would become unreadable on one row, **When** the panel updates, **Then** call controls move to a **centered upper row**, Settings stays with identity, and the channel list **cedes space upward** (084 behavior preserved under the new skin).

---

### User Story 4 - Uncovered screens stay coherent; backend only if required (Priority: P2)

As a user of settings, members, invites, and toasts, I want those screens to inherit the new identity. As an operator, I do not want unnecessary backend churn.

**Independent Test**: Open settings/members/invite/toasts in both themes; confirm no API/migration unless a gap is documented.

**Acceptance Scenarios**:

1. **Given** settings / members / dialogs / toasts, **When** opened in both themes, **Then** they are legible and visually coherent via token inheritance (no abandoned blurple islands).
2. **Given** existing product indicators (occupancy, speaking, screen share, E2EE), **When** the reskin ships, **Then** they continue to work using **existing** data paths unless a documented gap forces a minimal backend addition.

---

### Edge Cases

- First paint / hard refresh: steady state is Mesa à Vela, not a lasting blurple flash.
- Amber primary button + amber focus ring must remain distinguishable.
- Screen-share tiles vs camera seats: do not apply seat portrait crop to screens.
- User-panel stacked mode under new panel colors: both rows readable (AA).
- Jade E2EE chip AA on both themes.
- Accent-2 → jade only after usage audit (or new security token if audit blocks remap).
- Prototype tooling chrome (`.proto-switcher`) is **not** product UI—do not ship it.
- Reduced motion: speaking without animation only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST present the **Mesa à Vela** visual identity matching the approved prototype (amber primary, parchment/ink surfaces, jade security cues) in **both** light and dark themes, recalculated through Nocturne + Mesa token layers—not a raw paste of prototype CSS and not Google Fonts CDN.
- **FR-002**: Fraunces and Manrope MUST be **self-hosted** (woff2, `font-display: swap`) like Inter; Inter MAY remain as a fallback in the stack.
- **FR-003**: **Place typography** (Fraunces) MUST apply to voice channel title, sidebar server name, and Auth brand—and MUST NOT globally replace all heading typography.
- **FR-004**: Utility UI MUST use **Manrope** as the default UI face; text channel names remain utility type (not Fraunces).
- **FR-005**: Voice header MUST move **Editar cena** and **blur** into an overflow `⋯` menu; Composição/Grade, Members, and E2EE MUST remain always visible in the default header (prototype chrome).
- **FR-006**: Speaking indication MUST use amber/ember-ring treatment; under `prefers-reduced-motion: reduce`, MUST show a non-animated speaking indication.
- **FR-007**: Camera seats MUST reflect prototype seat tones and nameplate treatment with seat-only corner radius (~20px token); screen-share Grade behavior and video attach MUST remain correct.
- **FR-008**: Shell IA (rail, sidebar, spanning user panel, main, optional members) MUST remain; this feature MUST NOT redesign navigation structure.
- **FR-009**: The **user-panel stack behavior** from [084](../084-user-panel-stack/) MUST be preserved: when needed, call controls move to a centered upper row; Settings stays on the identity row; taller panel reflows content above (no overlay). Restyling the panel is allowed; removing or breaking stack/reflow is not.
- **FR-010**: Danger/alert red tokens MUST remain for true danger semantics.
- **FR-011**: Jade for security/E2EE MUST be delivered by remapping `--color-accent-2` after a usage audit, **or** by a new `--color-security` token if the audit shows meaningful lavender accent-2 production use. Blind remap without audit is forbidden.
- **FR-012**: UI text and key icons MUST meet **WCAG AA** contrast in both themes for the new palette.
- **FR-013**: Screens not mocked in the prototype (settings, member/role admin, invites, toasts) MUST remain usable and visually coherent via token inheritance, verified in a dedicated QA pass.
- **FR-014**: Text chat MUST restyle toward prototype message/composer chrome (avatar token, day separator, pill composer, circular send) without breaking send/attach/reply flows.
- **FR-015**: Backend/API/schema changes MUST NOT be introduced unless required to feed a **product-visible** prototype indicator that has no existing data source; any such change MUST be minimal and documented in plan/tasks. Default expectation: **frontend-only**.
- **FR-016**: Features delivered outside this visual program (including screen share lifecycle, Grade/spotlight layout, unload leave, clear ended screen tile) MUST keep working after the reskin.

### Key Entities

- **Prototype visual language**: Amber/ember, jade, parchment/ink, Fraunces/Manrope, seat tones—as rendered in `mesa-ui-prototype.html`.
- **Nocturne / Mesa tokens**: Recalculated system tokens that carry that language into production.
- **Place type contexts**: Voice title, server name, Auth brand.
- **User panel stack**: 084 overflow layout retained under the new skin.
- **Voice header overflow**: Prototype `⋯` holding scene edit + blur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a side-by-side review vs the prototype (dark + light), 100% of reviewers agree primary chrome reads as Mesa à Vela / amber-led—not blurple-led.
- **SC-002**: 100% of reviewers identify Fraunces only on the three place contexts—not on dialog titles / `#geral` by accident.
- **SC-003**: Voice header checklist matches prototype: default visible set correct; blur + Editar cena only under `⋯`; both still function.
- **SC-004**: Speaking amber with motion; static under reduced-motion — confirmed in 100% of checks.
- **SC-005**: With many in-call user-panel icons, 100% of checks confirm stacked upper centered controls + readable name + channel list reflow (084 preserved).
- **SC-006**: Contrast AA spot-checks pass for body, muted, amber/jade small UI on both themes.
- **SC-007**: Regression smoke: Grade + Composition; screen share present/clear; theme toggle; user-panel stack — 100% pass.
- **SC-008**: Settings / members / dialogs / toasts reviewed in both themes with no unreadable or obviously unthemed failures.
- **SC-009**: No new backend migration/API is shipped unless a documented fidelity gap required it; if none required, confirm zero backend schema change for this feature.

## Assumptions

- “Replicar exatamente” means **visual and chrome fidelity** to the approved prototype as experienced by users, implemented through the Mesa token system (PRD §0)—not shipping the prototype HTML/CSS file as-is.
- `docs/layout-review-01.md` remains the mapping guide from prototype seeds → Nocturne/Mesa.
- Inter may stay self-hosted as fallback (as in prior Mesa à Vela clarifications); Manrope is the UI default.
- Accent-2 → jade preferred after audit (same decision path as prior Mesa à Vela work).
- Seat frames use an added seat radius token (~20px); global card radii stay on existing sm/md/lg (prototype 16px cards map to `--radius-md`).
- Prototype switcher UI is tooling only and out of product scope.
- Existing APIs already support speaking, occupancy, screen share, and E2EE indicators shown in the prototype.

## Out of scope (explicit)

- Splitting `Sidebar.tsx` / modularizing `mesa-theme.css` into many files as a refactor goal.
- Dedicated net-new IA for settings/roles/invites (token inheritance + QA only).
- Removing or redesigning away the **084 user-panel stack** behavior.
- Rebuilding collapsed channel drawer or shell stage-mode as a product feature.
- Changing voice/call media protocols or E2EE cryptography beyond visual chip/styling (unless FR-015 gap forces a tiny data field).
- Shipping Google Fonts CDN or the prototype’s `.proto-switcher` chrome.
