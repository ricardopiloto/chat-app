# Review — Desenvolvedor Fullstack

**Change:** email-password-reset
**Data:** 2026-11-03
**Veredito geral:** Bloqueado

Contexto lido: artefatos da change, `review-architect.md`, `backend/src/api/auth/{recovery,recovery_key}.rs`, `backend/src/main.rs` (CLI `reset-code`), `frontend/src/pages/Recover.tsx`, `frontend/src/session/session.tsx`, `frontend/src/crypto/keyHandoff.ts`, `backend/tests/contract/auth_recovery*.rs`. Não há CI de testes; a verificação é `cargo test` e os scripts `npm run build/lint/verify:*/test:contracts`.

## 1. Desenvolvimento do backend
Veredito: Atenção
- **`CredentialWrite` precisa de um campo novo** (`consume_email_token_id` ou equivalente) e `finish_credential_change` de um ramo que consuma o token na mesma transacção, como já faz com `operator_code_hash` e `consume_ticket_id` (`recovery.rs:36–60`, `:151`). Está implícito em tasks 2.2; tornar explícito, incluindo a resposta uniforme 401 quando o `UPDATE … WHERE used_at IS NULL AND expires_at > ?` não afecta 1 linha.
- **Papel do token no caminho com chave é inexistente no código.** `key/challenge`, `start` e `redeem` recebem só `handle`, ticket e assinatura. Hoje a task 2.3 diz que o token «não substitui a assinatura» mas nenhuma task o liga a esses endpoints. Sem decisão do arquiteto (ver abaixo) a task 2.3 não é implementável como está.
- **Aviso pós-reset (task 2.4).** `finish_credential_change` devolve `CredentialDone` e é chamada por três caminhos (`redeem_code`, `key/redeem`, `change_password` — este último é alteração com sessão, não reset). Definir exactamente em quais disparar o e-mail (os dois resets; e `change_password`?) e fazê-lo no `publish`/pós-commit, nunca dentro da transacção.
- **Migração:** a tabela `password_reset_email` não define índices nem a regra «um activo por conta». Especificar `UNIQUE(account_id)` com `INSERT … ON CONFLICT DO UPDATE` (padrão de `password_reset`, migração `0023`) para a invalidação do token anterior ser atómica.
- **Uniformidade de tempo:** o `202` com envio em background já está no desenho de `email-registration`; reutilizar o mesmo helper para não duplicar a lógica de limite por e-mail canonicalizado.
- **Flag `RESET_EMAIL`** aparece em tasks e design de rollback, mas não na spec nem em `config.rs`; ligá-la à validação de arranque de `email-registration` (task 1.1 dela).

## 2. Desenvolvimento do frontend
Veredito: **Bloqueante**
- **Não existe teste de componente.** Task 3.2 propõe `scripts/verify-email-reset.mjs`, correcto para o projeto, mas a verificação do fluxo de decisão chave/sem chave só se cobre bem extraindo a lógica para uma função pura testável (`crypto`/`auth` helper); caso contrário o script só prova leitura do fragmento. Definir o módulo.
- **`Recover.tsx` já mistura dois caminhos** com campos e confirmações próprias (`path()`, `accepted()`); acrescentar um terceiro estado («entrada por token») no mesmo componente complica-o. Criar sub-componentes (`RecoverEmailRequest`, `RecoverWithToken`) e rota própria (`/recover#reset_token=`).
- **Falta o ecrã de espera/aprovação** exigido pela decisão de segurança do arquiteto (reset sem chave não pode entregar chaves automaticamente): a UI precisa de um estado «conta aguarda aprovação/espera» e, para os outros membros, de uma forma de aprovar o handoff. Hoje `handleHandoffEvent` (`keyHandoff.ts:78`) responde sempre; mudar isto afecta todo o produto, não só a recuperação, e **não está em nenhuma task**. É o item bloqueante de frontend.
- Responsividade: a tela reutiliza `AuthFrame`; sem tarefa para 360 px. Atenção menor.
- i18n e `verify:i18n-keys` existem; OK.

## 3. Deploy e operação
Veredito: Atenção
- Sem porta ou processo novo. Variáveis: `RESET_EMAIL`; documentar no runbook (task 4.1 já cobre).
- **Operação humana:** com o reset por e-mail, o operador deixa de ser o gate; o runbook deve dizer como o operador revoga/bloqueia um reset suspeito (hoje só existe `reset-code` na CLI, `main.rs`). Considerar um comando para invalidar tokens de reset de uma conta.
- **Observabilidade:** definir os campos de log do pedido e do resgate (reutilizar os de `email-registration`: finalidade, estado do provedor, prefixo do hash do e-mail) e um evento de auditoria «reset concluído por e-mail» (conta, caminho, IP) para investigação, sem e-mail nem token.

## 4. Qualidade de código
Veredito: Atenção
- Testes previstos: pedido, verify, redeem sem chave, aviso. Faltam: **concorrência** de dois resgates simultâneos do mesmo token (só um vence; padrão existente em `auth_recovery.rs`), **precedência** entre token expirado/senha curta (a senha curta não consome o token — a task 2.2 menciona mas a spec só cobre «código» no cenário do operador), e **regressão** dos três fluxos existentes quando a conta tem e-mail.
- Nome de ficheiro de teste: `auth_email_reset.rs` registado em `tests/contract/mod.rs` (já em tasks 1.2 sem registo explícito).
- Resiliência do envio: igual a `email-registration`; incluir teste com `ResendSender` falso para o e-mail de reset e para o aviso.
- Refactor não declarado: a mudança do handoff automático (se aceite) toca `keyHandoff.ts`, `key_envelopes` e a spec de crypto; deve ficar em design.md e numa change/spec própria, não escondida aqui.

## 5. Execução das decisões arquiteturais
Veredito: **Bloqueante**
- Concordo com o review do arquiteto: o reset por e-mail **sem chave** entrega as chaves de servidor automaticamente. Confirmado no código: `apply_identity_replacement` marca `pending` e emite `key_handoff.requested`; `handleHandoffEvent` responde sem interacção. Esta change não pode ser implementada com a segurança prometida enquanto isso não for decidido.
- O comportamento actual de `finish_credential_change` com `ReplaceAll` revoga sessões e fecha WebSockets (`publish` → `close_sessions`); reaproveitável sem mudança.

## Bloqueantes antes de implementar
1. Decisão de contenção do reset sem chave (aprovação/espera/remoção) e o trabalho de frontend/backend correspondente, hoje ausente das tasks.
2. Decidir o papel do token no fluxo com chave e reescrever a task 2.3 em conformidade.
3. Especificar a migração (unicidade por conta) e o novo campo de `CredentialWrite`.

## Limitações técnicas a reportar ao Arquiteto
- O handoff automático em `handleHandoffEvent` torna qualquer substituição de identidade sem humano num vazamento de chaves de servidor; é uma limitação do produto que a change expõe.
- `key/*` é totalmente público por handle; um token de e-mail não se encaixa sem alterar um endpoint já especificado.
- Perda de histórico no caminho sem chave: confirmar que o texto do aviso é bloqueante (checkbox) como no `code` path de `Recover.tsx`.
