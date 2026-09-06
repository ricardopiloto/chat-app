# Research: 032-voice-join-camera-choice

## R1 — Pré-join: dois botões vs toggle

**Decision**: Dois botões/acções distintos («Entrar com câmera» / «Entrar sem câmera» ou rótulos equivalentes claros). Manter «Vídeo de teste» como acção secundária existente.

**Rationale**: Clarificação 2026-09-06; FR-006. Um único «Entrar» + toggle esconde a escolha e mantém o enviesamento actual para vídeo.

**Alternatives considered**: Toggle + um Entrar (rejeitado pela clarificação); preferência persistente em conta (fora de âmbito).

## R2 — Join sem câmera e auto-assign de slot

**Decision**: Em `POST .../voice/join`, se `cam_on` efectivo for `false`, **não** chamar `auto_assign_first_empty`. Occupante fica no banco (`deriveBank`). Se `cam_on` true, manter o comportamento actual de auto-assign (respeitando owner-lock).

**Rationale**: Hoje o join **sempre** auto-assigna, mesmo com `cam_on: false` no body — contradiz FR-004/SC-003. Condicionar ao flag já enviado no body evita API nova.

**Alternatives considered**: Unassign depois do assign (race/flash no slot); parâmetro `prefer_bank` separado (redundante com `cam_on`).

## R3 — Ligar câmera depois (FR-010)

**Decision**: Em `PATCH .../voice/media`, quando a transição efectiva for para `cam_on: true` e o utilizador **ainda não** tiver slot, chamar `auto_assign_first_empty` (já no-op se `AssignedBy::Owner` em algum slot / sem slot livre / sem cena). Emitir `grid.updated` como no join. Não unassign automático ao desligar câmera nesta feature (comportamento actual de mute cam pode manter slot — fora do pedido).

**Rationale**: Clarificação: auto-slot só com atribuição automática + slot livre. `auto_assign_first_empty` já codifica owner-lock.

**Alternatives considered**: Só FE a pedir assign via API de grid admin (exige owner); auto-assign também ao unmute local sem PATCH (desincroniza ocupação).

## R4 — Captura e LiveKit sem vídeo

**Decision**: Caminho sem câmera: `getUserMedia({ audio: true, video: false })`; `joinLiveRoom` **sem** `localVideo` e **sem** `setCameraEnabled(true)` (hoje o fallback força câmera — corrigir). Publicar só microfone. Ao ligar câmera pela primeira vez nessa sessão, adquirir vídeo (`setCameraEnabled(true)` ou `getUserMedia` + publish) e `reportMedia(..., true)`.

**Rationale**: FR-007 / SC-004 — não pedir permissão de câmera no caminho banco. O fallback actual em `liveClient.ts` quebraria a escolha.

**Alternatives considered**: Entrar com track de vídeo muted (ainda pede permissão de câmera); placeholder canvas (complexidade desnecessária).

## R5 — Microfone e move entre canais

**Decision**: Mic default ligado no join (como hoje) em ambos os caminhos, salvo UI futura. Ao **mover** de canal de voz, voltar a apresentar o par de botões no destino (nova escolha por tentativa).

**Rationale**: Spec assumptions; edge case de move.

**Alternatives considered**: Lembrar última escolha na sessão (opcional, não obrigatório).

## R6 — Relação com 031

**Decision**: No caminho «com câmera», falha de vídeo continua a ser tratada pela política 031 (se implementada): não ficar «conectado» falso. No caminho «sem câmera», falha de vídeo não bloqueia o join.

**Rationale**: Spec depends-on / assumptions.

**Alternatives considered**: Bloquear join sem câmera até 031 (desnecessário — 032 reduz dependência de vídeo).
