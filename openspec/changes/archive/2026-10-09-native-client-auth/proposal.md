# Proposal

## Why

O cliente desktop (Tauri) decidido para a Mesa (ver `docs/backlog/backlog.md` item 14 e a decisão já tomada de ser **só cliente**, sem backend embutido) carrega a interface de uma origem diferente da instância Mesa a que se liga (`tauri://localhost` ou `http://tauri.localhost`), e essa instância é escolhida pelo utilizador em runtime — não é conhecida em build time. A autenticação de hoje assume o oposto: o cookie de sessão (`Cookie::build((SESSION_COOKIE, token)).http_only(true).same_site(SameSite::Strict).secure(secure)`, `backend/src/api/auth/register.rs:81-89`) só é enviado pelo browser em pedidos same-origin, e a produção depende disso de forma explícita — o Nginx serve frontend e backend na mesma origem precisamente para que o cookie funcione (`docs/deploy-producao.md:31-34`). Sem alteração, um cliente nativo nunca tem o cookie disponível e não consegue autenticar-se contra uma instância arbitrária.

## What Changes

- As respostas de login, registo e reset de password (`POST /api/auth/login`, `POST /api/auth/register`, e os fluxos equivalentes de `recovery.rs`/`recovery_key.rs`) passam a incluir o token de sessão em claro no corpo JSON, além de continuarem a defini-lo como cookie `HttpOnly` exactamente como hoje. O cliente web ignora este campo (continua a autenticar-se só pelo cookie); um cliente nativo guarda-o (ex.: OS keychain) e usa-o como alternativa ao cookie.
- O extractor de autenticação (`AuthUser`/`OptionalAuth` em `backend/src/api/auth/session.rs`) passa a aceitar o mesmo token via header `Authorization: Bearer <token>`, com precedência do cookie quando ambos estão presentes. A validação é a mesma já existente (`hash_token` + `db::session::find_by_token_hash`) — não há novo tipo de credencial nem nova tabela.
- O handshake de WebSocket (`ws_handler`, `backend/src/api/mod.rs:249`) passa a aceitar o mesmo header `Authorization` como alternativa à `CookieJar` hoje usada para autenticar a ligação.
- Logout (`POST /api/auth/logout`) continua a invalidar o token na base de dados exactamente como hoje; como o cookie e o header transportam o mesmo token subjacente, invalidar um invalida ambos.
- **Fora de escopo explícito**: UI de configuração de instância e o próprio shell Tauri (changes seguintes), CORS (não é necessário — o cliente nativo não faz `fetch()` de browser), qualquer alteração a `SameSite`/`Secure` do cookie, expiração/refresh de token diferente do actual, e revogação granular por dispositivo (token único por sessão, como já é hoje).

## Capabilities

### New Capabilities

- `auth/session-tokens`: a sessão passa a ter dois transportes equivalentes para o mesmo token — cookie (cliente web, inalterado) e header `Authorization: Bearer` (clientes nativos) — cobrindo pedidos REST e o handshake de WebSocket.

### Modified Capabilities

(nenhuma — os três capabilities existentes sob `auth/` são `password-recovery` e `server-isolation`, nenhum dos quais define hoje como o token de sessão é transportado; esta change introduz essa definição como capability nova em vez de a sobrepor a um requisito já existente.)

## Impact

- **Backend** (`backend/src/api/auth/session.rs`): `load_user` passa a tentar o header `Authorization` quando não há cookie (ou quando o cookie não corresponde a uma sessão válida), antes de devolver "sem sessão".
- **Backend** (`backend/src/api/auth/register.rs`, `recovery.rs`, `recovery_key.rs`): as respostas JSON de login/registo/reset ganham o campo com o token em claro; a chamada a `with_session_cookie` mantém-se inalterada.
- **Backend** (`backend/src/api/mod.rs`, `ws_handler`): a extracção de identidade na upgrade de WebSocket passa a aceitar `Authorization` além da `CookieJar`.
- **Sem impacto**: `frontend/` (o cliente web continua a usar só o cookie; consumir o novo campo do corpo é trabalho da change `frontend-instance-connect`, não desta), CORS/`tower-http` (a feature `cors` mantém-se sem uso), schema da base de dados (nenhuma tabela nova), fluxo de password-recovery em si (só o transporte do token de sessão resultante muda).
