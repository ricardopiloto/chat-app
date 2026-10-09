# Review — Desenvolvedor Fullstack

**Change:** native-client-auth
**Data:** 2026-10-09 (revisão 2)
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend

Veredito: OK

- O ficheiro do login está agora correctamente identificado (`backend/src/api/auth/login.rs:37`), separado de `register.rs`.
- `tasks.md` 2.1/2.2 passam a apontar para o ponto único real de implementação — `AuthAccount` (`backend/src/domain/account.rs:41-53`) — com os quatro call sites exactos que criam sessão (`register.rs:112`, `login.rs:37`, `recovery.rs:343`, `recovery_key.rs:249`) listados explicitamente, em vez de tratar cada handler como uma edição isolada.
- `tasks.md` 2.3 agora distingue correctamente `put_recovery_key()` (`recovery_key.rs:310-333`) como o segundo call site de `auth_view()` em `recovery_key.rs` que **não** cria sessão nova e por isso não deve ganhar o campo — confirmado por leitura do código (usa `AuthUser`, sem `jar`/token na assinatura).
- `tasks.md` 3.1 nomeia agora explicitamente os dois pontos de autenticação do `ws_handler` (`OptionalAuth`/`load_user` e `current_session_id`, `backend/src/api/auth/session.rs:64-76`) e exige que ambos aceitem o header, com a recomendação concreta de extrair um helper partilhado. Isto fecha o gap que faria a autenticação de WebSocket por header falhar silenciosamente apesar de um token válido.

## 2. Desenvolvimento do frontend

N/A — change continua sem tocar `frontend/` (confirmado, sem alteração desde a revisão anterior).

## 3. Deploy e operação

Veredito: OK

- Sem porta/serviço/variável nova, como na revisão anterior. A recomendação de documentar o novo transporte em `docs/operar-instancia.md` não foi adicionada como tarefa própria em `tasks.md`, mas também não é um bloqueio de implementação — é follow-up operacional razoável para a change `frontend-instance-connect` (que é quem realmente vai expor isto a um utilizador final) registar, já que é lá que o fluxo ganha uma UI. Não reabro como achado bloqueante nesta revisão.

## 4. Qualidade de código

Veredito: OK

- O plano de testes continua realista com o harness existente (`TestApp::request_with`, `extra_headers`) e agora cobre explicitamente `login()` (`tasks.md` 2.2, antes ausente) e o cenário de WebSocket por header só depois de corrigido o ponto de `current_session_id` (`tasks.md` 3.1-3.2), que já não falha de forma previsível.
- Organização ainda contida nos módulos certos; a adição de um campo opcional em `AuthAccount` é exactamente o tipo de mudança mínima e central que evita duplicação entre os quatro handlers.

## 5. Execução das decisões arquiteturais

Veredito: OK

- As correcções não reabriram nenhuma decisão arquitectural — continuam dentro do que `design.md` já tinha decidido (header como alternativa ao cookie, mesmo token, sem CORS). A nova Decisão 3 do `design.md` (reconciliação com `docs/arquitetura-tecnica.md`) é uma nota de documentação, não uma mudança de abordagem.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
