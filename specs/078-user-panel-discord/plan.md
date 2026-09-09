# Implementation Plan: User Panel Discord + Defer Collapse + Voice Join Opt-in

**Branch**: `078-user-panel-discord` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/078-user-panel-discord/spec.md`

**Note**: `.specify/feature.json` → `specs/078-user-panel-discord`. Clarifications + specify amendment applied (camera/blur off user panel; single JOIN + lazy preview; leave left of Discord trio off-stage).

## Summary

1. **Remove channel-list collapse** from the live UI (always expanded; ignore legacy prefs; park redesign in backlog).
2. **Restyle the user panel** to Discord’s idle composition: identity (avatar + online + handle / “online”) left; mic + deafen (visual chevrons) + settings right—always visible; mic/deafen disabled when not in a call.
3. **Camera + blur never on the user panel**; they live on voice/video channel chrome. **Leave** on the panel only when in-call and off-stage, to the **left** of the Discord trio.
4. **Replace dual join buttons** with a single **JOIN** control; camera default **off**; opt-in on the same surface with **lazy** preview after opt-in; **blur** on pre-join only while camera is opted in; keep 032 banco/palco join semantics (`cam_on` true/false).

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`. Backend join `cam_on` already supports bank/stage (032)—no API change expected.

**Primary Dependencies**: `UserPanel.tsx`, `AppShell.tsx`, `Sidebar.tsx`, `VoiceChannel.tsx`, `uiPrefs.ts`, voice session (`VoiceSession`), blur preference (`blurPreference`), i18n catalogs, stage call chrome (existing).

**Storage**: Client prefs only — stop reading/applying `mesa.channelsListExpanded` for collapse UI (ignore or clear). No new server tables.

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md); optional FE visual/checklist; reuse existing voice join contract tests for `cam_on` bank/slot (032) if join payload unchanged.

**Target Platform**: Browser — authenticated shell + voice/video channel.

**Project Type**: Web UI / shell chrome + voice pre-join UX.

**Performance Goals**: No extra network for panel layout; lazy camera preview only after opt-in (avoid getUserMedia on default pre-join).

**Constraints**: Discord structure without full Discord skin; decorative mic/deafen chevrons; no device pickers; no display-name field; collapse redesign out of scope.

**Scale/Scope**: Shell + user panel + VoiceChannel pre-join + CSS/i18n; ~FE-only delivery.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc; reuse 032 join contracts |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/078-user-panel-discord/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-discord.md
│   ├── channels-collapse-defer.md
│   └── voice-join-optin.md
├── reference-discord-user-panel.png
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx          # Discord layout; always mic/deafen/settings; leave off-stage only; no cam/blur
frontend/src/shell/AppShell.tsx           # force channels expanded; drop collapse class / toggle wiring
frontend/src/shell/Sidebar.tsx            # remove hide-channels toggle + peek affordances
frontend/src/preferences/uiPrefs.ts       # ignore/clear channelsListExpanded for collapse
frontend/src/pages/VoiceChannel.tsx       # single JOIN + camera opt-in + lazy preview + pre-join blur gate
frontend/src/styles/mesa-theme.css        # user-panel Discord chrome; remove/disable collapse CSS paths as needed
frontend/src/i18n/catalogs/{en,pt-BR}.ts  # join/status/panel copy; retire dual-join / hide-channels strings usage
frontend/src/components/CameraBlurMenu.tsx # reuse on voice pre-join / stage (not panel)
# Stage/in-call cam+blur+leave: existing voice/stage chrome (keep; ensure panel does not duplicate cam/blur)
```

**Structure Decision**: FE-only. Backend join/media contracts from 032 remain; UI presentation of pre-join changes only.

## Complexity Tracking

N/A
