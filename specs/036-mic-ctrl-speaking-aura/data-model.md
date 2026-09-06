# Data Model: 036-mic-ctrl-speaking-aura

Sem persistência. Estado derivado do cliente.

## Local speaking on mic control

| Campo | Fonte | Uso |
|-------|--------|-----|
| `account_id` (me) | `props.me.id` | Match em `speakingAccountIds` |
| `mic_on` | `micOn()` / `voice.micOn()` | Gate: sem aura se false |
| `speaking` | `voice.speakingAccountIds().has(me)` | Actividade de voz (033) |
| `aura_visible` | `live && mic_on && speaking` | Classe CSS no botão |

## Relationships

```text
VoiceSession.speakingAccountIds ──► VoiceChannel mic button classList
033 roster .is-speaking          ──► mesma família CSS / keyframes
```

## State transitions

```text
[mic on, silent] --fala--> [mic on, aura]
[mic on, aura] --para fala--> [mic on, silent]
[mic on, aura] --mute--> [mic off, sem aura]
[mic off, *] --ruído--> [mic off, sem aura]
```

## Validation

- Rótulos acessíveis inalterados.
- Sem aura em cam/blur/Sair.
