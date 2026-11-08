# Proposal

## Why

No Windows, o popout pode mostrar «Cannot join the call. Try again.» na primeira abertura; sair e voltar a entrar na chamada principal permite abrir o popout. O spec já exige ligação independente válida e não especifica tal falha.

## What Changes

- Diagnosticar a primeira abertura e corrigir a sequência de preparação de sessão/instância, handoff e pedido de token de visualização.
- Recuperar de falhas transitórias de preparação sem pedir que o utilizador saia da chamada principal.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. `call-popout` e `voice/popout-viewer-token` já exigem ligação funcional da janela independente.)

## Impact

- `frontend/electron/main.ts`, `preload.cjs`, `CallPopoutWindow.tsx`, `callSession.tsx` e inicialização de sessão/instância.
