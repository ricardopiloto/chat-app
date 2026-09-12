# Implementation Plan: User Display Name

**Branch**: `099-user-display-name` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/099-user-display-name/spec.md`

**Note**: Clarification (2026-09-11): display name is **public** (Discord-style)—peers see it on member-facing surfaces; username (`handle`) stays login id + own «Ligado como».

## Summary

Add an optional, user-editable **display name** on the account. Persist it server-side; expose edit/clear in the **account menu** (alongside avatar). Presentation rule: when set (non-empty after trim), show display name on **user panel** (self) and on **member list, chat authorship, voice/presence labels, welcome `{nome}`**; always show **username (`handle`)** under account-menu signed-in-as. Mentions continue to address by `@handle`; visible labels follow display name when set. No username change UI.

## Technical Context

**Language/Version**: Rust (Axum/SQLite backend) + TypeScript / SolidJS frontend.

**Primary Dependencies**: Existing auth/account DB + `AuthAccount` / `MemberView` / occupancy APIs; `AccountMenu`, `UserPanel`, members/chat/voice handle maps; i18n `account.signedInAs`.

**Storage**: SQLite `account.display_name` (nullable TEXT); migration `0021_…`; no uniqueness constraint.

**Testing**: Manual single-browser set/clear/panel/signed-in-as + two-browser peer surfaces; `cargo test` for account/API validation; `cd frontend && npm run build`; [quickstart.md](./quickstart.md).

**Target Platform**: Mesa web app (desktop primary).

**Project Type**: Full-stack web app — account profile + presentation.

**Performance Goals**: N/A beyond normal API/UI update after save (SC-001).

**Constraints**: Handle immutable (FR-002); display names non-unique (FR-009); empty/whitespace → unset; length limit at plan (readable label); E2EE/identity vault unrelated.

**Scale/Scope**: Migration + account PATCH + extend member/mentionable/occupancy JSON; FE settings field + shared `displayLabel(account)` helper across panel/members/chat/voice/welcome consumers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Spec-driven / clarify before plan | Pass — public scope locked |
| Handle remains immutable | Pass |
| No unrelated redesign | Pass |
| Manual + build/test validation | Pass |

**Post-design**: Still pass — new account field + presentation helper; no new product domains.

## Project Structure

### Documentation (this feature)

```text
specs/099-user-display-name/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── account-display-name.md
│   └── public-display-label.md
└── tasks.md              # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
backend/
├── migrations/0021_account_display_name.sql   # new
├── src/domain/account.rs                     # AuthAccount + record
├── src/db/account.rs                         # COLS, update display_name
├── src/api/auth/mod.rs                       # PATCH display name
├── src/api/channel_roles.rs                  # MemberView
├── src/domain/voice_occupancy.rs             # OccupantView
├── src/db/voice_occupancy.rs                 # JOIN select
├── src/api/welcome.rs                        # {nome} render
└── src/api/voice.rs                          # LiveKit token name (optional)

frontend/src/
├── api/client.ts                             # Account / members / occupancy types + API
├── components/AccountMenu.tsx                # edit display name; signed-in-as = handle
├── shell/UserPanel.tsx                       # primary label
├── components/MembersPanel.tsx
├── pages/Channel.tsx                         # displayHandle / authorship
├── shell/Sidebar.tsx                         # voice roster
├── pages/VoiceChannel.tsx                    # handles map
├── lib/displayName.ts                        # NEW shared label helper (or equivalent)
└── i18n/catalogs/{en,pt-BR}.ts               # settings labels
```

**Structure Decision**: Full-stack account field; centralize FE presentation via one helper (`displayLabel({ handle, display_name })`) so all surfaces stay consistent.

## Complexity Tracking

> No constitution violations requiring justification.
