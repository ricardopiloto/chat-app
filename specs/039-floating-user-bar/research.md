# Research: 039-floating-user-bar

## 1. Onde montar o painel

**Decision**: Componente `UserPanel` no **fundo da coluna Sidebar** (abaixo da lista de canais / footer actual), `flex: none`, sempre visível no shell autenticado — visual Discord user area, não PiP flutuante.

**Rationale**: Spec pede canto inferior da navegação lateral; o footer da sidebar já existe e é o sítio natural.

**Alternatives considered**: Overlay fixed no canto do viewport — rejeitado (sai da coluna). Dentro do TopBar — rejeitado (não é lateral).

## 2. Predicado «sítio activo» dos controlos

**Decision**:

```text
onActiveVoiceStage =
  voice.connected
  && params.channelId === voice.channelId()
  && vista é o canal de voz da chamada (não só URL de texto)

callControlsOnUserPanel = voice.connected && !onActiveVoiceStage
callControlsOnStage     = onActiveVoiceStage
callControlsHiddenOnPanel = onActiveVoiceStage  // só identidade+settings
callControlsDisabledOnPanel = !voice.connected  // botões visíveis disabled
```

Alinhar com o predicado já usado para PiP / `voice-connected-bar` em `AppShell` (`params.id !== voice.channelId()` quando connected ≈ off-stage).

**Rationale**: Clarificações 2026-09-06 — um sítio de cada vez.

**Alternatives considered**: Sempre mostrar controlos na barra (disabled no palco) — rejeitado pela clarificação (ocultar grupo no palco).

## 3. Deafen

**Decision**: Estado `deafened` em `VoiceSession` (sessão de chamada). Ao activar: `setMicrophoneEnabled(false)` + mutar/silenciar áudio de todos os remote participants (volume 0 ou `setSubscribed`/HTMLMediaElement.muted nos attaches). Ao desactivar deafen: restaurar volumes; **não** auto-desmutar mic (utilizador decide) — **excepto** regra Discord da spec: desmutar mic **enquanto deafened** limpa deafen. Activar deafen **sempre** muta mic.

Persistência: só enquanto a chamada dura; limpar no hangup.

**Rationale**: Spec FR-006/007; sem API BE necessária.

**Alternatives considered**: Deafen só no servidor — overkill. Deafen sem mutar mic — rejeitado pela spec.

## 4. Partilha de mic/cam/leave

**Decision**: Extrair toggles para métodos em `VoiceSession` (`toggleMic`, `toggleCam`, `hangUp`) usados por `VoiceChannel` e `UserPanel`, para FR-012 (estado único). Blur: manter lógica actual; montar `CameraBlurMenu` no sítio activo junto da câmara.

**Rationale**: Evita drift entre palco e barra.

## 5. Conta / TopBar

**Decision**: Remover chip/menu de conta do `TopBar`; abrir o mesmo menu a partir do clique avatar/nome e do botão definições no `UserPanel`.

**Rationale**: FR-003/004/015.

## 6. Coordenação com 040-remove-connected-bar

**Decision (para este plan)**: Implementar 039 conforme a **sua** spec (sair na barra off-stage; PiP «não alterar» segundo Assumptions 039). Se 040 já removeu a barra ligada e pôs hangup no PiP: **manter hangup na UserPanel** como sítio canónico off-stage para leave; PiP pode ficar só «Voltar» (alinhar 040 na implementação se ambas forem merged). Documentar no implement para não triplicar Sair (barra ligada + PiP + UserPanel).

**Rationale**: 039 é o painel Discord; 040 remove cromado duplicado da connected-bar.

**Alternatives considered**: Adiar 039 até 040 — desnecessário se o predicado off-stage for o mesmo.
