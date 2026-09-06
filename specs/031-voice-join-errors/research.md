# Research: 031-voice-join-errors

## R1 — Ordem join API vs LiveKit

**Decision**: Manter `POST .../voice/join` (ocupação) **antes** de `joinLiveRoom`. Em falha pós-join, chamar `leaveVoice` + limpar tracks. Flash breve de ocupação aceite (clarificação).

**Rationale**: Reordenar (LiveKit antes do join) exigiria token/fluxo sem ocupação e redesenho BE; revert cumpre SC-002 (≤5 s).

**Alternatives considered**: Join só após `room.connect` ok (maior redesign); optimistic UI sem upsert até sucesso (mudança de contrato 028).

## R2 — Abort path no `connect` catch

**Decision**: Extrair `abortFailedJoin({ channelId, joined, localTracks })`:

1. Parar blur/processor se activo; `track.stop()` em áudio/vídeo locais.
2. Se `joined` (join API já respondeu): `await leaveVoice(channelId).catch(...)`.
3. Limpar refs locais (`localCamTrack`, session parcial); **não** chamar `bindLive`; garantir `live === false`.
4. `setError` com mensagem categorizada.

**Rationale**: Hoje o catch só faz `setError` → ghost occupancy + tracks órfãs. Reutiliza leave 028 e alinha a 035 (libertar hardware).

**Alternatives considered**: Sempre `voice.hangup()` (precisa `channelId` em sessão — só setado em `bindLive`); só LiveKit disconnect sem leave (ghost permanece).

## R3 — Falha só da câmera vs falha de áudio

**Decision**:

- Preferir captura **áudio+vídeo**; se falhar, tentar **só áudio**.
- Se áudio ok e vídeo falhou: `join` com `cam_on: false`, bindLive, aviso categoria «dispositivo/permissão de câmera».
- Se áudio falhar (ou join/LiveKit falhar): abort completo (R2).

**Rationale**: Clarificação 2026-09-06 — câmera isolada não aborta; áudio/sala sim.

**Alternatives considered**: Manter GUM único A/V (rejeitado — trata falha de cam como falha total); modo «só ouvinte» sem áudio (fora de âmbito).

## R4 — Taxonomia de erros (PT)

**Decision**: Mapper central (ex. `joinErrors.ts`) → categorias:

| Categoria | Exemplos |
|-----------|----------|
| `permission` | `NotAllowedError`, permissão negada |
| `device` | `NotFoundError`, `NotReadableError`, dispositivo ocupado |
| `connection` | falha `join` HTTP, LiveKit `connect`/publish, rede |
| `generic` | resto |

Mensagens curtas em PT por categoria; opcional detalhe técnico só em log, não na UI.

**Rationale**: FR-004 / clarificação.

**Alternatives considered**: Uma frase genérica; `err.message` cru do browser (inglês/ruído).

## R5 — Move entre canais de voz

**Decision**: Se `disconnectLivekitOnly` + novo `connect` falhar **após** join API do destino: `leaveVoice` no destino. Se falhar **antes** do join do destino: ocupação antiga pode ainda existir (LiveKit já desligado) — documentar no quickstart; polish opcional: `leaveVoice` no canal antigo se connect abortar antes do join (só se o produto já tiver abandonado a mesa antiga na UI). Preferência MVP: garantir sem fantasma no **novo** canal; alinhar leave do antigo se a UI já mostrou move.

**Rationale**: Spec: join novo falhado → não fantasma no novo; fora de ambas se leave do anterior já ocorreu.

**Alternatives considered**: Sempre leave explícito do antigo antes do connect (pode divergir do move atómico do BE).

## R6 — Relação com 035

**Decision**: O mesmo `abortFailedJoin` satisfaz FR-008 de 035 (libertar captura em join falhado). Implementar limpeza de tracks aqui; 035 pode reutilizar o helper no leave explícito.

**Rationale**: Specs cruzadas; um caminho de limpeza.

## R7 — Testes

**Decision**: Quickstart manual (falha GUM áudio, falha pós-join simulável, falha só cam); `tsc --noEmit`. Sem novo contract BE obrigatório (leave já coberto).

**Rationale**: Bug é de orquestração FE; BE leave já correcto.
