# Feature Specification: Mesa à Vela — Visual Identity Renovation

**Feature Branch**: `089-mesa-a-vela-reskin`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: “Leia todo o `docs/layout-review-01.md` e vamos criar uma proposta para revisitar todo o layout da aplicação… a spec deve conter as melhorias e alterações necessárias para alcançar o desejado no PRD.”

**Source PRD**: [docs/layout-review-01.md](../../docs/layout-review-01.md) — *Renovação Visual "Mesa à Vela"* (protótipo `mesa-ui-prototype.html`).

---

## Clarifying what this feature is (and is not)

| PRD says | Implication for this feature |
|----------|------------------------------|
| Replace blurple/lavender + Inter-only with **âmbar + jade**, **Fraunces + Manrope**, light/dark | **Visual identity / design-token reskin** |
| **Do not change information architecture** (sidebar, rail, voice header structure stay) | **Not** a shell-grid redesign, not Discord IA rewrite |
| Voice header: fold **Editar cena** + blur into `⋯` overflow (as in approved prototype) | **One** intentional chrome behavior change |
| Respect Nocturne (`nocturne.css`) + Mesa skin (`mesa-theme.css`); self-host fonts | No Google Fonts CDN; no dump of prototype CSS |

**User ask (“revisitar todo o layout”)** is interpreted as: **bring the whole product UI into the Mesa à Vela look** across shell, voice, text, and auth—while keeping current nesting and flows. Structural refactors (splitting `Sidebar.tsx`, splitting `mesa-theme.css`) remain **out of scope** per PRD §2.

## Clarifications

### Session 2026-09-10

- Q: How should jade (security/E2EE) be formalized in tokens? → A: **Remap `--color-accent-2` (+ ramp) to jade** after a start-of-implement usage audit; if audit finds meaningful production use of lavender accent-2, fall back to a new `--color-security` token instead.
- Q: Camera seat corner radius vs Nocturne 8/14/22? → A: Add **`--radius-token: 20px`** used only for camera seat / character frames—not a global card radius change.
- Q: What happens to Inter once Manrope/Fraunces ship? → A: **Manrope is the UI default**; **Inter stays self-hosted as fallback** in the font stack (Inter does not leave the system).

## Gap analysis — current product vs PRD desired state

### A. Identity & tokens (largest gap)

| Area | Today (approx.) | Desired (PRD) |
|------|-----------------|---------------|
| Primary accent | Blurple `#9184d9` + accent ramp in Nocturne | Âmbar seed `#D98A3D` / strong `#F0A452` (light: deeper amber) — **recalculate OKLCH ramp**, do not hand-paste prototype hex into every rule |
| Surfaces / text | Cool nocturne greys + current Mesa `--panel` / `--stage` | Parchment / ink: dark bg `#14121A`, panel `#1C1926`, text `#EDE6DC`; light bg `#F8F2E6`, text `#241C14` |
| Secondary semantic | `--color-accent-2` still lavender `#a7a1db` (class `.tag-accent-2` exists; little/no product usage found outside Nocturne) | **Jade** via **remap `--color-accent-2`** after audit; fallback `--color-security` only if audit fails (clarification 2026-09-10) |
| Typography | Inter only (`--font-heading` / body → Inter) | **Fraunces** for place; **Manrope** for UI default; **Inter kept self-hosted as fallback** (clarification 2026-09-10) |
| Font loading | Self-hosted Inter under `/fonts` | Same pattern for Fraunces + Manrope **woff2** (OFL); **no** Google Fonts CDN (aligns with `024-security-hardening`) |
| Camera seats | Current tile/chip look | Five seat gradients (ember/plum/slate/wine/umber), nameplate gradient, **amber** speaking ring (reuse 033/036 speaking state) |
| Radius | Nocturne 8/14/22 | Keep sm/md/lg; add **`--radius-token: 20px`** for camera seat frames only (clarification 2026-09-10) |

### B. Shell & chrome (structure OK; skin + labels)

| Surface | Structure today | PRD change |
|---------|-----------------|------------|
| `.shell` / `.shell-nav` / rail / sidebar / spanning user panel | Discord-like; panel may **stack** (084) | **Keep structure**; restyle rail active/`has-voice`/`has-unread`, `.chan-row`, section labels, roster, user bar |
| Sidebar section labels | Often uppercase tracked | Weight 700 + icon; drop shared uppercase if safe |
| TopBar / theme toggle | Existing `data-theme` | **Keep mechanism**; only recalculate light/dark token values |
| Members panel | Optional right column | Restyle tokens only |

### C. Voice / Grade / Composition (high regression risk)

| Surface | Today | PRD change | Impact note |
|---------|-------|------------|-------------|
| Voice header | Editar cena + blur select visible; Composição/Grade; Members; E2EE | Default chrome: title/occupancy, Composição/Grade, Members, `⋯`, E2EE — **Editar cena + blur only inside `⋯`** | Touches `VoiceChannel.tsx` markup/behavior (only structural chrome change in PRD) |
| Grade / Composition stage | Inside `.voice-pane` via `CameraGrid` (082/083/085/086) | Seat visuals + speaking ring only | Must not break screen-share tiles, fit, spotlight, or cam attach |
| Speaking aura | Existing mechanism (033/036) | Amber pulse; **static** under `prefers-reduced-motion` | Color/animation only |
| Screen share / user panel controls | 080–084, 088 | Inherit new accent/controls skin | Stacked panel, leave/mic/cam/screen must remain usable and readable on amber |

### D. Text chat & Auth

| Surface | Today | PRD |
|---------|-------|-----|
| Channel messages + composer | Current panes | Avatar token, day separator, pill composer + circular send |
| Auth | Two-column (027) | Tokens + place typography on brand; layout unchanged |

### E. Untouched by prototype (must still look coherent)

Settings, member/role management, invite dialogs, toasts — **no dedicated mockups**. Success = inherit Nocturne/Mesa tokens; dedicated visual QA pass (PRD §8.4 / §9.6).

---

## Impact on recent / in-flight implementations

Implementing Mesa à Vela **must not regress** product behavior from recent specs; visual layers only (except voice-header `⋯`).

| Feature area | Risk if reskin is careless | Mitigation in this feature |
|--------------|----------------------------|----------------------------|
| **078 / 084** user panel Discord + stack | Low contrast on new panels; stacked row unreadable | Restyle `.user-panel*` with AA checks; keep stack/reflow behavior |
| **080 / 081** call controls + header blur | Blur control moved into `⋯` — easy to lose | Explicit acceptance: blur + Editar cena reachable only via overflow; E2EE + mode switch stay visible |
| **082 / 083 / 085 / 086** screen share Grade/spotlight | Seat/CSS changes break tile kinds or object-fit | Seat gradients/nameplates target **camera** seats; screen tiles keep “show all” fit rules; spotlight layout untouched structurally |
| **033 / 036** speaking indicator | Wrong ring color or lost reduced-motion | Reuse speaking state; amber ring + reduced-motion static border |
| **024** security / fonts | CDN fonts reintroduced | Self-host only |
| **087 / 088** (session unload / clear screen tile) | Orthogonal | No IA change; ensure indicators still readable after token swap |
| Legacy CSS (stage-mode, channels-collapsed) | Dead paths still themed | Optional: don’t invest redesign; leave inert or ignore in QA |

**Propagation risk**: Changing `--color-accent` affects `.btn-primary`, tags, radios, segmented controls, inputs focus, etc. across ~80 prior specs → **full visual QA**, not prototype screens only (PRD §10).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Product feels “Mesa à Vela” in light and dark (Priority: P1)

As a Mesa user, I want the app to use the amber/jade parchment identity in both themes so the product matches the approved visual direction—not the old blurple look.

**Why this priority**: Core PRD outcome.

**Independent Test**: Toggle light/dark on shell + voice + text; confirm §3 palette (no residual blurple chrome flash as the steady state).

**Acceptance Scenarios**:

1. **Given** any primary screen, **When** I view dark theme, **Then** surfaces/text/accent match the dark Mesa à Vela seeds (amber accent, warm parchment text)—not blurple as primary accent.
2. **Given** the same screens, **When** I switch to light theme, **Then** light parchment/ink/amber/jade apply without a lasting flash of the old palette.
3. **Given** shared components (primary buttons, focus rings, segmented controls), **When** I use them, **Then** they inherit the new accent ramp consistently.

---

### User Story 2 - Place typography vs utility typography (Priority: P1)

As a user, I want voice channel titles, server names, and the Auth brand in Fraunces, while ordinary UI (including text channel names like `#geral`) stays in Manrope—so “places” feel distinct without turning every dialog title into display type.

**Why this priority**: Explicit PRD §5 decision; wrong global `--font-heading` swap would pollute dialogs/settings.

**Independent Test**: Voice header title + sidebar server name + Auth brand = Fraunces; dialog titles / `#geral` / settings headings ≠ accidental Fraunces.

**Acceptance Scenarios**:

1. **Given** a voice channel, **When** I read the header channel name, **Then** it uses the place face (Fraunces).
2. **Given** the sidebar server name and Auth brand, **When** I view them, **Then** they use Fraunces.
3. **Given** a text channel name and a dialog title, **When** I view them, **Then** they do **not** use Fraunces solely because headings were globally reassigned.

---

### User Story 3 - Voice header matches prototype chrome (Priority: P1)

As a participant in a voice channel, I want the default header to stay uncluttered: mode switch, members, E2EE, and overflow `⋯`—with scene edit and blur inside the menu.

**Why this priority**: Only approved IA/chrome change in the PRD.

**Independent Test**: Open voice channel; confirm default controls; open `⋯` and find Editar cena (when allowed) + blur.

**Acceptance Scenarios**:

1. **Given** a voice channel view, **When** the header is at rest, **Then** visible controls include title/occupancy, Composição/Grade, Members, `⋯`, and E2EE—not free-standing Editar cena or blur select.
2. **Given** I open `⋯`, **When** I look at the menu, **Then** blur (and Editar cena when I have that affordance) are available and still work.
3. **Given** Grade vs Composition, **When** I switch modes after the restyle, **Then** stage behavior (including screen-share Grade rules) still works.

---

### User Story 4 - Speaking ring and seat presence (Priority: P2)

As a caller, I want speakers highlighted with an amber ring (static under reduced motion) and camera seats with the new seat styling—without breaking video.

**Independent Test**: Speak on mic with motion allowed / reduced; inspect camera tiles; confirm video still plays.

**Acceptance Scenarios**:

1. **Given** a speaking participant, **When** motion is allowed, **Then** an amber speaking treatment is visible on the relevant control/seat.
2. **Given** `prefers-reduced-motion: reduce`, **When** someone speaks, **Then** speaking is still indicated without the pulsing animation.
3. **Given** Grade/Composition with cameras on, **When** seats are restyled, **Then** webcam (and screen tiles where applicable) still display correctly.

---

### User Story 5 - Text, Auth, and uncovered screens stay coherent (Priority: P2)

As a user of chat, login, settings, and dialogs, I want those surfaces to look consistent with Mesa à Vela even without dedicated mockups.

**Independent Test**: Text composer/messages; Auth; spot-check settings/members/invite/toasts in both themes.

**Acceptance Scenarios**:

1. **Given** a text channel, **When** I view messages and composer, **Then** they reflect the new skin (avatar treatment, day separator, pill composer + circular send as specified).
2. **Given** Auth, **When** I view the login screen, **Then** structure remains two-column and branding uses place typography + new tokens.
3. **Given** settings / members / dialogs / toasts, **When** I open them in both themes, **Then** they remain legible and consistent via inherited tokens (no broken contrast or unreadably “old” islands).

---

### Edge Cases

- Flash of unstyled/old theme on first paint — minimize; steady state must be new palette.
- Primary amber buttons + amber focus ring — focus must remain distinguishable (PRD §8.3).
- Screen-share tiles vs camera seats — do not apply face “crop zoom” styling to screen tiles (085).
- User-panel stacked mode (084) — both rows readable on new panel colors.
- Jade/E2EE chip on both themes — contrast AA.
- `--color-accent-2` remap vs new security token — decide only after usage audit (PRD §4.3); initial grep suggests remap is likely safe, but must re-verify at implement start.
- Reduced motion + speaking — no reliance on animation alone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST present the **Mesa à Vela** color identity (amber primary, parchment/ink surfaces, jade for security/E2EE role) in **both** light and dark themes, recalculated through Nocturne + Mesa token layers—not a raw paste of prototype CSS.
- **FR-002**: Fonts Fraunces and Manrope MUST be **self-hosted** (woff2, `font-display: swap`) like Inter; MUST NOT load from Google Fonts CDN.
- **FR-003**: **Place typography** (Fraunces) MUST apply to: voice channel title, sidebar server name, Auth brand—and MUST NOT globally replace all heading typography.
- **FR-004**: Utility UI typography MUST use **Manrope** as the default UI face; **Inter MUST remain self-hosted** and appear as a **fallback** in the font stack (not removed from the system). Text channel names remain utility type (Manrope), not Fraunces.
- **FR-005**: Voice channel header MUST move **Editar cena** and **blur** into an overflow `⋯` menu; Composição/Grade, Members, and E2EE MUST remain always visible in the default header.
- **FR-006**: Speaking indication MUST use amber treatment; under `prefers-reduced-motion: reduce`, MUST show a non-animated speaking indication.
- **FR-007**: Camera seat visuals MAY use the five seat tones and nameplate treatment; screen-share Grade behavior and video attach MUST remain correct.
- **FR-008**: Shell information architecture (rail, sidebar, spanning user panel, main pane, optional members) MUST remain; this feature MUST NOT require relocating stage into a new shell track or reintroducing collapsed-channels / stage-mode as product.
- **FR-009**: Danger/alert red tokens MUST remain for true danger semantics (not recolored to amber).
- **FR-010**: Jade for security/E2EE MUST be delivered by **remapping `--color-accent-2` and its ramp** to the jade seeds, **after** a usage audit at implement start. If the audit finds meaningful production use of the current lavender accent-2, MUST introduce `--color-security` (short ramp) instead and leave accent-2 unchanged. Blind remap without audit is forbidden.
- **FR-011**: UI text and key icons MUST meet **WCAG AA** contrast (4.5:1 normal text, 3:1 large text/icons) in both themes for the new palette.
- **FR-012**: Screens not mocked in the prototype (settings, member/role admin, invites, toasts) MUST remain usable and visually coherent via token inheritance, verified in a dedicated QA pass.
- **FR-013**: The design system MUST add **`--radius-token: 20px`** for camera seat / character frame corners only. Existing `--radius-sm/md/lg` MUST remain the defaults for cards, dialogs, and general chrome.

### Key Entities

- **Nocturne tokens**: Generic accent/surface/text/font system in `nocturne.css`.
- **Mesa skin tokens**: Product aliases on `.app` / `[data-theme=light]` in `mesa-theme.css`.
- **Place type**: Fraunces contexts listed in FR-003.
- **Security/E2EE accent**: Jade semantic (via accent-2 or new token).
- **Voice header overflow**: `⋯` menu holding scene edit + blur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a themed walkthrough (dark + light), 100% of reviewers agree primary chrome no longer reads as blurple-led; amber is the primary accent.
- **SC-002**: 100% of reviewers identify Fraunces only on the three place contexts (voice title, server name, Auth brand)—not on dialog titles / `#geral` by accident.
- **SC-003**: Voice header checklist: default visible set matches PRD §9.3; blur + Editar cena only under `⋯`; both still function.
- **SC-004**: Speaking ring amber with motion; static under reduced-motion — confirmed in 100% of quickstart checks.
- **SC-005**: Contrast AA spot-checks pass for body text, muted text, amber/jade small UI on both themes (documented checklist).
- **SC-006**: Regression smoke: Grade + Composition cameras; screen share tile present/clear; user-panel controls; theme toggle — no functional regressions in 100% of smoke runs.
- **SC-007**: Settings / members / dialogs / toasts reviewed in both themes with no “unreadable or obviously unthemed” failures.

## Assumptions

- PRD [docs/layout-review-01.md](../../docs/layout-review-01.md) is the source of truth for visual goals; prototype HTML is inspirational seed only.
- “Revisitar o layout” means **full-surface visual renovation + the approved voice-header simplification**, not a new shell architecture.
- Phasing may follow PRD §11 (tokens → shell → voice → text/auth → QA) as delivery slices inside this feature or sequential tasks.
- Next available feature id at writing is **089** (082–088 already used for other work); PRD’s “from 082” numbering is outdated.
- Accent-2 → jade: **preferred path is remap after audit**; new security token only if audit blocks remap (clarification 2026-09-10).
- Seat frames use **`--radius-token: 20px`** only (clarification 2026-09-10); do not change global card radii to 20px.
- **Manrope = UI default**; **Inter remains self-hosted fallback** (clarification 2026-09-10)—do not delete Inter font files as part of this feature.

## Out of scope (explicit)

- Splitting `Sidebar.tsx` / modularizing `mesa-theme.css` into many files (prior refactor proposal).
- Dedicated redesign of settings, roles, invites (token inheritance + QA only).
- Rebuilding collapsed channel drawer or shell stage-mode as a product feature.
- Changing voice/call/media protocols, occupancy APIs, or E2EE crypto—visual chip only.
