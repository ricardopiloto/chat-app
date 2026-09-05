# Contract: Arranque e perfil de produção

## Configuração

| Variável | Default | Produção |
|----------|---------|----------|
| `MESA_PRODUCTION` | unset/false | `1` ou `true` |
| `MESA_ENV` | unset | `production` também activa o perfil |
| `BIND` | `127.0.0.1:8080` | loopback + proxy TLS; LAN: `0.0.0.0:8080` **explícito** |
| `COOKIE_SECURE` | `false` | MUST `true` se perfil produção |
| `LIVEKIT_API_KEY` / `SECRET` | par de exemplo | MUST ser distinto de `instkey` / `instsecretinstsecretinstsecret12` |
| `LIVEKIT_WS_URL` | `ws://127.0.0.1:7880` | endereço que os **clientes** alcançam |

## Arranque

1. Carregar env.
2. `validate()`:
   - Se perfil produção e chaves de exemplo → **exit ≠ 0**, log claro, sem bind.
   - Se perfil produção e `COOKIE_SECURE` falso → **exit ≠ 0**.
3. Bind em `BIND`.

## Documentação

`docs/operar-instancia.md` MUST ter secção **Produção** (perfil, chaves únicas, HTTPS, bind, `LIVEKIT_WS_URL` LAN vs público) e MUST NOT apresentar o par de exemplo como receita de produção. O caminho «30 minutos» continua sem `MESA_PRODUCTION`.
