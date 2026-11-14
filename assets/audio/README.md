# assets/audio

Short application sound effects generated with Suno from [`docs/prompts/efeitos-sonoros-suno.md`](../../docs/prompts/efeitos-sonoros-suno.md).

| File | Effect | Duration |
|---|---|---|
| `mention.mp3` | A user receives a mention or reply notification | About 2 s |
| `call-join.mp3` | Someone joins an ongoing voice/video call | About 2 s |
| `call-leave.mp3` | Someone leaves the user's active voice/video call, or the user leaves voluntarily | About 2 s |

Each final file was prepared externally from its corresponding Suno recording (`mention-v2.mp3`, `call-join-v2.mp3`, or `call-ended-v2.mp3`), trimmed to about 2 seconds, and copied in directly. The v2 sources remain alongside the published files for future edits. The `frontend-v2-sound-effects` specification covers their integration with the v2 frontend.
