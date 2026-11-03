# Tasks

## 1. Backend

- [ ] 1.1 Adicionar a flag `RESET_EMAIL` (padrão desligada) em `config.rs` e actualizar os literais de `Config` (`token/mod.rs`, `production_boot.rs`); verificar com `cargo test` (compila) e teste de que o endpoint responde 404 com a flag desligada.
- [ ] 1.2 Implementar `POST /api/auth/recovery/email/request` (202 uniforme, honeypot silencioso, limites por IP via `RealClientIp` e por e-mail canonicalizado, trabalho em background, envio depois de qualquer acesso à base) e os modelos pt-BR/en dos dois e-mails (com chave: handle + link `…/recover#handle=…`; sem chave: aviso para o operador), sem token nem chave; verificar em `backend/tests/contract/auth_email_reset.rs` (registado em `tests/contract/mod.rs`): conta com chave, conta sem chave, e-mail desconhecido, conta sem e-mail, 429 por IP, limite por alias, corpo sem token e falha do provedor com servidor falso.
- [ ] 1.3 Enviar o aviso de senha alterada depois do commit em `redeem_code` e `key/redeem` (e não em `change_password`); verificar com testes que o e-mail sai nos dois resets, não sai na alteração de senha e que uma falha do envio não impede o reset.
- [ ] 1.4 Verificar a regressão dos fluxos existentes com a conta tendo e-mail verificado; verificar com `auth_recovery.rs` e `auth_recovery_key.rs` a passar sem alteração.

## 2. Frontend

- [ ] 2.1 Adicionar o endpoint em `frontend/src/api/endpoints/auth.ts` e criar `RecoverEmailRequest` (e-mail, honeypot oculto, mensagem genérica) usado por `pages/Recover.tsx`; verificar com `npm run build`, `npm run lint` e `npm run test:contracts`.
- [ ] 2.2 Extrair uma função pura `parseRecoverFragment` e usá-la em `Recover.tsx` para ler `#handle=`, seleccionar o caminho «chave», preencher o handle e limpar o URL com `history.replaceState`; verificar com `scripts/verify-email-reset.mjs` registado em `package.json` e fluxo manual com `LogSender` (pedido → link → recuperação com chave).
- [ ] 2.3 Textos i18n pt-BR/en e validação a 360 px; verificar com `npm run verify:i18n-keys`.

## 3. Documentação e integração

- [ ] 3.1 Actualizar `docs/parecer-recuperacao-senha.md` (por que o e-mail não autoriza reset: handoff automático), `docs/contratos-e-fluxos.md`, README e runbook (flag, contas sem chave dependem do operador); verificar que o endpoint e a flag aparecem nos documentos.
- [ ] 3.2 Teste de integração ponta a ponta (pedido → e-mail com link → recuperação com chave → aviso) e actualizar `CHANGELOG.md`; verificar com `cargo test` completo e `npm run build`.
