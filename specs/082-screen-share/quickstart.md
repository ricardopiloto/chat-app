# Quickstart: 082-screen-share

Manual validation after implementation. Needs two browsers/accounts on the same voice/video channel.

## Prerequisites

- Backend + LiveKit + frontend running (usual Mesa dev).
- Two users (A, B) members of the same server with a voice/video channel.
- Optional third check: channel with E2EE enabled (spike gate).

## Setup

```bash
# backend
cd backend && cargo run

# frontend
cd frontend && npm run dev
```

```bash
cd backend && cargo test
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### 1. Start / stop in Grade (P1)

1. A and B join the call; both set header to **Grade**.
2. A clicks screen share on UserPanel → picks a window/tab (optionally with audio).
3. **Expect**: B sees A’s screen tile; A sees own screen tile; cam states unchanged.
4. A stops via panel (or OS share indicator).
5. **Expect**: screen tiles gone; occupancy `screen_on` false.

### 2. Control only in Grade

1. A in call, switch header to **Composição**.
2. **Expect**: screen-share control **not** on UserPanel.
3. Switch back to Grade → control returns.

### 3. Composition hides tiles, keeps audio

1. A sharing in Grade with system/tab audio if available.
2. B switches to **Composição**.
3. **Expect**: B does not see screen tiles; still hears share audio (if captured); indicators still on.
4. B switches to Grade → sees screen again.

### 4. No auto mode / no restore

1. Both in Composição; A switches to Grade and starts share.
2. **Expect**: B’s mode stays Composição (not forced to Grade).
3. A stops share.
4. **Expect**: nobody’s mode flips; no scene «restore» behaviour.

### 5. Indicators

1. With share active: Grade seg shows indicator; sidebar voice channel-item shows indicator (even if B is on another channel).
2. Last share stops → both indicators clear.

### 6. Multi-share + spotlight

1. A and B both share in Grade.
2. **Expect**: both screens visible, cameras secondary.
3. B spotlights A locally.
4. **Expect**: only B’s layout changes; A unaffected.
5. A stops → B’s spotlight clears; B’s screen remains.

### 7. Idempotence / cancel

1. Start while already sharing → no error.
2. Cancel native picker → no `screen_on`, no indicator.

### 8. E2EE gate (encrypted channel)

1. Enable channel E2EE; share screen.
2. **Expect**: remote sees decrypted screen (and audio if any). If not, treat as blocking for encrypted rooms (research R4).

## Done when

- Scenarios 1–7 pass; 8 pass or ticketed as E2EE follow-up before encrypted GA.
- `cargo test` + `tsc --noEmit` clean.
