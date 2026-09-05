# Data Model: 012-shell-iconography-typography

Sem alterações de schema SQLite nem de contratos REST/WS. Entidades de UI / sessão e um catálogo de design tokens.

## Catálogo de ícones (componente por linha, `frontend/src/components/icons/`)

| Ícone | Substitui | Usado em | Estados | FR |
|-------|-----------|----------|---------|----|
| `IconVoiceChannel` | prefixo `▸` | `Sidebar.tsx` (lista de canais de voz) | único | FR-001 |
| `IconMicOn` / `IconMicOff` | texto `Microfone`/`Mic off` | `VoiceChannel.tsx` (controlo de microfone) | ligado / desligado | FR-002, FR-003, FR-004 |
| `IconCameraOn` / `IconCameraOff` | texto `Câmara`/`Cam off` | `VoiceChannel.tsx` (controlo de câmara) | ligado / desligado | FR-002, FR-003, FR-004 |
| `IconPhoneHangup` | texto `Sair` | `VoiceChannel.tsx` (sair da chamada) | único | FR-002 |
| `IconLockClosed` | (nenhum, chip só tinha texto) | `.e2ee-chip` ativo (`Channel.tsx`, `VoiceChannel.tsx`) | único | FR-005 |
| `IconLockWarning` | (nenhum) | `.e2ee-chip.off` e `.e2ee-banner` | único | FR-005 |
| `IconSearch` | (inexistente) | `TopBar.tsx` | único | FR-006, FR-014, FR-015 |
| `IconBell` | (inexistente) | `TopBar.tsx` | com/sem indicador de atividade | FR-006, FR-016 |
| `IconSettings` | par de texto `Escuro`/`Claro` + clique no chip | `TopBar.tsx` → abre `SettingsPanel` | único | FR-006, FR-017 |
| `IconPlus` | carácter `+` | `Sidebar.tsx` (criar canal de texto/voz) | único | FR-008 |
| `IconMenu` | carácter `☰` | `TopBar.tsx` (`menu-toggle`, drawer narrow) | único | FR-008 |

Contrato de props comum (ver [contracts/icon-system.md](./contracts/icon-system.md)): `size?: number` (default 18–20 conforme contexto), `title?: string` (nome acessível), `class?: string`.

## `NotificationState` (cliente, em memória)

| Campo | Tipo | Persistência | Notas |
|-------|------|---------------|-------|
| `unseenByChannel` | `Map<string, boolean>` | Sinal SolidJS em memória, por sessão | `true` = há atividade não vista desde que o canal deixou de estar focado |
| `hasAnyUnseen` | `boolean` (derivado) | — | `unseenByChannel.size > 0`; controla o indicador no `IconBell` |

### Transições

```
ligação WS "message.new" para canal C, C ≠ canal focado → unseenByChannel.set(C, true)
utilizador abre/foca canal C                             → unseenByChannel.delete(C)
evento "channel.deleted" / "server.deleted" para C        → unseenByChannel.delete(C)
refresh da página                                          → unseenByChannel = novo Map() (vazio; sem persistência — ver Assumptions do spec)
```

## `SearchState` (cliente, transitório, por sessão de pesquisa aberta)

| Campo | Tipo | Notas |
|-------|------|-------|
| `query` | `string` | Mínimo 2 caracteres antes de disparar pedidos (debounce) |
| `status` | `"idle" \| "searching" \| "done"` | Controla indicador de carregamento progressivo |
| `results` | `Array<{ serverId, channelId, messageId, snippet }>` | Populado incrementalmente por canal, à medida que cada `GET /api/channels/{id}/messages` decifra e filtra |
| Âmbito | — | Implícito pelos servidores/canais devolvidos por `GET /api/servers` do utilizador atual (FR-014) — nunca pedido a servidores fora dessa lista |

## Tokens tipográficos (novos/alterados em `nocturne.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-mono` (novo) | `ui-monospace, "SF Mono", "Cascadia Code", "Consolas", "Fira Mono", monospace` | `.key-display`, `.members-handle`, código de convite (FR-009, FR-010) |
| `--font-heading-weight` (alterado) | passa a variar por nível: h1–h3 `650`, h4–h6 `500` (deixa de ser um único valor global) | Hierarquia de título (FR-011) |

## `SettingsPanelState` (cliente)

| Campo | Tipo | Persistência | Notas |
|-------|------|---------------|-------|
| `open` | `boolean` | Sinal local ao `TopBar`/`SettingsPanel`, sem persistência | Controla visibilidade do `Dialog` de definições |

## Validação (UI)

- Todo ícone com função própria (não decorativo) tem `title`/`aria-label` equivalente ao rótulo que substitui (FR-007).
- Pesquisa sem resultados ou com erro de rede num canal: falha silenciosa por canal (não interrompe os restantes), sem crash.
- Indicador de notificações nunca conta canais aos quais o utilizador perdeu acesso (limpo em `channel.deleted`/`server.deleted`).
