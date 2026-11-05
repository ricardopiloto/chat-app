# E2EE gaps — Phase 1

The Phase 1 specification (FR-016, US5, Assumptions) defines completion of end-to-end protection **in the web client** for the browser families exercised in the Phase 0 spike on this machine: Chromium and Firefox/Gecko, including Zen.

## Included in Phase 1

- Text: AES-256-GCM with a client-generated `server_key`; the backend persists only ciphertext.
- Voice/video: the same `server_key` is used as a frame key via `livekit-client`'s `ExternalE2EEKeyProvider` (Insertable Streams / Encoded Transforms).
- Key handoff: `crypto_box_seal` between members; the server stores only opaque envelopes.
- There is no route or UI control to disable this protection. Server-side recording is deferred.

## Explicit gaps that do not block Phase 1

- **Safari / WebKit (macOS)** and stock webviews: Insertable Streams / Encoded Transforms may be absent or behave differently. They are outside Phase 1 acceptance criteria.
- **Windows:** This platform was not validated in this phase. A third Windows client in the same channel is a gap to record, not a failure of the Linux/web MVP.
- **Tauri / WebKitGTK on Linux:** The Phase 0 spike found `RTCPeerConnection` undefined in this machine's RPM. A native client is deferred to a future port.
- If no already-synchronized member is online when an invitation is accepted, key handoff remains pending. The UI shows “synchronizing key” until a member with the key opens the client.

## Password recovery

The server stores `account.recovery_vault`: the identity secret key wrapped with a key derived from a code known only to the client. Neither the code nor the secret key is sent to the server. `GET /api/auth/me` exposes only `has_recovery_key`. The vault is returned by `POST /api/auth/recovery/key/start` after an Ed25519 signature over a one-time challenge. An operator-code reset (`POST /api/auth/recovery/code/redeem`) creates a new identity and removes that account's envelopes. Recovery-key redemption (`POST /api/auth/recovery/key/redeem`) changes the password and vault for the same identity without changing envelopes. See §9 of `docs/v2/contracts/crypto-formats.md` for the format.

Measurements from 2026-10-08 using `cargo test --test scale` (debug, Linux 7.2.8, Ryzen 9 3900X, SQLite 3.46.0) are recorded in `docs/backlog/TR-item18-recuperacao-de-senha.md` §12. Replacing the identity of an account in 20 servers of 300 members took p95 27 ms and emitted 5,980 events. Per-account `DELETE` uses `idx_key_envelope_account` (p95 0.17 ms; without the index, a scan took p95 3.5 ms). Saving an account's own envelope with 1,001 envelopes took p95 0.91 ms. A burst of 300 responses produced exactly one write and 299 rejections, averaging 0.83 ms. Replaying 50 pending items took p95 9.6 ms and emitted one event per item. All criteria passed without limiting fan-out. If the bots change applies envelopes per channel, it multiplies these rows and events by the channel count.

## How to inspect (SC-006)

1. Messages: `sqlite3 backend/chat.db "select content_ciphertext from message limit 1;"` — the blob is not the original text.
2. Envelopes: `key_envelope.sealed_key` does not contain the plaintext `server_key`.
3. LiveKit: the SFU forwards frames; the instance operator cannot obtain decodable audio/video without client keys.
