# Quickstart: 024-security-hardening

Validar endurecimento sem BFF. Contratos: [contracts/](./contracts/).

## Pré-requisitos

Backend + frontend como no README. Para LAN, `LIVEKIT_WS_URL` = `ws://<IP-LAN>:7880` se houver telemóvel.

## Automação

```bash
cd backend && cargo test --test contract --test integration
cd frontend && npx tsc --noEmit
```

Esperado: testes novos de unfurl bloqueado, join com `Host` falso, envelope 403, ritmo (se não desligado), validate() de produção.

## §1 Produção vs LAN

1. Sem `MESA_PRODUCTION`, arranque com chaves de exemplo → OK.
2. `MESA_PRODUCTION=1` + chaves de exemplo → processo **não** escuta.
3. `MESA_PRODUCTION=1` + chaves únicas + `COOKIE_SECURE=true` → arranca.
4. Sem `BIND`, processo em **127.0.0.1** (não em `0.0.0.0` por omissão).

## §2 Unfurl

Logado: `POST /api/unfurl` `{ "url": "http://127.0.0.1/" }` → 400.  
`http://169.254.169.254/` → 400.  
Sem cookie → 401.

## §3 Auth

Muitos `POST /api/auth/login` falhados no mesmo IP → 429.  
Login handle inexistente vs password errada → mesmo JSON 401.

## §4 Voz

`POST .../voice/join` com header `Host: attacker.test` → `url` = `LIVEKIT_WS_URL` configurado.

## §5 Browser

SPA: DevTools → sem `fonts.googleapis.com`. Resposta da API inclui `frame-ancestors` / `X-Frame-Options`.

## §6 Docs

`docs/operar-instancia.md` tem secção Produção; o par de exemplo **não** é a receita dessa secção.
