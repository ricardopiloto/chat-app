# UI Preferences Contract

Preferências **só no dispositivo**. Sem endpoints. Namespace `mesa.`.

## Keys

| Key | Values | Default if missing |
|-----|--------|-------------------|
| `mesa.theme` | `light`, `dark` | Seguir `prefers-color-scheme` (`dark` se desconhecido) |
| `mesa.viewMode` | `composition`, `grid` | `composition` |
| `mesa.stageMode` | `0`, `1` | `0` (opcional persistir; ao sair do canal preferir reset) |

## Semantics

- **theme**: define `data-theme` no contentor `.app`. Não altera `--stage` para claro.
- **viewMode**: Composição = cena activa; Grade = grelha local de todos na chamada. Global a todos os canais neste perfil de browser.
- Escrita: apenas após acção explícita do utilizador (toggle). Leitura: no boot da SPA e ao montar o canal de voz.

## Instance label (não persistido)

```text
instância · {location.hostname}
```

Exemplo: `instância · 127.0.0.1`, `instância · 192.168.0.142`.

## Non-goals

- Preferências por `channel_id` ou por conta no servidor.
- Sincronizar tema entre dispositivos.
