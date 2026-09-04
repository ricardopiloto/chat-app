# Contrato: eventos WebSocket (delta Fase 2)

Conexão e envelope iguais à Fase 1 ([`specs/002-fase-1-mvp/contracts/ws-events.md`](../../002-fase-1-mvp/contracts/ws-events.md)). Cliente continua a **não** publicar eventos de domínio; escritas passam pelo REST.

## `grid.updated` (já existe — sentido alargado)

Continua o contrato F1. Passa a disparar também quando:

- a **cena ativa** é activada (`POST .../activate`);
- o mapa da cena ativa é editado (`PUT /grid` ou `PATCH` da cena activa).

`payload.grid` é sempre o layout da cena **activa** (mesmo schema `grid-layout.json`). Não inclui `scene_id` para não quebrar clientes F1; o id da activa vai em `scene.changed`.

Não dispara ao criar/duplicar/apagar/editar cena **inativa**.

## `scene.changed` (novo)

Emitido a todo membro do Servidor quando a lista ou a activa daquele canal muda (CRUD, duplicar, activar, roles não entram aqui).

```json
{
  "event": "scene.changed",
  "server_id": "uuid",
  "payload": {
    "channel_id": "uuid",
    "active_scene_id": "uuid",
    "scenes": [
      { "id": "uuid", "name": "string", "is_active": true }
    ]
  }
}
```

`scenes` é o resumo da lista (sem layout) para a UI actualizar sem refetch. Quem precisa do mapa completo da activa já o recebe em `grid.updated` no mesmo activate.

## `channel_role.changed` (novo)

Emitido a todo membro do Servidor quando o conjunto de co-diretores daquele canal muda (`PUT /roles`).

```json
{
  "event": "channel_role.changed",
  "server_id": "uuid",
  "payload": {
    "channel_id": "uuid",
    "roles": [
      { "account_id": "uuid", "role": "co_director" }
    ]
  }
}
```

Usado para a UI esconder/mostrar o botão “ativar” sem recarregar.
