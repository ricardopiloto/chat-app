# Implementation Plan: Mensagem de entrada de membro no chat

**Branch**: `077-member-join-welcome` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/077-member-join-welcome/spec.md`

**Note**: `.specify/feature.json` → `specs/077-member-join-welcome`. Clarifications: invite `welcome_channel_id` is **per-invite only**; announces **always on** (no owner opt-out).

## Summary

On successful invite join, publish a **system** chat notice (centered, non-user style) in a resolved text channel: owner-configured destination → else channel named `geral` → else the invite’s `welcome_channel_id` (required at invite create when steps 1–2 missing). Owner edits template + destination in server settings. Join must succeed even if announce fails. Messages today are E2EE ciphertext-only — introduce an explicit **system message** shape (plaintext + kind) so the server can emit without channel keys.

## Technical Context

**Language/Version**: Rust / Axum (BE); TypeScript / SolidJS (FE).

**Primary Dependencies**: `api/invites.rs`, `api/auth/register.rs` (`emit_invite_consumed`), `api/messages.rs` / `db/message`, `domain/message`, WS `message.new`; FE `Channel.tsx` timeline + day-separator pattern; `Sidebar` invite create; settings shell (`settingsAccess`, new welcome page); migrations `0019+`.

**Storage**: SQLite — extend `message` for system kind/plaintext; `server` welcome template + channel; `invite.welcome_channel_id` (nullable, per-invite).

**Testing**: Contract tests for join announce + invite create validation; `tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser + Mesa API.

**Project Type**: Full-stack feature (migration + API + FE).

**Performance Goals**: One insert + WS fanout per join; non-blocking relative to membership commit.

**Constraints**: No opt-out; per-invite channel does not become server default; FR-009 non-fatal announce; FR-010 not treated as member chat (no Menção/Resposta as user message); E2EE user messages unchanged.

**Scale/Scope**: ~1 migration, BE message/invite/server APIs, FE Channel/Sidebar/settings page.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + contract tests for join/invite |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Data model + contracts + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/077-member-join-welcome/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── join-welcome-message.md
│   ├── invite-welcome-channel.md
│   └── server-welcome-settings.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0019_member_join_welcome.sql
backend/src/domain/message.rs          # system kind / plaintext fields
backend/src/domain/invite.rs            # welcome_channel_id
backend/src/domain/…                    # server welcome settings fields
backend/src/db/message.rs / invite.rs / server…
backend/src/api/invites.rs              # create body + accept hook
backend/src/api/auth/register.rs        # emit path / announce helper
backend/src/api/servers.rs              # GET/PATCH welcome settings (owner)
backend/tests/contract/…                # join welcome + invite channel required

frontend/src/pages/Channel.tsx          # render system welcome row (centered)
frontend/src/shell/Sidebar.tsx          # invite channel picker when needed
frontend/src/pages/…WelcomeSettings…    # owner settings page
frontend/src/lib/settingsAccess.ts      # nav item
frontend/src/api/client.ts              # types + API helpers
frontend/src/styles/mesa-theme.css      # system message styles
```

**Structure Decision**: Persist system notices in `message` with a distinct kind + plaintext so WS/history stay unified; resolve destination server-side on join; invite only stores optional override for that code.

## Complexity Tracking

N/A
