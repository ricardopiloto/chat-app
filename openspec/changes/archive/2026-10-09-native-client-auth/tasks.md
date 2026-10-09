# Tasks

## 1. Extractor de autenticação aceita o header Authorization

- [x] 1.1 Em `backend/src/api/auth/session.rs`, alterar `load_user` para, quando o cookie estiver ausente ou não corresponder a uma sessão válida, tentar o token do header `Authorization: Bearer <token>` com a mesma validação (`hash_token` + `db::session::find_by_token_hash` + `session.is_valid`) antes de devolver `None`. Verificar com um teste unitário (ou extensão de `backend/tests/contract/auth_session.rs`) que um pedido autenticado só por header é aceite.
- [x] 1.2 Confirmar que um pedido com cookie válido continua a autenticar sem olhar para o header (precedência do cookie) e que um cookie inválido com header válido autentica pelo header — cobrir ambos os casos em `backend/tests/contract/auth_session.rs`.
- [x] 1.3 Confirmar que um pedido sem cookie válido e sem header válido continua a resultar em 401 (endpoint obrigatório) / sessão ausente (endpoint opcional via `OptionalAuth`) — teste de regressão em `backend/tests/contract/auth_session.rs`.

## 2. Login, registo e reset devolvem o token no corpo

- [x] 2.1 Em `backend/src/domain/account.rs`, adicionar um campo `session_token: Option<String>` (nome a confirmar) a `AuthAccount` — valor `None` por omissão, para não mudar a serialização de quem já usa `auth_view()` sem token. Este é o ponto único de onde os quatro fluxos abaixo partem (`AccountRecord::auth_view()`, linhas 41-53).
- [x] 2.2 Nos quatro pontos que criam uma sessão nova e já devolvem `Json(<conta>.auth_view())` — `register()` (`backend/src/api/auth/register.rs:112`), `login()` (`backend/src/api/auth/login.rs:37`), `redeem_code()` (`backend/src/api/auth/recovery.rs:343`) e `redeem()` (`backend/src/api/auth/recovery_key.rs:249`) — preencher `session_token` com o token já disponível nesse call site antes de serializar, mantendo `with_session_cookie`/`jar` inalterados. Verificar com `backend/tests/contract/auth_register.rs` e `backend/tests/contract/auth_recovery.rs`/`auth_recovery_key.rs` que o corpo da resposta inclui o campo e que o cookie continua presente; adicionar um teste equivalente para `login()` em `backend/tests/contract/auth_session.rs` (hoje só cobre login sem inspecionar o corpo além do cookie).
- [x] 2.3 Confirmar que `put_recovery_key()` (`backend/src/api/auth/recovery_key.rs:310-333`) **não** ganha este campo — não cria sessão nova (usa `AuthUser`, sem `jar`/token) — e deixar isso explícito num comentário para não ser "corrigido" por engano numa limpeza futura.
- [x] 2.4 Documentar o nome do campo escolhido (`session_token`) num comentário junto à definição em `AuthAccount`, para que a change `frontend-instance-connect` o consuma sem ambiguidade.

## 3. Handshake de WebSocket aceita o mesmo header

- [x] 3.1 `ws_handler` (`backend/src/api/mod.rs:249-259`) autentica em **dois pontos independentes**, ambos têm de aceitar o header: (a) `OptionalAuth`, que já passa a aceitar o header através da Tarefa 1.1 (via `load_user`); (b) `auth::session::current_session_id(&state, &jar)` (`backend/src/api/auth/session.rs:64-76`), que hoje só lê a `CookieJar` e devolve o `session_id` usado pelo resto de `handle_socket`. Sem (b), uma ligação autenticada só por header falha no `ok_or_else(ApiError::unauthorized)` da linha 258 mesmo com um token válido. Extrair um helper partilhado por `load_user` e `current_session_id` (ex.: resolver primeiro a sessão completa — cookie ou header — e derivar dali a conta e o `session_id`) em vez de duplicar a leitura do header duas vezes.
- [x] 3.2 Verificar com um teste de integração que abre a ligação só com header (sem cookie) e confirma que `handle_socket` recebe o `session_id` correcto e que o `hub` associa a ligação à conta certa.
- [x] 3.3 Verificar que uma tentativa de ligação sem cookie válido e sem header válido continua a ser recusada da mesma forma que hoje (teste de regressão).

## 4. Logout continua a invalidar ambos os transportes

- [x] 4.1 Confirmar (teste de regressão, sem alteração de código esperada) que `POST /api/auth/logout` invalida o token na tabela `session` e que, a seguir, nem o cookie nem um header `Authorization` com o mesmo token antigo autenticam — cobrir em `backend/tests/contract/auth_session.rs`.

## 5. Verificação end-to-end

- [x] 5.1 Correr a suite de contrato completa (`cargo test --test contract` ou equivalente usado no repo) e confirmar que nenhum teste existente que dependia só do cookie regrediu.
- [x] 5.2 Escrever um cenário manual com `curl` (sem cookie jar, só `-H "Authorization: Bearer <token>"`) contra uma instância local a correr `cargo run`, cobrindo login → pedido autenticado por header → logout → mesmo header já não autentica, confirmando end-to-end o que os testes automatizados verificam de forma unitária.
