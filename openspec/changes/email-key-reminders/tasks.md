# Tasks

## 1. Esquema e configuração

- [ ] 1.1 Criar a migração aditiva `0027` com `account.key_reminders` (padrão 1), `last_key_reminder_at` e `key_reminder_count` (padrão 0), actualizar `AccountRecord`, `ACCOUNT_COLS` (`db/account.rs`) e os literais (`register_inner`), e a flag `KEY_REMINDERS` em `config.rs` (com os literais de `Config`); verificar que `cargo test` compila, aplica as migrações e que os testes de conta continuam a passar.
- [ ] 1.2 Implementar `PATCH /api/auth/key-reminders` e expor a preferência em `AuthAccount` de forma aditiva; verificar em `backend/tests/contract/auth_key_reminders.rs` a alteração, a exigência de sessão e que outras contas não a veem.

## 2. E-mails

- [ ] 2.1 Escrever os modelos pt-BR/en de boas-vindas (com e sem chave) e de lembrete de canal, com a frase de que a chave nunca é recebida nem enviada; verificar com teste que os corpos não contêm chaves, códigos nem tokens e só ligam a `PUBLIC_BASE_URL`.
- [ ] 2.2 Agendar o e-mail de boas-vindas em `register_inner` depois do commit, em background, só para conta com e-mail verificado; verificar com testes de contrato: conta nova sem chave, com chave, sem e-mail e falha do provedor (cadastro intacto).
- [ ] 2.3 Agendar o lembrete no handler `channels::create_channel` (não em `provision_channel`), num `tokio::spawn` depois da resposta, com o UPDATE condicional atómico (24 h, teto de 3, `rows_affected()==1`); verificar em `backend/tests/contract/auth_key_reminders.rs` (registado em `tests/contract/mod.rs`): primeiro canal, segundo dentro de 24 h, quarto passadas 24 h (teto), conta que cria a chave entre dois canais, conta com chave, preferência desligada, conta sem e-mail, canal automático de servidor novo, e criação de canal inalterada com provedor falhado (servidor falso).

## 3. Frontend

- [ ] 3.1 Adicionar o interruptor «lembretes sobre a chave» nas definições da conta (`pages/Account.tsx`), o endpoint em `api/endpoints/auth.ts` e garantir que o link dos e-mails abre a conta no bloco da chave de recuperação, com i18n pt-BR/en; verificar com `npm run build`, `npm run lint`, `npm run test:contracts` e `npm run verify:i18n-keys`.

## 4. Documentação e integração

- [ ] 4.1 Actualizar `docs/contratos-e-fluxos.md`, `docs/arquitetura-tecnica.md` §4.3 («e-mails nunca carregam chaves»), README e runbook; verificar que o endpoint e a flag aparecem nos documentos.
- [ ] 4.2 Teste de integração ponta a ponta (cadastro → e-mail de boas-vindas no `LogSender`; criar canal → lembrete; segundo canal → nada) e actualizar `CHANGELOG.md`; verificar com `cargo test` completo.
