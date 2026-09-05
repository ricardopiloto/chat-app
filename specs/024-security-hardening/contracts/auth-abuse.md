# Contract: Abuso de autenticação

## Ritmo

`POST /api/auth/login` e `POST /api/auth/register`:

- Chave: IP da ligação TCP (não confiar em `X-Forwarded-For` nesta entrega, salvo documentação futura de proxy).
- **10** pedidos / **60** segundos / IP.
- Excesso: **429** `{ "error": "too many requests" }` — mesmo texto se o handle existe ou não.
- Testes: desactivar ou limite alto no `TestApp`.

## Login falhado

Sempre **401** `{ "error": "invalid credentials" }` — handle desconhecido e palavra-passe errada **idênticos**.

## Registo / handle

`409` `handle already exists` **mantém-se** (utilizador precisa de outro nome). FR-009 aplica-se ao **login**.

## Primeiro operador

Dentro de transação de escrita SQLite imediata: `COUNT(account)`. No máximo uma conta com `is_initial_operator=true`. Dois `POST /register` paralelos na instância vazia: um operador inicial; o outro ou membro normal (se ainda count==0 race resolved) ou 403 convite se o primeiro já commitou.
