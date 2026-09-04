# Data Model: 008-shell-chrome-members

Sem alterações de schema SQLite. Entidades de UI / sessão.

## ServerMember (existente — API)

| Campo | Tipo | Notas |
|-------|------|--------|
| account_id | string (UUID) | PK lógica |
| handle | string | Exibido na lista |
| (opcional) role / online | — | Fora de escopo se API não devolver |

Fonte: `GET /api/servers/{server_id}/members`. Relação: N membros por Server.

## UiChromeState (cliente)

| Campo | Tipo | Persistência | Notas |
|-------|------|--------------|--------|
| stageMode | boolean | `uiPrefs` (existente) | Liga/desliga palco |
| stageChannelsExpanded | boolean | opcional localStorage | Só relevante com `stageMode`; default false (faixa estreita) |
| membersPanelOpen | boolean | opcional localStorage | Default false |
| membersServerId | string \| null | derivado | Servidor cuja lista está no painel (= servidor seleccionado) |

### Transições

```
stageMode off → on: sidebar → strip (collapsed); rail visível; main full remaining
stageChannelsExpanded false → true: strip → sidebar width normal; stageMode permanece on
«Modo palco» off: stageMode false; grid normal; stageChannelsExpanded irrelevante
membersPanelOpen false → true: coluna direita / overlay lista; fetch members(serverId)
server change + membersPanelOpen: refetch members(newServerId); painel permanece aberto
```

## Validação (UI)

- Botão Membros só com `server_id` do canal activo.
- Lista vazia / erro de rede: mensagem curta, sem crash.
- Composer: largura = content box do pane (sem max-width artificial).
