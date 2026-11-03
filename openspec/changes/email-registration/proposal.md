## Why

Hoje só se cria conta com um convite de servidor (excepto a primeira conta), e a conta não tem e-mail: não há prova de que a pessoa controla um endereço, nem caminho para abrir o produto a quem não recebeu convite. O `interactive-map` já resolveu o mesmo problema com o `registo-autonomo` (e-mail verificado antes de a conta existir, antispam, envio via Resend); o chat-app deve ter a mesma capacidade, adaptada ao seu cadastro com chaves E2E geradas no cliente.

## What Changes

- Novo pedido público de verificação: a pessoa informa só o e-mail (+ aceite de termos) e recebe um link com validade de 5 horas. Resposta sempre genérica, sem revelar se o e-mail já tem conta.
- O link abre o formulário de cadastro actual (handle, senha, chaves E2E, recuperação opcional) com o e-mail já provado e não editável. A conta **só passa a existir** quando esse formulário é submetido; não há contas pendentes.
- `POST /api/auth/register` aceita um campo opcional `email_token`. Com token válido o e-mail fica guardado e marcado como verificado na conta.
- Novo modo `REGISTO_MODO=fechado|aberto` (padrão `fechado`). `fechado` mantém o convite obrigatório e o fluxo por e-mail desligado; `aberto` permite criar conta só com e-mail verificado, sem entrar em nenhum servidor. O convite continua a funcionar nos dois modos, combinado ou não com o e-mail.
- Envio de e-mail por Resend (HTTPS, `reqwest` já presente) atrás de uma interface `EmailSender`, com implementação de log para desenvolvimento e testes. Novas variáveis `EMAIL_API_KEY`, `EMAIL_FROM`, `PUBLIC_BASE_URL`.
- Antispam: limite por IP e por e-mail canonicalizado (igual nos caminhos novo e já registado), honeypot, bloqueio de domínios descartáveis, normalização de aliases, Turnstile opcional.
- IP real atrás do Nginx: nova variável `TRUSTED_PROXY`; só com ela activa (e peer TCP em loopback) os novos limites usam o `X-Real-IP` definido pelo Nginx. Sem ela, o comportamento actual mantém-se. O modo `aberto` em produção exige `TRUSTED_PROXY=true`.
- Privacidade: o e-mail só é devolvido à própria conta (`/auth/me`) e passa a constar do inventário de metadados em claro.
- Limpeza periódica de verificações expiradas.
- Alterações de backend aditivas e retrocompatíveis: clientes sem `email_token` e instâncias em modo `fechado` comportam-se como hoje.

Fora de escopo, tratado em changes próprias que dependem desta: reset de senha por e-mail (`email-password-reset`) e e-mails de lembrete sobre a chave de recuperação após cadastro e criação de canal (`email-key-reminders`; nunca enviam chaves). Também fora: página de contato, e-mail em contas existentes, e-mail de convite de servidor.

## Capabilities

### New Capabilities
- `auth/email-registration`: verificação de e-mail antes do cadastro, modos de registo, antispam e ligação do e-mail verificado à conta criada.

### Modified Capabilities

## Impact

- Backend (Rust/axum/sqlx): nova migração (`email_verification`, colunas `email`, `email_canonical`, `email_verified_at` e `terms_accepted_at` em `account`), novo módulo `api/auth/email.rs`, serviço `email_sender`, `config.rs` (novos campos, segredos redigidos no `Debug`; literais de `Config` em `token/mod.rs` e nos testes), `AppState`/`TestApp`, `rate_limit.rs`, ajuste em `register.rs`, tarefa de limpeza no arranque.
- Frontend (`frontend/`, SPA Solid e cliente Electron): componente de pedido de e-mail, leitura de `#email_token` em `pages/Auth.tsx`, endpoints em `api/endpoints/auth.ts`, textos i18n, script `verify-email-registration.mjs`.
- Operação: variáveis de ambiente novas (incl. `TRUSTED_PROXY`), conta Resend com domínio verificado, trecho Nginx (`X-Real-IP`, `limit_req`), runbook. Documentação a actualizar: `docs/arquitetura-tecnica.md` §4.3, `docs/contratos-e-fluxos.md`, `docs/deploy-producao.md`, `docs/operar-instancia.md`.
- Risco aceite: no modo `aberto` qualquer conta com e-mail verificado pode criar servidores e anexos (sem cotas); o modo `fechado` é o rollback imediato.
- Dados: contas existentes ficam com `email` nulo; nenhuma migração de dados.
