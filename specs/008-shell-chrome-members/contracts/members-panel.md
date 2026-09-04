# Contract: Members panel (UI + API)

## API (existente)

```
GET /api/servers/{server_id}/members
Authorization: Bearer <token>
```

**200**: array de `{ account_id: string, handle: string, ... }` (campos já devolvidos pelo backend).

**401/403/404**: painel mostra erro; não inventar membros.

Sem endpoints novos nesta feature.

## UI

| Elemento | Contrato |
|----------|----------|
| Trigger | Botão/ícone «Membros» no **cabeçalho** do canal de texto e do canal de voz |
| Painel | Região à **direita** do conteúdo principal (coluna ou painel anexado ao shell/pane) |
| Conteúdo | Lista de handles do servidor actual (e account_id só se útil a11y) |
| Abrir | `membersPanelOpen = true` → fetch members |
| Troca de servidor | Se aberto: **manter** aberto + **refetch** para o novo `server_id` |
| Fechar | Mesmo botão (toggle) ou controlo explícito no painel |

## A11y

- Botão com `aria-expanded` reflectindo o painel.
- Lista com heading ou `aria-label` «Membros».
