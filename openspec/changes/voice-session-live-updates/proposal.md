# Proposal

## Why

O teste em produção mostrou listas de presença e permissões de chamada desactualizadas até uma recarga manual. Os specs já exigem ocupação e alterações de permissões em tempo real.

## What Changes

- Corrigir a propagação e reconciliação da ocupação de voz em todos os clientes que mostram o canal.
- Invalidar e actualizar o acesso efectivo do utilizador quando cargo ou ACL de canal muda, incluindo controlos já montados.
- Cobrir reconexão e respostas assíncronas antigas.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. `voice-session` já exige roster e ocupação imediatos; `server-management` já exige aplicação imediata das permissões.)

## Impact

- `frontend/src/shell/state.tsx`, `frontend/src/voice/callSession.tsx`, `Stage.tsx`, fluxos de alteração de cargos/ACL e eventos backend.
