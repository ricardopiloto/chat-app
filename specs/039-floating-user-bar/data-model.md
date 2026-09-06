# Data Model: 039-floating-user-bar

## Entities (client runtime)

### UserPanelView

| Field | Notes |
|-------|--------|
| account | `me` (id, handle, has_avatar) |
| online | sempre true nesta entrega |
| settingsOpen | menu conta |
| showCallControls | `connected && !onActiveVoiceStage` |
| hideCallControls | `onActiveVoiceStage` |
| disableCallControls | `!connected` |

### CallControlSharedState (VoiceSession)

| Field | Type | Notes |
|-------|------|--------|
| connected | bool | em canal de voz |
| channelId / channelName | id/name | chamada activa |
| micOn | bool | |
| camOn | bool | |
| deafened | bool | **novo** |
| blurLevel | existing | via UI blur menu |
| speakingAccountIds | Set | 033/036 — aura no sítio activo |

### ActiveCallControlsSite

| Value | When |
|-------|------|
| `stage` | `onActiveVoiceStage` |
| `user_panel` | `connected && !onActiveVoiceStage` |
| `none` | `!connected` (barra mostra controlos disabled) |

## State transitions

### Deafen

```text
deafened=false, mic=? 
  --enable_deafen--> deafened=true, mic=false, remotes silent
deafened=true
  --disable_deafen--> deafened=false, remotes audible; mic stays false until user unmutes
deafened=true, mic=false
  --user_unmute_mic--> deafened=false, mic=true, remotes audible
hangup / disconnect --> deafened=false, clear remote mute
```

### Call controls site

```text
enter call on stage --> site=stage; panel hides call group
navigate to text --> site=user_panel; panel shows enabled controls; stage chrome not interactive for those actions
return to stage --> site=stage; panel hides call group again
leave call --> site=none; panel shows disabled controls
```

## Validation rules

- Nunca dois sítios com botões de chamada **activos** em simultâneo.
- Clique em controlo disabled: no-op.
- Deafen implica mic off; unmute mic limpa deafen.
- Avatar/nome/settings sempre visíveis no painel (excepto constraints de viewport que escondam a sidebar inteira — aí o painel segue a sidebar/drawer).

## Relationships

```text
AppShell → Sidebar → UserPanel
AppShell → main → VoiceChannel (stage controls)
UserPanel ──uses──> VoiceSession
VoiceChannel ──uses──> VoiceSession
```
