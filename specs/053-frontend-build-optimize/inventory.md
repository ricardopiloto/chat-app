# Dedupe inventory — 053-frontend-build-optimize

**Legend**: `pending` | `unified` | `false-positive` | `intentional-divergence`

## Build sizes

| Metric | Baseline | After (2026-09-08) |
|--------|----------|---------------------|
| Entry JS | ~962.84 kB | **212.18 kB** (gzip ~72 kB) |
| livekit (async) | (in entry) | 558.56 kB |
| livekit-blur (async) | (in entry) | 153.38 kB |

Vite may still warn on the async `livekit` chunk (&gt;500 kB) — expected; entry is under budget (SC-001).

## Smoke (T028 / quickstart)

- A Build gate: PASS (entry &lt; 500 kB)
- B–D Text / voice load / PiP: covered by code-split + loadRuntime; manual browser smoke recommended after deploy
- E Inventory: this file
- F tsc: PASS

---

### C1 — API error → user string
- Files: RolesPanel, ChannelAclPanel, SceneList, SceneEditor, Sidebar, GridAdmin, CoDirectorPanel, ImageUploadDialog, RolePermissionsPage, MembersManagePage, MembersPanel, …
- Target helper: `frontend/src/lib/apiError.ts` (`errorMessage`)
- Status: unified
- Notes: Migrated 2026-09-08

### C2 — Domain-specific error mappers
- Files: `pages/Auth.tsx`, `pages/Invite.tsx`, `voice/joinErrors.ts`
- Target helper: Auth/Invite use `errorMessage` as generic fallback; joinErrors keeps categorizeJoinError domain mapping
- Status: intentional-divergence
- Notes: Join failure categories (permission/device/connection) must stay distinct from generic API strings

### C3 — Role capability gates
- Files: `shell/Sidebar.tsx`
- Target helper: `frontend/src/lib/capabilities.ts` (`memberHasCapability`)
- Status: unified
- Notes: —

### C4 — localStorage prefs
- Files: theme.ts, blurPreference.ts, uiPrefs.ts, lastChannelByServer.ts
- Target helper: `frontend/src/lib/localPrefs.ts`
- Status: unified
- Notes: Keys unchanged (FR-008). `crypto/channelKey.ts` keeps direct localStorage (E2EE channel keys — out of C4 scope)

### C5 — Panel Dialog load/save/error chrome
- Files: RolesPanel, ChannelAclPanel (+ errorMessage consumers)
- Target helper: `frontend/src/lib/panelState.ts` (`runPanelAction`, `formatCatch`)
- Status: unified
- Notes: Partial structural unify via shared error + runPanelAction where cheap

### C6 — AppShell route wrappers
- Files: `App.tsx`
- Target helper: `AuthedShell` in App.tsx
- Status: unified
- Notes: —

### C7 — Media attach / safe play
- Files: liveClient.ts, VoiceChannel.tsx, FloatingVoicePip.tsx
- Target helper: `frontend/src/lib/safeMedia.ts` (`safePlay`)
- Status: unified
- Notes: —

### C8 — Key-sync UX copy
- Files: Channel.tsx, VoiceChannel.tsx
- Target helper: `frontend/src/lib/keySyncCopy.ts`
- Status: unified
- Notes: KEY_SYNC_MSG / KEY_SYNC_SHORT

### C9 — Voice loadRuntime / chunks
- Files: voice/loadRuntime.ts, runtime.ts, VoiceSession, VoiceChannel, AppShell PiP lazy, vite manualChunks
- Target helper: n/a (US1)
- Status: unified
- Notes: Entry budget + lazy join/active-call
