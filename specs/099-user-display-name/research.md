# Research: User Display Name

**Feature**: 099-user-display-name  
**Date**: 2026-09-11

## R1 — Storage

**Decision**: Add nullable `account.display_name TEXT` via migration `0021_account_display_name.sql`. No UNIQUE index. Empty string / whitespace-only stored as **NULL** (unset).

**Rationale**: Spec FR-007/009; today only `handle` exists (audit). Avatar already has a profile PATCH pattern.

**Alternatives considered**: Client-only preference (rejected — peers must see it). Per-server nickname (rejected — clarify is Discord-style **account** display name, not server nick).

## R2 — Validation

**Decision**: On save: trim; if empty → NULL; max length **64** Unicode scalars (readable label); allow letters, numbers, spaces, punctuation, emoji within that length; reject control characters. Do not require uniqueness. Do not alter `handle`.

**Rationale**: Spec edge cases; planning detail for length. 64 matches common chat display-name caps without being a second login id.

**Alternatives considered**: 32 chars (tight for emoji names); 128 (unneeded for panel truncation).

## R3 — API

**Decision**:

1. Extend `AuthAccount` (and FE `Account`) with `display_name: Option<String>` / `display_name?: string | null`.
2. Add authenticated `PATCH` (or `PUT`) `/api/auth/display-name` with body `{ "display_name": string | null }` returning updated `AuthAccount` (mirror avatar PUT style).
3. Extend `MemberView`, mentionables, and `OccupantView` (+ SQL JOINs) with `display_name` so peers receive it without N+1.
4. `GET /api/auth/me` and login/register responses include the field.

**Rationale**: Peers need the value on existing list endpoints (FR-008); settings save needs a clear write path (FR-001).

**Alternatives considered**: Only put display_name on `/me` and force FE to fetch profiles by id (heavier). Bundle into a generic profile PATCH with avatar (possible later; keep focused endpoint or single profile update — prefer dedicated or small JSON field on existing auth update).

## R4 — Presentation rule (canonical helper)

**Decision**: Define `publicDisplayLabel(handle, display_name) → string`: trim display_name; if non-empty return it; else return handle. Use everywhere member-facing names appear. Self user-panel primary uses the same helper. Account-menu `account-menu-handle` **always** shows `handle`.

**Rationale**: FR-003–006, FR-008; single rule prevents drift.

**Alternatives considered**: Duplicate ternaries per component (rejected).

## R5 — Mentions

**Decision**: Keep `@handle` as the address token in message plaintext and autocomplete (FR-010). Mention picker may show display name as secondary label while inserting `@handle`. Visible authorship / nameplates use publicDisplayLabel.

**Rationale**: Spec FR-010; existing `mentionParse` is handle-keyed.

**Alternatives considered**: Address by display name (ambiguous — non-unique).

## R6 — Welcome + LiveKit

**Decision**: `render_welcome_text` `{nome}` uses publicDisplayLabel (display name when set). LiveKit token `name` parameter: prefer display name when set, else handle (cosmetic for SFU UI; app labels still from FE maps).

**Rationale**: Spec edge case for welcome; token name is low-risk alignment.

## R7 — Settings UX

**Decision**: Add display-name field in `AccountMenu` near profile photo; save on blur or explicit Save; show handle as read-only under signed-in-as (existing). No username edit control.

**Rationale**: Spec US1/US3; AccountMenu already hosts profile options.

## R8 — Out of scope

**Decision**: No server-scoped nicknames; no handle rename; no force-unique display names; no change to login form (still handle).

**Rationale**: Spec assumptions + FR-002/009.
