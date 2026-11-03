# Tasks

## 1. Configuração, esquema e injeção

- [ ] 1.1 Adicionar a `backend/src/config.rs` os campos `REGISTO_MODO`, `EMAIL_API_KEY`, `EMAIL_FROM`, `PUBLIC_BASE_URL`, `EMAIL_LOG_FILE`, `TRUSTED_PROXY`, `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`, `REGISTO_DOMINIOS_BLOQUEADOS`, com segredos num tipo `Secret` de `Debug` redigido, e a validação de arranque (modo inválido; modo `aberto` em produção sem chave, remetente, HTTPS ou `TRUSTED_PROXY`); atualizar os literais de `Config` em `backend/src/token/mod.rs` e `backend/tests/contract/production_boot.rs`; verificar com `cargo test` (compila) e testes novos em `production_boot.rs` que cobrem cada recusa e que `format!("{:?}", config)` não contém os segredos.
- [ ] 1.2 Criar a migração `0026_email_registration.sql` (tabela `email_verification`, colunas nulas em `account`, índice único parcial em `email_canonical`) e actualizar `AccountRecord`, `ACCOUNT_COLS` (`db/account.rs`) e os literais de `AccountRecord`; verificar que `cargo test` compila, aplica as migrações e que as contas existentes e o `auth_register.rs` actual continuam a passar.
- [ ] 1.3 Acrescentar `Arc<dyn EmailSender>` a `AppState` (`lib.rs`, `build_state`) e ao `TestApp` (`backend/tests/common/mod.rs`), com `LogSender` em diretório temporário e helper que devolve o último link enviado; verificar com um teste de contrato mínimo que lê o link do `LogSender`.

## 2. Núcleo de e-mail

- [ ] 2.1 Implementar a canonicalização de e-mail e a verificação de domínio descartável (lista embutida + ficheiro opcional); verificar com testes unitários de alias, gmail com pontos, etiqueta `+`, domínio bloqueado e formato inválido.
- [ ] 2.2 Implementar o trait `EmailSender` com `ResendSender` (URL base configurável, timeout curto, nunca propaga erro) e `LogSender`, com os logs de diagnóstico (finalidade, estado HTTP, id do envio, prefixo do hash do canónico); verificar com testes contra um servidor HTTP local falso: sucesso, 4xx/5xx, timeout, e que os logs capturados não contêm token nem e-mail.
- [ ] 2.3 Escrever os modelos de e-mail (verificação com link `PUBLIC_BASE_URL/register#email_token=…`, e aviso «já tem conta» sem link de cadastro) em pt-BR e en; verificar com teste que o token está no fragmento e nunca em caminho/query.

## 3. API de verificação

- [ ] 3.1 Implementar o extractor `RealClientIp` (`X-Real-IP` só com `TRUSTED_PROXY` e peer em loopback) e os baldes `email_request` por IP e por e-mail canonicalizado em `rate_limit.rs`; verificar com testes de limite, de alias, de cabeçalho forjado, de peer não-loopback e de `MESA_RATE_LIMIT_DISABLED`, e que `allow_auth` não mudou.
- [ ] 3.2 Implementar `GET /api/auth/register/config` e a verificação opcional de Turnstile; verificar com teste de contrato (modo, chave pública presente/ausente, `captcha_failed`).
- [ ] 3.3 Implementar `POST /api/auth/email/request` (validações síncronas, `202` genérico, honeypot silencioso, trabalho em background com commit antes do envio, invalidação de tokens anteriores, aviso para conta existente); verificar em `backend/tests/contract/auth_email_registration.rs` (registado em `tests/contract/mod.rs`) os casos e-mail novo, existente, modo fechado, sem aceite, honeypot, descartável e 429 por IP.
- [ ] 3.4 Implementar `POST /api/auth/email/verify` (não consome; `email_token_invalid` único para inexistente/expirado/consumido/substituído; token no corpo); verificar com testes de contrato para cada estado, com `expires_at` ajustado directamente via `pool`.
- [ ] 3.5 Implementar a tarefa periódica de limpeza de verificações no arranque (`main.rs`); verificar com teste que apaga expiradas e consumidas >24 h e não toca em contas.

## 4. Cadastro com e-mail verificado

- [ ] 4.1 Estender `RegisterBody`/`register_inner` com `email_token` seguindo a ordem de erros da Decisão 4, guardar e-mail/canónico/verificação/aceite e consumir o token na transacção; verificar em `auth_email_registration.rs` e `auth_register.rs`: aberto sem convite, token+convite, convite inválido+token (403, token intacto), fechado exige convite, handle duplicado não consome o token, `email_taken`, e cliente antigo sem token.
- [ ] 4.2 Expor `email` e `email_verified_at` só em `AuthAccount` de forma aditiva; verificar que os testes de sessão/`me` existentes passam e que listas de membros, mencionáveis, convites e eventos WS não contêm o e-mail.
- [ ] 4.3 Verificar o backend com conta sem servidor (lista de servidores vazia, aceitar convite depois do cadastro); verificar com teste de contrato e com checagem manual do estado vazio `noServers` no shell.

## 5. Frontend

- [ ] 5.1 Adicionar em `frontend/src/api/endpoints/auth.ts` e `api/types.ts` os endpoints de configuração, pedido e validação e o campo `email_token`/`emailToken` em `register`/`session.register`; verificar com `npm run build` (tsc), `npm run lint` e estender `scripts/contracts` com os novos endpoints (`npm run test:contracts`).
- [ ] 5.2 Criar `frontend/src/auth/EmailRequest.tsx` (aceite, honeypot oculto, Turnstile condicional, mensagem genérica, erros por código) e usá-lo em `pages/Auth.tsx` só com modo `aberto`, também no cliente Electron; verificar com `npm run build`, `npm run lint` e roteiro manual com `LogSender` em web e desktop.
- [ ] 5.3 Tratar `#email_token` em `Auth.tsx`: ler `location.hash`, validar por `POST`, mostrar o e-mail fixo, enviar `email_token` no cadastro, limpar o URL com `history.replaceState`, voltar ao pedido se o token for inválido; verificar com `scripts/verify-email-registration.mjs` (leitura do fragmento, limpeza do URL, mapeamento dos códigos de erro) registado em `package.json`, e fluxo manual ponta a ponta (pedido → link no log → cadastro → sessão).
- [ ] 5.4 Adicionar textos i18n (pt-BR e en) para pedido, confirmação genérica e cada código de erro, e validar o layout a 360 px; verificar com `npm run verify:i18n-keys` e `npm run verify:i18n`.

## 6. Documentação e integração

- [ ] 6.1 Actualizar `docs/arquitetura-tecnica.md` §4.3 (e-mail como metadado em claro, só visível à própria conta), `docs/contratos-e-fluxos.md` (novos endpoints, códigos de erro, ordem de erros do cadastro) e `README.md` (registo por e-mail); verificar que cada endpoint e código da spec aparece nos documentos.
- [ ] 6.2 Actualizar `docs/deploy-producao.md` e `docs/operar-instancia.md`: variáveis novas, `TRUSTED_PROXY`, trecho Nginx (`proxy_set_header X-Real-IP $remote_addr;`, `limit_req` em `/api/auth/email/`), como diagnosticar «não recebi o e-mail» pelos logs, aviso de registo aberto sem cotas, e corrigir as referências `frontend-v2` para `frontend` onde forem tocadas; verificar que cada variável do código aparece no documento.
- [ ] 6.3 Teste de integração ponta a ponta no modo `aberto` com `LogSender` (pedido → link → cadastro sem convite → login) e no modo `fechado` (fluxo inalterado); verificar com `cargo test` completo e `npm run build`.
- [ ] 6.4 Actualizar `CHANGELOG.md` e executar o roteiro de migração numa instância de teste (Resend real, dois IPs distintos atrás do Nginx); verificar o e-mail recebido, baldes de limite separados por IP e o registo concluído.
