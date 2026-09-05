# Contract: Pré-visualização de ligações (`POST /api/unfurl`)

**Auth**: sessão obrigatória (401 sem cookie). Sem BFF.

## Pedido

```json
{ "url": "https://example.com/page" }
```

`url` trim, 1–2048 chars, scheme `http` ou `https`.

## Validação de destino (antes do GET e após cada redirect, ≤3)

1. Host obrigatório; recusar `localhost` / `*.localhost`.
2. Resolver todos os endereços do host.
3. Recusar se **qualquer** IP for loopback, privado, link-local, unspecified, broadcast, ULA v6, ou `169.254.0.0/16`.
4. Recusar hostnames óbvios de metadados (já existentes) **além** da resolução.

## Corpo

- Timeout 5 s.
- Se `Content-Length` > 262144 → não descarregar; `error: unfurl_failed` ou 400.
- Ler no máximo 256 KiB.

## `image_url`

Só incluído se passar a mesma validação (http(s) + IPs públicos). Caso contrário omitir.

## Cliente

`LinkPreviews`: não pôr `src` em URLs que não comecem por `http://` ou `https://`.

## Erros

| Status | When |
|--------|------|
| 401 | Sem sessão |
| 400 | URL inválida / destino bloqueado |
| 200 + `error` | Falha de rede após validação OK |
