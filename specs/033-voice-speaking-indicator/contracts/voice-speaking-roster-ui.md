# Contract: Voice speaking roster UI

**Feature**: [033-voice-speaking-indicator](../spec.md)  
**Related**: [data-model.md](../data-model.md), roster [028](../../028-voice-call-roster/), avatars [030](../../030-voice-roster-avatars/)

## No new HTTP/WS APIs

Speaking is derived from LiveKit room events on the client.

## VoiceSession surface

```ts
// conceptual
speakingAccountIds(): ReadonlySet<string> | string[];
// updated on RoomEvent.ActiveSpeakersChanged
// cleared when session ends
```

Identity in the set MUST match occupancy `account_id` (UUID string).

## Roster row UI

Each `.voice-roster-item` MUST include:

1. Existing avatar + handle  
2. Mic icon — muted vs unmuted from `mic_on`  
3. Output/headphones icon — always «listening» style (no deafen control)  
4. When `speaking === true`: CSS class (e.g. `is-speaking`) on **both** icon wrappers applying the **same** aura animation  

### Speaking predicate (viewer)

```text
speaking(accountId) =
  voice.live()
  && speakingAccountIds.has(accountId)
  && occupant.mic_on
```

If `!voice.live()`, icons render without `is-speaking`.

## Accessibility

- Mic icon: `aria-label` «Microfone ligado» / «Microfone desligado»  
- Output icon: `aria-label` «A ouvir» (or equivalent PT)  
- Optional: row `aria-label` includes «a falar» when speaking  

## Visual

- Aura perceptible in light and dark themes  
- Same treatment on mic and output icons  
- No requirement for stage tile speaking ring in this feature  

## Manual contract checks

1. Two users in call — A speaks → B sees aura on A’s mic + headphones ≤1 s  
2. A mutes → aura stops even if noise  
3. C views roster from text channel (not in call) → icons, no aura  
4. Themes: icons + aura readable  
