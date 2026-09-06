# Research: 035-voice-leave-release-media

## R1 — Gap actual: palco vs barra vs dropped

**Decision**: Hoje `VoiceChannel.leave()` faz `stopBlurProcessor` + `localCamTrack.stop()` **antes** de `voice.hangup()`. A barra persistente (`AppShell` → `hangup`) e `dropped()` **não** passam por esse stop explícito — só `leaveVoice` + `session.disconnect()` (ou null session no drop). Unificar: todo fim de sessão chama o mesmo `releaseLocalCapture`.

**Rationale**: FR-002 / SC-002 — Sair na barra deve libertar como no palco; disconnect inesperado não pode deixar captura fantasma.

**Alternatives considered**: Só documentar que `room.disconnect(true)` basta (rejeitado — blur + tracks GUM pré-publish / refs `localCamTrack` podem ficar activas); duplicar stop só no AppShell (dois caminhos).

## R2 — Helper `releaseLocalCapture` (caminho único)

**Decision**: Extrair `frontend/src/voice/releaseLocalCapture.ts` (ou colocalizar) com API idempotente:

1. Se houver track de câmera local conhecida: `await stopBlurProcessor(track)` (ignore erros), depois `track.stop()`.
2. Se `LiveSession` / `Room` ainda existir: `setCameraEnabled(false)` + `setMicrophoneEnabled(false)` (best-effort) e/ou confiar em `disconnect(true)` que já existe em `liveClient.ts`.
3. Parar quaisquer `MediaStreamTrack` locais ainda vivos obtidos no join (áudio/vídeo) passados ao helper.
4. Limpar refs (`localCamTrack`, video el bindings) no caller.
5. Segunda chamada = no-op seguro (FR-005).

Chamadores: `hangup`, `VoiceChannel.leave` (ou só hangup se leave só delegar), `dropped`, `abortFailedJoin` (031 / FR-008), `pagehide` via hangup.

**Rationale**: Um caminho = FR-001/002/008; partilha com 031 (research R6 de 031).

**Alternatives considered**: Só melhorar `liveClient.disconnect` (não cobre GUM antes de publish nem blur); só `track.stop` no leave do palco (barra/dropped ficam).

## R3 — Ordem: local primeiro, remoto depois (FR-007)

**Decision**: Em `hangup` / leave:

1. `releaseLocalCapture(...)` **sempre** (mesmo se rede má).
2. `leaveVoice(channelId).catch(...)` best-effort.
3. `session.disconnect().catch(...)` se ainda houver sessão.
4. Limpar estado UI (`live=false`, ids null).

**Rationale**: Spec: UI «fora» não pode coexistir com captura activa; leave HTTP pode falhar.

**Alternatives considered**: Esperar leave HTTP antes de stop (rejeitado — SC-005 / FR-007).

## R4 — Move de canal (`disconnectLivekitOnly`)

**Decision**: Antes de abandonar a mesa antiga, `releaseLocalCapture` na sessão anterior **ou** garantir que o novo `connect` só mantém devices pedidos de novo. Na prática: `disconnectLivekitOnly` deve libertar captura da sessão LiveKit antiga (disable + disconnect); se o novo join pedir mic/cam de novo, novo GUM. Não deixar tracks da mesa A a correr enquanto a UI já está na mesa B.

**Rationale**: FR-002 cenário move; SC-004.

**Alternatives considered**: Reutilizar as mesmas tracks no move (optimização fora de âmbito; risco de captura «presa» se o segundo join falhar).

## R5 — Unload / `pagehide`

**Decision**: Manter `pagehide` → `hangup` (já existe). Garantir que hangup passa por `releaseLocalCapture`. Documentar no quickstart: browsers podem limitar trabalho em unload — best-effort (SC-006). Preferir `pagehide` a `beforeunload` (já alinhado).

**Rationale**: Clarificação sessão 2026-09-06.

**Alternatives considered**: `navigator.sendBeacon` só para leave HTTP (não liberta hardware); `beforeunload` síncrono stop (menos fiável / UX pior).

## R6 — Relação com 031

**Decision**: `abortFailedJoin` (031) **deve** chamar o mesmo `releaseLocalCapture` (ou ser o mesmo módulo). 035 é dono do contrato de libertação de hardware; 031 é dono de «não conectado» + mensagens. Implementação conjunta ou 035 extrai helper e 031 passa a usá-lo.

**Rationale**: Specs cruzadas; FR-008.

## R7 — Como observar «libertado»

**Decision**: Critério de teste = indicador de captura do browser (ícone de mic/câmera na barra de endereço / permissões do sítio) **off** após leave, sem F5. Secundário: `MediaStreamTrack.readyState === 'ended'` em tracks locais se inspeccionáveis em DevTools.

**Rationale**: SC-001; alinhado a Assumptions da spec.

## R8 — Testes

**Decision**: Quickstart manual (palco, barra, move, drop simulado, join falhado, re-entrar); `tsc --noEmit`. Sem contract BE novo.

**Rationale**: Comportamento 100% browser/hardware.
