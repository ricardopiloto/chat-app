# Implementation Plan: Câmara no painel + blur no cabeçalho

**Branch**: `081-panel-cam-header-blur` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/081-panel-cam-header-blur/spec.md`

**Note**: `.specify/feature.json` → `specs/081-panel-cam-header-blur`. Clarifications: always **off** stage mode; panel camera = session pref + JOIN respects; remove pre-join camera opt-in/blur. Supersedes 080 bottom-bar cam/blur and 078 “no cam on panel” / pre-join opt-in UI.

## Summary

1. **Camera on UserPanel** — after deafen, before settings; same visual as mic/deafen; **no** blur on that button. Session preferred `camOn` when idle; live `toggleCam` when in call; JOIN uses preferred cam.
2. **Blur select in voice `pane-header`** while live — native select: nenhum / leve / forte (`blurPreference` + apply to local track when cam on).
3. **Remove** `voice-in-call-bar` entirely (hang-up stays on panel + PiP).
4. **Remove** «Modo palco» button; **never** enter stage mode (`requestStageMode(true)` gone; ignore/force off legacy pref).
5. **Simplify pre-join** — JOIN (+ optional test video); no camera opt-in, preview, or pre-join blur.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`. No backend/API/migration expected.

**Primary Dependencies**: `UserPanel.tsx`, `VoiceSession.tsx` (`toggleCam` / preferred `camOn`), `VoiceChannel.tsx` (header select, pre-join, remove bottom bar + stage toggle), `AppShell.tsx` / `uiPrefs.ts` (stage force-off), `blur/blurPreference.ts`, i18n catalogs, existing camera icons.

**Storage**: Preferred camera = in-memory session signal (default **off**, matching prior JOIN default). Blur mode remains `mesa.cameraBlur` local pref. Stage pref `mesa.stageMode` ignored / forced false (no product UI).

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser — authenticated shell + voice/video channel.

**Project Type**: Web UI / call chrome relocation (FE-only).

**Performance Goals**: No extra network beyond existing media patches; header blur change applies only when local cam track exists.

**Constraints**: No blur UI on panel camera button. No stage-mode layout. Leave call remains on user panel (and PiP). Listen-only: camera disabled. Do not require durable cam preference.

**Scale/Scope**: FE shell + VoiceChannel + VoiceSession; supersedes parts of 078/080 contracts for panel cam ownership, bottom bar, pre-join opt-in, stage toggle.

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

UI contracts + session model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/081-panel-cam-header-blur/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-camera.md
│   ├── header-blur-select.md
│   ├── prejoin-join-only.md
│   └── stage-mode-retired.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx           # cam button after deafen; toggleCam / preferred cam
frontend/src/voice/VoiceSession.tsx        # preferred camOn when !live; default false; join consumers
frontend/src/pages/VoiceChannel.tsx        # header blur <select>; strip pre-join cam/blur; remove in-call-bar + stage button; no requestStageMode(true)
frontend/src/shell/AppShell.tsx            # force stage off; ignore toggle/request true
frontend/src/preferences/uiPrefs.ts        # readStageMode always false / clear writes (optional)
frontend/src/styles/mesa-theme.css         # panel cam; header blur select; drop dead in-call-bar / stage btn styles as needed
frontend/src/i18n/catalogs/{en,pt-BR}.ts   # blur select labels; retire unused stage/prejoin cam strings usage
frontend/src/blur/blurPreference.ts        # reuse off|light|strong
# CameraBlurMenu: unused on voice pre-join/in-call bar after this; keep if used elsewhere or leave dead for now
```

**Structure Decision**: FE-only. Join still uses existing `mic_on` / `cam_on` body fields; preferred panel cam drives `connect("camera"|"audio")`.

## Complexity Tracking

N/A
