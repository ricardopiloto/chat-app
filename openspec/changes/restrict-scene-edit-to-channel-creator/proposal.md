# Proposal

## Why

Hoje `Stage.tsx` mostra «Editar cena» ao dono do servidor, e `backend/src/api/scenes.rs` usa `is_channel_admin`, que também só reconhece o dono. O requisito é permitir a edição exclusivamente ao criador do canal.

## What Changes

- Autorizar edição da cena apenas se a conta autenticada for `channel.created_by_account_id`; retirar o privilégio automático do dono do servidor.
- Aplicar a mesma regra na UI e em todas as rotas backend que alteram a cena activa.
- Usar o criador já persistido pela migração `0006_channel_e2ee_key_delete.sql`, exposto no modelo `Channel`; não é necessária coluna nova.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-composition`: editor de cena restrito ao criador do canal.

## Impact

- `Stage.tsx`, `backend/src/api/scenes.rs`, testes de autorização e possivelmente `sceneStore.ts`. Canais anteriores à migração 0006 receberam o dono do servidor como criador por backfill; nesses canais o dono continuará a ser o criador registado.
