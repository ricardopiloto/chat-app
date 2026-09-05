# Contract: Cabeçalhos e fontes

## Respostas HTTP (API + estático quando servido pelo mesmo processo)

MUST incluir:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy` com `frame-ancestors 'none'` e `default-src 'self'` (ver [research.md](../research.md) R8)
- `Strict-Transport-Security` só com cookie Secure / perfil produção

## Fontes

MUST NOT haver pedido a `fonts.googleapis.com` (nem outro CDN de tipos). Stack: `system-ui, sans-serif`.

## Fora

Não mudar `localStorage` das chaves de canal.
