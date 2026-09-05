# Data model: 025-ws-disconnect-proxy

Sem entidades de persistência novas. Conceitos de sessão / ligação:

| Concept | Role |
|---------|------|
| **Call session** (`LiveSession` / `session` em `VoiceChannel`) | Sala LiveKit activa; `disconnect()` no leave |
| **App WebSocket** (`/ws`) | Eventos da app; permanece aberto após leave da chamada |
| **Media signaling WebSocket** (`/rtc` via Vite → LiveKit) | Fecha no leave; candidato ao erro de proxy |
| **Intentional leave** | `leave()` (Sair / navegação / channel|server deleted) vs queda de rede |
| **Dev WS proxy** | Vite `server.proxy` com `ws: true` para `/ws` e `/rtc` |

## State transitions (call)

```text
idle → joining → in_call → leaving → idle
                              │
                              ├─ stop local tracks / blur
                              ├─ await session.disconnect()  → /rtc close
                              └─ session = null; UI out of call
```

## Validation rules (from spec)

- Leave intencional → UI idle; participante já não activo; **0** logs `[vite] ws proxy error: … ended by the other party` atribuíveis a esse leave (salvo inevitável documentado).
- Rejoin após leave limpo sem recovery manual.
- Falha não intencional a meio da chamada continua observável.
