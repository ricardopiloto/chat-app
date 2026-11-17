# Proposal

## Why

Several call and chat UI regressions make participant controls misleading or ineffective and leave unnecessary badges and misaligned text. Call tiles also need consistent participant status and a less cluttered default view.

## What Changes

- Make each remote participant's 0–200% volume control audibly effective, including after reconnection; keep the local tile free of that control.
- Show LiveKit connection quality for every call participant, including remotes, in the existing top-right tile position.
- Hide tile chips and the complete caption by default, revealing them on desktop hover or keyboard focus and toggling them with a tap on touch devices.
- Report each participant's deafened state through voice occupancy and show a deafened icon beside the existing mic/camera state icons.
- Remove the visible “Speaking” chip from call tiles while keeping existing speaking rings and roster cues.
- Remove the “Decrypted on this device” overlay from chat attachment thumbnails while retaining the encrypted caption and zoom control.
- Align the “On the bench” icon and text in the composition footer.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-participant-volume`: effective remote playback volume and correct local/remote ownership.
- `frontend-v2/voice-session`: per-participant quality, tile information reveal, deafened occupancy and tile state, and speaking presentation. Existing mic/cam occupancy and tile behavior is not specified separately; this is the closest existing capability for the added state.
- `frontend-v2/text-messaging`: attachment thumbnail presentation.
- `frontend-v2/voice-composition`: bench heading alignment.

## Impact

Frontend call session, participant roster and tiles, composition/grid/floating views, attachment thumbnail, targeted CSS, API occupancy/media types, and possibly voice/chat localization catalogs. Backend voice occupancy domain, database queries and migration, media API, and occupancy contract tests (`backend/src/domain/voice_occupancy.rs`, `backend/src/db/voice_occupancy.rs`, `backend/src/api/voice.rs`, `backend/migrations/`, `backend/tests/contract/voice_occupancy.rs`) gain the additive `deafened_on` field; REST and `voice.occupancy` snapshots carry it.
