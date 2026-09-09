# Implementation Plan: Restaurar controlos de chamada (sair, câmara, blur)

**Branch**: `080-call-controls-restore` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/080-call-controls-restore/spec.md`

**Note**: `.specify/feature.json` → `specs/080-call-controls-restore`. Clarifications: leave always on user panel (incl. stage); restore voice-pane bottom bar (cam/blur/hang-up); hide blur until cam on; mic/deafen rounded (not pill), no fake chevrons; mic/deafen work **out of call** and join **inherits** that state (browser-session only).

## Summary

1. **Leave always on UserPanel** while `voice.live()` — remove `!stageMode()` gate so stage users can hang up from the panel (PiP / bottom bar may still duplicate hang-up).
2. **Restore in-call bottom bar** on `VoiceChannel` (`voice-pane`): hang-up + camera toggle + blur (blur **hidden** until camera on); wire to `voice.hangup` / `toggleCam` / blur preference + LiveKit apply.
3. **Mic / deafen as session prefs**: operable when not live; `VoiceSession` keeps preferred mic/deafen in memory; `connect` / `bindLive` apply them; no localStorage.
4. **Panel polish**: remove decorative mic/deafen chevrons; keep soft rounded rectangle (not pill).
5. **Blur menu stacking**: ensure `CameraBlurMenu` paints above `.pane-header` / voice chrome (z-index / overflow / open direction).

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`. No backend / API / migration expected.

**Primary Dependencies**: `UserPanel.tsx`, `VoiceChannel.tsx`, `VoiceSession.tsx`, `CameraBlurMenu.tsx`, `mesa-theme.css`, existing i18n keys (`shell.leaveCall`, mic/deafen/blur), LiveKit via existing voice runtime.

**Storage**: In-memory session signals only for mic/deafen prefs (lost on full reload / new tab). Blur mode continues via existing `blurPreference` (local) — unchanged by this feature’s mic/deafen persistence rule.

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md). No new backend contract tests required.

**Target Platform**: Browser — authenticated shell + voice/video channel (stage and off-stage).

**Project Type**: Web UI / voice session chrome restoration (FE-only).

**Performance Goals**: No extra network beyond existing media patches; toggleCam mid-call may call getUserMedia once (existing path).

**Constraints**: Do not put camera/blur back on UserPanel (078 UP-01 stands). Do not invent device pickers. Mic/deafen prefs MUST NOT require durable storage. Listen-only: mic stays non-publishing / coherently disabled when permission is listen.

**Scale/Scope**: ~FE-only: UserPanel, VoiceSession, VoiceChannel bottom bar, CSS/z-index for blur menu; supersedes parts of 078 UP-03/UP-05/UP-09 for leave/mic/deafen behaviour.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation/session model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/080-call-controls-restore/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-controls.md
│   ├── voice-pane-bottom-bar.md
│   ├── mic-deafen-session-prefs.md
│   └── blur-menu-visibility.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx           # leave when live (incl. stage); mic/deafen always toggleable; drop chevrons
frontend/src/voice/VoiceSession.tsx        # preferred mic/deafen when !live; apply on bindLive/connect consumers; toggle* off-call
frontend/src/pages/VoiceChannel.tsx        # in-call bottom bar: hangup + cam + blur; join uses voice preferred mic/deafen
frontend/src/components/CameraBlurMenu.tsx # optional: open direction / portal if needed for stacking
frontend/src/styles/mesa-theme.css         # panel ctrl rounded (no split chevron); bottom bar; blur menu z-index/overflow
frontend/src/i18n/catalogs/{en,pt-BR}.ts   # only if new labels needed (prefer reuse shell.* / voice.*)
```

**Structure Decision**: FE-only restoration/polish. Backend voice join/media patch contracts unchanged; client applies preferred mic_on at join via existing body fields.

## Complexity Tracking

N/A
