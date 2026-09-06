# Research: 033-voice-speaking-indicator

## R1 — Fonte de «a falar»

**Decision**: Usar LiveKit Client `RoomEvent.ActiveSpeakersChanged` (e/ou `participant.isSpeaking`) na `Room` da sessão activa. `participant.identity` = `account.id` (UUID string, já mintado em `token::mint`). Sem API/WS de speaking.

**Rationale**: Clarificação; livekit-client ^2.15 já usado; identity alinhada a `account_id` do roster.

**Alternatives considered**: Analisar `AudioContext` por track (mais código); reportar speaking via PATCH/WS (rejeitado); só `mic_on` (não é actividade de voz).

## R2 — Onde vive o estado speaking

**Decision**: Em `VoiceSession`, signal `speakingAccountIds: Accessor<Set<string> | string[]>` actualizado no handler ActiveSpeakers enquanto há `session`/`room`; limpar no hangup/disconnect. Sidebar lê via `useVoiceSession()` só quando `live()` e canal da sessão coincide com o canal da linha (ou qualquer occupant na mesma room — viewer na chamada).

**Rationale**: Um único room; Sidebar já tem VoiceSession; evita duplicar listeners no Sidebar.

**Alternatives considered**: Listener só no Sidebar (precisa da Room); context separado.

## R3 — Gate «só quem está na chamada»

**Decision**: Aura se e só se `voice.live() === true` **e** o `account_id` do speaker está no set ActiveSpeakers da room actual. Se o viewer não está na chamada, renderizar ícones sem classe speaking (mesmo que outro canal mostre roster).

**Rationale**: FR-010 / clarificação.

**Alternatives considered**: Aura para todos que vêem a lista (rejeitado).

## R4 — Mic mudo vs speaking

**Decision**: Não mostrar aura se `occupant.mic_on === false`, mesmo que LiveKit reporte nível residual. Preferir também filtrar local participant quando `micOn()` false.

**Rationale**: FR-004.

**Alternatives considered**: Confiar só em ActiveSpeakers (pode falhar com eco).

## R5 — Ícones

**Decision**:

- Mic: reutilizar `IconMicOn` / `IconMicOff` conforme `mic_on`.
- Saída: novo `IconHeadphones` (ou speaker) sempre no estado «a ouvir» — sem variante deafen nesta feature.
- Ambos com wrapper `.voice-roster-media-icon` + `.is-speaking` para a **mesma** aura CSS.

**Rationale**: FR-001/002/002a; IconMic já existe.

**Alternatives considered**: Deafen toggle (fora de âmbito); aura só no avatar (rejeitado pelo pedido).

## R6 — Histerese / CSS

**Decision**: Aura via CSS (`box-shadow` / `outline` / pulse keyframes) em `.is-speaking`. Opcional debounce 100–300 ms no signal se ActiveSpeakers oscilar; LiveKit já faz alguma estabilização — ajustar só se quickstart mostrar flicker.

**Rationale**: FR-005; manter simples.

**Alternatives considered**: Canvas equalizer (fora de âmbito).

## R7 — Mapeamento identity

**Decision**: Tratar `p.identity` como `account_id` string (UUID). Se no futuro identity mudar, centralizar helper `identityToAccountId`.

**Rationale**: `voice.rs` passa `&account.id.to_string()` a `token::mint`.
