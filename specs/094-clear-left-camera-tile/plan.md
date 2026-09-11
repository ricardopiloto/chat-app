# Implementation Plan: Clear Left Participant Camera from Stage

**Branch**: `094-clear-left-camera-tile` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/094-clear-left-camera-tile/spec.md`

**Note**: Clarifications (2026-09-11): clear Composição + Grade + PIP; within ~2s; Grade/PIP remove tile + reflow; Composição may empty/free without frozen video.

## Summary

When a participant **leaves** the call with camera on, peers (and local chrome) must not keep a **frozen last video frame**. Clear camera media and drop Grade/PIP camera tiles; Composição may keep an empty/free seat **without** video. Mirror the 088 unsubscribe/map-cleanup pattern for **camera** + participant disconnect, scrub DOM hosts, and ensure PIP refreshes on disconnect. FE-only; no API/schema change expected.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; LiveKit client events.

**Primary Dependencies**: `livekit-client` (`TrackUnsubscribed`, `ParticipantDisconnected`), `VoiceChannel.tsx` (`remotesCam`, `refreshGradeLists`, `layoutMedia`), `FloatingVoicePip.tsx`, `liveClient.ts` (already wires unsubscribe/disconnect from 088).

**Storage**: N/A — ephemeral media Maps + DOM; occupancy/grid WS already exist.

**Testing**: Manual two-browser leave-with-cam; Composição + Grade + PIP; `npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Modern browsers with LiveKit WebRTC.

**Project Type**: Web app — voice stage media cleanup.

**Performance Goals**: Clear within ~2s after leave is observable (clarify); prefer same event tick as disconnect/unsubscribe.

**Constraints**: Do not regress camera-off-while-still-in-call (avatar/off seat OK); no Mesa visual redesign; Composition empty seats allowed; no new backend unless planning proves missing signals (assumed sufficient).

**Scale/Scope**: VoiceChannel stage + FloatingVoicePip; related layout helpers only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A / PASS via quickstart + tsc |
| Complexity | Low — extend 088-style cleanup to camera leave |
| Backend | None expected |

**Gate: PASS**

### Re-check pós-Phase 1

UI/media contracts + data-model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/094-clear-left-camera-tile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── stage-camera-clear-on-leave.md
│   └── pip-camera-clear-on-leave.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/pages/VoiceChannel.tsx     # scrub cam on unsubscribe/disconnect; Grade list membership; Composition video clear
frontend/src/shell/FloatingVoicePip.tsx # ParticipantDisconnected (+ prune hosts); no frozen PIP tile
frontend/src/video/liveClient.ts        # verify detach + handlers already wired (088); harden if gaps
frontend/src/components/CameraGrid.tsx  # only if tile key/lifecycle needs assist (prefer VoiceChannel)
```

**Structure Decision**: Client-side media lifecycle fix. Reuse 088 event wiring; add identity-scoped DOM scrub and correct Grade camera membership so leave drops tiles; Composition clears video even if seat briefly remains empty/free.

## Complexity Tracking

> No unjustified complexity. Parallel to 088; scoped to leave/camera ghosts.
