# Implementation Plan: Restore Reliable Webcam Display After Screen-Share Work

**Branch**: `091-fix-webcam-attach` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/091-fix-webcam-attach/spec.md`

## Summary

Após o wiring de screen-share (082+) e Grade unificada (083), a webcam fica por vezes em branco em **Composition e Grade** com cam-on — até leave/rejoin ou start share “acordar” o layout. Causa provável: (1) **split** entre `VoiceSession.localVideoEl` e a cópia `localVideoEl` de `VoiceChannel` (toggle mid-call não notifica a página), (2) **layout one-shot** antes dos hosts DOM existirem, mitigado só parcialmente por remounts. Corrigir unificando a fonte do preview local, garantindo rebind em mount de tile/slot, e validando latências (local ≤2s; remount ≤1s; remoto ≤2s após track+host). **PiP fora de âmbito.**

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend); Rust backend unchanged  
**Primary Dependencies**: livekit-client (`LocalVideoTrack.attach`, room join `onLocalTrack`), Solid effects/refs, existing `layoutMedia` / Grade keys  
**Storage**: N/A (no schema)  
**Testing**: Manual E2E (Composition + Grade, mid-call cam, two-user); `npx tsc --noEmit`; optional unit on “sync local preview” helper if extracted  
**Target Platform**: Modern browsers (WebRTC / LiveKit)  
**Project Type**: Web app — frontend media-layout fix  
**Performance Goals**: Local self-view ≤ ~2s after cam-on; remount recover ≤ ~1s; remote ≤ ~2s after track + host ready (FR-013–015)  
**Constraints**: Keep 082 product rules (screens Grade-only; cam independent of share); do not break working PiP (`FloatingVoicePip`); no new SFU protocol  
**Scale/Scope**: VoiceChannel Composition + Grade camera surfaces only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Library-First | PASS | Prefer small sync/bind helpers in VoiceChannel / VoiceSession over new subsystems |
| II. CLI Interface | N/A | UI / LiveKit attach |
| III. Test-First | PASS | Reproduce blank → fix → quickstart SC matrix; tsc gate |
| IV. Integration Testing | PASS | Two-browser cam-on without share; mid-call toggle; remount catalysts |
| V. Observability | PASS | Failures remain user-visible blanks; no silent infinite retry without bound |
| VI. Versioning & Breaking | PASS | Behavior fix; no API/schema break |
| VII. Simplicity | PASS | Unify local preview source + host-mount rebind; reject “share to wake” as design |

**Post-design re-check**: PASS — contracts describe attach/rebind invariants without new persistence.

## Project Structure

### Documentation (this feature)

```text
specs/091-fix-webcam-attach/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── local-preview-coherence.md
│   └── host-mount-rebind.md
└── tasks.md             # Phase 2 (/speckit-tasks) — not created here
```

### Source Code (expected touchpoints)

```text
frontend/src/voice/VoiceSession.tsx       # toggleCam → notify page (dispatchLocalTrack); keep session el canonical
frontend/src/pages/VoiceChannel.tsx       # layoutMedia uses session preview; sync on camOn; host attach rebind
frontend/src/components/CameraGrid.tsx    # verify attachSlot / attachGradeTile still fire on remount
frontend/src/video/liveClient.ts          # join onLocalTrack path stays source for initial publish
frontend/src/shell/FloatingVoicePip.tsx   # regression check only (out of scope to change)
```

**Structure Decision**: Frontend-only attach/layout coherence on existing voice surfaces; PiP left alone unless accidentally regressed.

## Complexity Tracking

No constitution violations.
